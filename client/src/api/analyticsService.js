import { supabase } from './supabase';

/**
 * Calculates analytics for a specific batch (stream, year, class)
 */
export async function getStudentAnalytics(stream, year, cls) {
  // 1. Fetch students for this batch
  const { data: students, error: stdErr } = await supabase
    .from('students')
    .select('id, name, roll_number, parent_phone')
    .eq('stream', stream)
    .eq('year', year)
    .eq('class', cls);

  if (stdErr) throw stdErr;
  if (!students || students.length === 0) return { overallAttendance: 0, subjectData: [], studentsOfConcern: [] };

  const studentIds = students.map(s => s.id);

  // 2. Fetch attendance records
  const { data: attendance, error: attErr } = await supabase
    .from('attendance_records')
    .select('student_id, is_absent')
    .in('student_id', studentIds);

  if (attErr) throw attErr;

  // 3. Fetch test marks
  const { data: marks, error: marksErr } = await supabase
    .from('mark_entries')
    .select(`
      student_id, 
      marks, 
      is_absent,
      tests ( created_at )
    `)
    .in('student_id', studentIds);

  if (marksErr) throw marksErr;

  // -- Aggregation --
  const studentMap = {};
  students.forEach(s => {
    studentMap[s.id] = {
      ...s,
      totalClasses: 0,
      absentClasses: 0,
      attendancePercent: 0,
      tests: []
    };
  });

  // Attendance Aggregation
  attendance.forEach(record => {
    const s = studentMap[record.student_id];
    if (s) {
      s.totalClasses++;
      if (record.is_absent) s.absentClasses++;
    }
  });

  // Calculate Attendance %
  let totalAttendanceSum = 0;
  let studentsCount = 0;

  Object.values(studentMap).forEach(s => {
    if (s.totalClasses > 0) {
      s.attendancePercent = Math.round(((s.totalClasses - s.absentClasses) / s.totalClasses) * 100);
      totalAttendanceSum += s.attendancePercent;
      studentsCount++;
    }
  });

  // Marks Aggregation
  const subjectAverages = {};
  
  marks.forEach(m => {
    const s = studentMap[m.student_id];
    if (s && !m.is_absent && m.marks) {
      s.tests.push({
        date: m.tests.created_at,
        marks: m.marks
      });

      Object.entries(m.marks).forEach(([subj, score]) => {
        const numScore = Number(score);
        if (!isNaN(numScore)) {
          if (!subjectAverages[subj]) subjectAverages[subj] = { total: 0, count: 0 };
          subjectAverages[subj].total += numScore;
          subjectAverages[subj].count++;
        }
      });
    }
  });

  const subjectData = Object.entries(subjectAverages).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count)
  }));

  // Identify Students of Concern (< 75% attendance or declining marks)
  const studentsOfConcern = [];

  Object.values(studentMap).forEach(s => {
    let concernReasons = [];
    
    if (s.totalClasses > 0 && s.attendancePercent < 75) {
      concernReasons.push(`Low Attendance (${s.attendancePercent}%)`);
    }

    if (s.tests.length >= 2) {
      s.tests.sort((a, b) => new Date(a.date) - new Date(b.date));
      const lastTest = s.tests[s.tests.length - 1].marks;
      const prevTest = s.tests[s.tests.length - 2].marks;
      
      let decliningSubjects = [];
      Object.keys(lastTest).forEach(subj => {
        if (prevTest[subj] && Number(lastTest[subj]) < Number(prevTest[subj]) - 10) {
          decliningSubjects.push(subj);
        }
      });

      if (decliningSubjects.length > 0) {
        concernReasons.push(`Declining marks in ${decliningSubjects.join(', ')}`);
      }
    }

    if (concernReasons.length > 0) {
      studentsOfConcern.push({
        ...s,
        reasons: concernReasons
      });
    }
  });

  return {
    overallAttendance: studentsCount > 0 ? Math.round(totalAttendanceSum / studentsCount) : 0,
    subjectData,
    studentsOfConcern
  };
}

/**
 * Fetches stream-wise toppers ranked by overall test performance
 */
export async function getStreamToppers(stream) {
  const { data: students, error: stdErr } = await supabase
    .from('students')
    .select('id, name, roll_number, stream, year, class')
    .eq('stream', stream);

  if (stdErr) throw stdErr;
  if (!students || students.length === 0) return [];

  const studentIds = students.map(s => s.id);

  const { data: marks, error: marksErr } = await supabase
    .from('mark_entries')
    .select('student_id, marks, is_absent')
    .in('student_id', studentIds);

  if (marksErr) throw marksErr;

  const scoreMap = {};
  students.forEach(s => {
    scoreMap[s.id] = { ...s, totalScore: 0, subjectCount: 0 };
  });

  (marks || []).forEach(m => {
    const s = scoreMap[m.student_id];
    if (s && !m.is_absent && m.marks) {
      Object.values(m.marks).forEach(score => {
        const num = Number(score);
        if (!isNaN(num)) {
          s.totalScore += num;
          s.subjectCount++;
        }
      });
    }
  });

  const toppers = Object.values(scoreMap)
    .filter(s => s.subjectCount > 0)
    .map(s => ({
      ...s,
      averageScore: Math.round((s.totalScore / s.subjectCount) * 10) / 10
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10);

  return toppers.map((t, idx) => ({ ...t, rank: idx + 1 }));
}

/**
 * Fetches irregular students across the entire institution (< 75% attendance)
 */
export async function getIrregularStudents(threshold = 75) {
  const { data: students, error: stdErr } = await supabase
    .from('students')
    .select('id, name, roll_number, stream, year, class, parent_phone');

  if (stdErr) throw stdErr;
  if (!students || students.length === 0) return [];

  const studentIds = students.map(s => s.id);

  const { data: attendance, error: attErr } = await supabase
    .from('attendance_records')
    .select('student_id, is_absent')
    .in('student_id', studentIds);

  if (attErr) throw attErr;

  const attMap = {};
  students.forEach(s => {
    attMap[s.id] = { ...s, totalClasses: 0, absentClasses: 0, attendancePercent: 0 };
  });

  (attendance || []).forEach(rec => {
    const s = attMap[rec.student_id];
    if (s) {
      s.totalClasses++;
      if (rec.is_absent) s.absentClasses++;
    }
  });

  return Object.values(attMap)
    .filter(s => s.totalClasses > 0)
    .map(s => ({
      ...s,
      attendancePercent: Math.round(((s.totalClasses - s.absentClasses) / s.totalClasses) * 100)
    }))
    .filter(s => s.attendancePercent < threshold)
    .sort((a, b) => a.attendancePercent - b.attendancePercent);
}
