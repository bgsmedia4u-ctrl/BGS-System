import { supabase } from './supabase';
import pu1Syllabus from '../../Syllabus/1styear.json';
import pu2Syllabus from '../../Syllabus/2ndyear.json';

// ─── 1. MASTER READ-ONLY SYLLABUS LOADER ───
export async function getMasterChapters(academicYear, streamName, subjectName) {
  try {
    const chaptersSet = new Set();

    // Determine which JSON syllabus object(s) to check
    const checkPu1 = !academicYear || academicYear.includes('1st') || academicYear.includes('I ') || academicYear === '1st Year' || academicYear === '1st PUC';
    const checkPu2 = !academicYear || academicYear.includes('2nd') || academicYear.includes('II ') || academicYear === '2nd Year' || academicYear === '2nd PUC';

    const sources = [];
    if (checkPu1) sources.push(pu1Syllabus);
    if (checkPu2) sources.push(pu2Syllabus);
    if (sources.length === 0) sources.push(pu1Syllabus, pu2Syllabus);

    for (const data of sources) {
      if (!data || !data.streams) continue;
      const matchingStream = data.streams.find(s => 
        !streamName || s.name.toLowerCase() === streamName.toLowerCase()
      );
      
      const streamsToInspect = matchingStream ? [matchingStream] : data.streams;
      for (const st of streamsToInspect) {
        if (!st.subjects) continue;
        for (const sub of st.subjects) {
          if (!subjectName || sub.name.toLowerCase() === subjectName.toLowerCase()) {
            if (Array.isArray(sub.chapters)) {
              sub.chapters.forEach(ch => chaptersSet.add(ch));
            }
          }
        }
      }
    }

    // Also fetch any database-added supplementary modules (if created by Admin)
    try {
      const { data: dbModules } = await supabase
        .from('syllabus_modules')
        .select('chapter_name')
        .eq('subject', subjectName || '');
      if (dbModules) {
        dbModules.forEach(m => {
          if (m.chapter_name) chaptersSet.add(m.chapter_name);
        });
      }
    } catch (_) {
      // ignore table errors if empty or unreachable
    }

    return Array.from(chaptersSet);
  } catch (err) {
    console.error('Error in getMasterChapters:', err);
    return [];
  }
}

// Get available streams and subjects directly from read-only master JSONs
export function getMasterSyllabusStructure() {
  const allStreams = new Set();
  const allSubjects = new Set();
  const streamSubjectMap = {};

  [pu1Syllabus, pu2Syllabus].forEach(syl => {
    if (!syl || !syl.streams) return;
    syl.streams.forEach(st => {
      allStreams.add(st.name);
      if (!streamSubjectMap[st.name]) streamSubjectMap[st.name] = new Set();
      st.subjects?.forEach(sub => {
        allSubjects.add(sub.name);
        streamSubjectMap[st.name].add(sub.name);
      });
    });
  });

  const structuredMap = {};
  Object.keys(streamSubjectMap).forEach(key => {
    structuredMap[key] = Array.from(streamSubjectMap[key]);
  });

  return {
    years: ['1st PUC', '2nd PUC', '1st Year', '2nd Year'],
    streams: Array.from(allStreams),
    subjects: Array.from(allSubjects),
    streamSubjectMap: structuredMap
  };
}


// ─── 2. STRICT RBAC TEACHER ASSIGNMENT LOGIC ───
export async function getTeacherAssignments(userId, profileRole) {
  try {
    let assignments = null;
    try {
      let query = supabase
        .from('teacher_subject_assignments')
        .select(`
          id,
          teacher_id,
          academic_year,
          stream,
          class_name,
          subject,
          created_at
        `)
        .order('created_at', { ascending: true });

      // CRITICAL SECURITY ENFORCEMENT: Teachers can ONLY retrieve their own assigned subjects
      if (profileRole !== 'admin' && profileRole !== 'principal') {
        if (!userId) return [];
        query = query.eq('teacher_id', userId);
      }
      const res = await query;
      if (res.data) assignments = res.data;
    } catch (_) {
      assignments = null;
    }

    if (!assignments || assignments.length === 0) {
      // ── AUTO-ONBOARDING BOOTSTRAP: Synchronize from Teacher's profile & timetable ──
      if (!userId && profileRole !== 'admin' && profileRole !== 'principal') return [];
      
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name, subject, stream, academic_year, assigned_classes')
        .eq('id', userId || '')
        .maybeSingle();

      const bootstrapped = [];
      const seenKeys = new Set();

      // 1. Check teacher's schedule in Timetable
      if (userId) {
        try {
          const { data: tt } = await supabase
            .from('timetable')
            .select('subject, stream, academic_year, class_section')
            .eq('teacher_id', userId);

          if (tt && tt.length > 0) {
            tt.forEach(slot => {
              if (!slot.subject || ['Free Hour', 'Preparation Time', 'Lunch', 'Break'].includes(slot.subject)) return;
              const yr = slot.academic_year || '1st PUC';
              const isComm = ['Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Basic Mathematics'].includes(slot.subject);
              const str = slot.stream || (isComm ? 'Commerce' : 'Science');
              const cls = slot.class_section || `I PUC ${str} A`;
              const key = `${yr}_${str}_${cls}_${slot.subject}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                bootstrapped.push({
                  id: 'auto_tt_' + key,
                  teacher_id: userId,
                  teacher_name: prof?.name || 'Assigned Faculty',
                  academic_year: yr,
                  stream: str,
                  class_name: cls,
                  subject: slot.subject,
                  created_at: new Date().toISOString()
                });
              }
            });
          }
        } catch (_) {}
      }

      // 2. If timetable yielded nothing, derive from profile subject and assigned_classes
      if (bootstrapped.length === 0 && prof && prof.subject && prof.subject !== 'All Subjects') {
        const subName = prof.subject;
        const isComm = ['Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Basic Mathematics'].includes(subName);
        const defStream = prof.stream || (isComm ? 'Commerce' : 'Science');
        const assignedClasses = prof.assigned_classes ? prof.assigned_classes.split(',').map(c => c.trim()).filter(Boolean) : [];

        if (assignedClasses.length > 0) {
          assignedClasses.forEach(clsName => {
            let yr = prof.academic_year === 'Both 1st & 2nd PUC' ? '1st PUC' : (prof.academic_year || '1st PUC');
            const lowerCls = clsName.toLowerCase();
            if (lowerCls.startsWith('1st') || lowerCls.includes('1st') || lowerCls.includes('pu 1')) yr = '1st PUC';
            else if (lowerCls.startsWith('2nd') || lowerCls.includes('2nd') || lowerCls.includes('pu 2')) yr = '2nd PUC';

            bootstrapped.push({
              id: 'auto_prof_' + clsName + '_' + subName,
              teacher_id: userId,
              teacher_name: prof.name || 'Assigned Faculty',
              academic_year: yr,
              stream: defStream,
              class_name: clsName,
              subject: subName,
              created_at: new Date().toISOString()
            });
          });
        } else {
          bootstrapped.push({
            id: 'auto_prof_1_' + subName,
            teacher_id: userId,
            teacher_name: prof.name || 'Assigned Faculty',
            academic_year: '1st PUC',
            stream: defStream,
            class_name: '1st FTB',
            subject: subName,
            created_at: new Date().toISOString()
          });
          bootstrapped.push({
            id: 'auto_prof_2_' + subName,
            teacher_id: userId,
            teacher_name: prof.name || 'Assigned Faculty',
            academic_year: '2nd PUC',
            stream: defStream,
            class_name: '2nd FTB - 02',
            subject: subName,
            created_at: new Date().toISOString()
          });
        }
      }

      if (bootstrapped.length > 0) {
        // Automatically persist bootstrapped courses into database if possible
        try {
          await supabase.from('teacher_subject_assignments').insert(
            bootstrapped.map(b => ({
              teacher_id: b.teacher_id,
              academic_year: b.academic_year,
              stream: b.stream,
              class_name: b.class_name,
              subject: b.subject
            }))
          );
        } catch (_) {}
        return bootstrapped;
      }
      return [];
    }

    // Map teacher profile names for display
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, subject');
    
    const profileMap = {};
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.id] = p.name || 'Staff Member';
      });
    }

    return assignments.map(a => ({
      ...a,
      teacher_name: profileMap[a.teacher_id] || 'Assigned Faculty'
    }));
  } catch (err) {
    console.error('Failed to load subject assignments:', err.message);
    return [];
  }
}

export async function assignSubjectToTeacher(assignmentData, adminRole, currentUserId = null) {
  if (adminRole !== 'admin' && adminRole !== 'principal' && (!currentUserId || assignmentData.teacher_id !== currentUserId)) {
    throw new Error('Access Denied: Only Admins can assign subjects to other teachers.');
  }

  const payload = {
    teacher_id: assignmentData.teacher_id,
    academic_year: assignmentData.academic_year || '1st PUC',
    stream: assignmentData.stream || 'Science',
    class_name: assignmentData.class_name || '1st FTB',
    subject: assignmentData.subject
  };

  const { data, error } = await supabase
    .from('teacher_subject_assignments')
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This subject assignment already exists for this teacher.');
    }
    throw error;
  }
  return data;
}

export async function removeSubjectAssignment(assignmentId, adminRole) {
  if (adminRole !== 'admin') {
    throw new Error('Access Denied: Only Admins can reassign or delete teacher subject assignments.');
  }

  const { error } = await supabase
    .from('teacher_subject_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw error;
  return true;
}

export async function resetTeacherProgress(assignment, adminRole) {
  if (adminRole !== 'admin') {
    throw new Error('Access Denied: Only Admins can reset teacher completion data.');
  }

  const { error } = await supabase
    .from('teacher_syllabus_progress')
    .delete()
    .eq('teacher_id', assignment.teacher_id)
    .eq('academic_year', assignment.academic_year)
    .eq('stream', assignment.stream)
    .eq('class_name', assignment.class_name)
    .eq('subject', assignment.subject);

  if (error) throw error;
  return true;
}


// ─── 3. INDEPENDENT SYLLABUS PROGRESS TRACKER ───
export async function getAssignmentProgressWithMaster(assignment, userId, profileRole) {
  // CRITICAL SECURITY ENFORCEMENT: Teachers must never access another teacher's records
  if (profileRole !== 'admin' && profileRole !== 'principal' && assignment.teacher_id !== userId) {
    throw new Error('Access Denied: You cannot view or modify another teacher\'s syllabus progress.');
  }

  // 1. Fetch read-only master chapters
  const masterChapters = await getMasterChapters(assignment.academic_year, assignment.stream, assignment.subject);

  // 2. Fetch independent progress rows for this exact assignment
  const { data: progressRows, error } = await supabase
    .from('teacher_syllabus_progress')
    .select('*')
    .eq('teacher_id', assignment.teacher_id)
    .eq('academic_year', assignment.academic_year)
    .eq('stream', assignment.stream)
    .eq('class_name', assignment.class_name)
    .eq('subject', assignment.subject);

  if (error) console.warn('Could not fetch chapter progress:', error.message);

  const progressMap = {};
  if (progressRows) {
    progressRows.forEach(row => {
      progressMap[row.chapter_name] = row;
    });
  }

  // 3. Combine master chapter definition with teacher's unique progress record
  return masterChapters.map((chapterName, idx) => {
    const existing = progressMap[chapterName];
    return {
      index: idx + 1,
      chapter_name: chapterName,
      status: existing?.status || 'not_started',
      completion_percentage: existing?.completion_percentage !== undefined ? existing.completion_percentage : (existing?.status === 'completed' ? 100 : 0),
      remarks: existing?.remarks || '',
      updated_at: existing?.updated_at || null
    };
  });
}

export async function saveChapterProgressRecord(assignment, chapterName, status, percentage, remarks, userId, profileRole) {
  // CRITICAL SECURITY ENFORCEMENT: Teachers cannot edit another teacher's progress
  if (profileRole !== 'admin' && assignment.teacher_id !== userId) {
    throw new Error('Access Denied: You do not have permission to edit another teacher\'s progress.');
  }

  let cleanPerc = parseInt(percentage || 0, 10);
  if (isNaN(cleanPerc)) cleanPerc = 0;
  if (status === 'completed' && cleanPerc < 100) cleanPerc = 100;
  if (status === 'not_started') cleanPerc = 0;
  if (cleanPerc === 100) status = 'completed';
  else if (cleanPerc > 0 && status === 'not_started') status = 'in_progress';

  const payload = {
    assignment_id: assignment.id || null,
    teacher_id: assignment.teacher_id,
    academic_year: assignment.academic_year,
    stream: assignment.stream,
    class_name: assignment.class_name,
    subject: assignment.subject,
    chapter_name: chapterName,
    status: status,
    completion_percentage: cleanPerc,
    remarks: remarks || '',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('teacher_syllabus_progress')
    .upsert(payload, { 
      onConflict: 'teacher_id,academic_year,stream,class_name,subject,chapter_name' 
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save progress record:', error.message);
    throw error;
  }
  return data;
}


// ─── 4. PRINCIPAL & ADMIN CONSOLIDATED MONITORING DASHBOARD ───
export async function getConsolidatedPrincipalProgress() {
  try {
    // Fetch all active assignments across the institution
    const { data: assignments, error: assignErr } = await supabase
      .from('teacher_subject_assignments')
      .select('*');
    if (assignErr) throw assignErr;

    if (!assignments || assignments.length === 0) return [];

    // Fetch all staff profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, subject');
    const profileMap = {};
    if (profiles) {
      profiles.forEach(p => {
        profileMap[p.id] = p.name || 'Staff Member';
      });
    }

    // Fetch all progress entries
    const { data: allProgress } = await supabase
      .from('teacher_syllabus_progress')
      .select('teacher_id, academic_year, stream, class_name, subject, chapter_name, status, completion_percentage');

    // Build consolidated summary rows
    const consolidated = await Promise.all(assignments.map(async (assign) => {
      const masterChapters = await getMasterChapters(assign.academic_year, assign.stream, assign.subject);
      const totalChapters = masterChapters.length || 0;

      const teacherProgress = (allProgress || []).filter(p => 
        p.teacher_id === assign.teacher_id &&
        p.academic_year === assign.academic_year &&
        p.stream === assign.stream &&
        p.class_name === assign.class_name &&
        p.subject === assign.subject
      );

      let completedChapters = 0;
      let totalPercentageSum = 0;

      if (totalChapters > 0) {
        masterChapters.forEach(chName => {
          const rec = teacherProgress.find(r => r.chapter_name === chName);
          let perc = 0;
          if (rec) {
            perc = rec.completion_percentage !== undefined ? rec.completion_percentage : (rec.status === 'completed' ? 100 : 0);
            if (rec.status === 'completed' || perc === 100) completedChapters++;
          }
          totalPercentageSum += perc;
        });
      } else {
        // Fallback if no master chapters found
        completedChapters = teacherProgress.filter(p => p.status === 'completed').length;
        totalPercentageSum = teacherProgress.reduce((sum, p) => sum + (p.completion_percentage || (p.status === 'completed' ? 100 : 0)), 0);
      }

      const overallProgress = totalChapters > 0 ? Math.round(totalPercentageSum / totalChapters) : 0;
      let statusLabel = 'On Track';
      if (overallProgress < 40) statusLabel = 'Needs Attention';
      else if (overallProgress < 75) statusLabel = 'Behind Schedule';

      return {
        assignment_id: assign.id,
        teacher_id: assign.teacher_id,
        teacher_name: profileMap[assign.teacher_id] || 'Assigned Faculty',
        subject: assign.subject,
        class_name: assign.class_name,
        stream: assign.stream,
        academic_year: assign.academic_year,
        chapters_completed: completedChapters,
        total_chapters: totalChapters,
        progress_percentage: overallProgress,
        status: statusLabel,
        raw_progress: teacherProgress,
        master_chapters: masterChapters
      };
    }));

    return consolidated;
  } catch (err) {
    console.error('Error fetching consolidated progress:', err);
    return [];
  }
}


// ─── 5. LEGACY SUPPORT & ORG-WIDE STATS ───
export async function getSyllabus(stream, year, classVal) {
  try {
    const { data: modules } = await supabase
      .from('syllabus_modules')
      .select('*')
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', classVal);
    
    if (!modules || modules.length === 0) return [];
    
    const { data: progress } = await supabase.from('syllabus_progress').select('*');
    const progressMap = {};
    if (progress) progress.forEach(p => { progressMap[p.module_id] = p; });

    return modules.map(m => ({
      ...m,
      progress: progressMap[m.id] || { status: 'not_started', completion_date: null }
    }));
  } catch (_) {
    return [];
  }
}

export async function updateSyllabusProgress(moduleId, teacherId, status) {
  const completionDate = status === 'completed' ? new Date().toISOString().split('T')[0] : null;
  const { data, error } = await supabase
    .from('syllabus_progress')
    .upsert({ module_id: moduleId, teacher_id: teacherId, status: status, completion_date: completionDate }, { onConflict: 'module_id,teacher_id' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function createSyllabusModule(data, userRole) {
  if (userRole !== 'admin') throw new Error('Only admins can create syllabus modules.');
  const { data: res, error } = await supabase.from('syllabus_modules').insert([data]).select().single();
  if (error) throw error;
  return res;
}

export async function getOrgWideSyllabusStats() {
  try {
    const principalData = await getConsolidatedPrincipalProgress();
    if (principalData && principalData.length > 0) {
      let totalCh = 0;
      let completedCh = 0;
      principalData.forEach(item => {
        totalCh += item.total_chapters || 0;
        completedCh += item.chapters_completed || 0;
      });
      const perc = totalCh > 0 ? Math.round((completedCh / totalCh) * 100) : 0;
      return { total: totalCh, completed: completedCh, percentage: perc };
    }

    // Fallback to old table if no new assignments yet
    const { data: modules } = await supabase.from('syllabus_modules').select('id');
    const { data: progress } = await supabase.from('syllabus_progress').select('module_id, status').eq('status', 'completed');
    const total = modules ? modules.length : 0;
    const completed = progress ? progress.length : 0;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  } catch (_) {
    return { total: 0, completed: 0, percentage: 0 };
  }
}
