import { supabase } from './supabase';

export async function getStudentAnalytics(stream, year, cls) {
  // 1. Fetch students for this batch
  const { data: students, error: stdErr } = await supabase
    .from('students')
    .select('id, name, roll_number')
    .eq('stream', stream)
    .eq('year', year)
    .eq('class', cls);

  if (stdErr) throw stdErr;
  if (!students || students.length === 0) return { attendanceData: [], subjectData: [], studentsOfConcern: [] };

  const studentIds = students.map(s => s.id);

  // 2. Fetch all attendance records for these students
  const { data: attendance, error: attErr } = await supabase
    .from('attendance_records')
    .select('student_id, is_absent')
    .in('student_id', studentIds);

  if (attErr) throw attErr;

  // 3. Fetch all mark entries for these students (we need the test dates to sort, so we join tests)
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
      attendancePercent: 100,
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
  // Marks structure: { subject: score, subject2: score2 }
  const subjectAverages = {}; // { Physics: { totalScore: 0, count: 0 }, ... }
  
  marks.forEach(m => {
    const s = studentMap[m.student_id];
    if (s && !m.is_absent && m.marks) {
      // Push test for trend analysis
      s.tests.push({
        date: m.tests.created_at,
        marks: m.marks
      });

      // Global Subject Averages
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

  // Format subject data for charts
  const subjectData = Object.entries(subjectAverages).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count)
  }));

  // Identify Students of Concern
  // Criteria: Attendance < 75% OR marks trending down (last 2 tests average is lower than previous tests, or just overall low performance)
  const studentsOfConcern = [];

  Object.values(studentMap).forEach(s => {
    let concernReasons = [];
    
    if (s.totalClasses > 0 && s.attendancePercent < 75) {
      concernReasons.push(`Low Attendance (${s.attendancePercent}%)`);
    }

    // Check mark trends
    if (s.tests.length >= 2) {
      s.tests.sort((a, b) => new Date(a.date) - new Date(b.date));
      const lastTest = s.tests[s.tests.length - 1].marks;
      const prevTest = s.tests[s.tests.length - 2].marks;
      
      let decliningSubjects = [];
      Object.keys(lastTest).forEach(subj => {
        if (prevTest[subj] && Number(lastTest[subj]) < Number(prevTest[subj]) - 10) {
          // Drop of more than 10 marks
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
