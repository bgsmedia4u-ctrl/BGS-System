import { supabase } from './supabase';

export async function getSyllabus(stream, year, classVal) {
  try {
    const { data: modules, error: modError } = await supabase
      .from('syllabus_modules')
      .select('*')
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', classVal)
      .order('created_at', { ascending: true });

    if (modError) {
      console.error('Syllabus query failed:', modError.message);
      return [];
    }

    if (!modules || modules.length === 0) {
      return [];
    }

    const { data: progress, error: progError } = await supabase
      .from('syllabus_progress')
      .select('*');

    if (progError) {
      console.error('Syllabus progress query failed:', progError.message);
    }

    const progressMap = {};
    if (progress) {
      progress.forEach(p => {
        progressMap[p.module_id] = p;
      });
    }

    return modules.map(m => ({
      ...m,
      progress: progressMap[m.id] || { status: 'not_started', completion_date: null }
    }));
  } catch (err) {
    console.error('Syllabus fetch error:', err);
    return [];
  }
}

export async function updateSyllabusProgress(moduleId, teacherId, status) {
  const completionDate = status === 'completed' ? new Date().toISOString().split('T')[0] : null;

  const { data, error } = await supabase
    .from('syllabus_progress')
    .upsert({
      module_id: moduleId,
      teacher_id: teacherId,
      status: status,
      completion_date: completionDate
    }, { onConflict: 'module_id,teacher_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSyllabusModule(data, userRole) {
  if (userRole !== 'admin') {
    throw new Error('Only admins can create syllabus modules.');
  }

  const { data: res, error } = await supabase
    .from('syllabus_modules')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return res;
}

// For Admin Dashboard to check org-wide progress
export async function getOrgWideSyllabusStats() {
  const { data: modules, error: modErr } = await supabase.from('syllabus_modules').select('id');
  if (modErr) throw modErr;
  
  const { data: progress, error: progErr } = await supabase.from('syllabus_progress').select('module_id, status').eq('status', 'completed');
  if (progErr) throw progErr;

  const total = modules.length;
  const completed = progress.length;

  return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
