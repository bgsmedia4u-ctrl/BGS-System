import { supabase } from './supabase';

// ─── Query Individual Student ───
export async function getStudentById(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ─── Query All Students ───
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('stream', { ascending: true })
    .order('year', { ascending: true })
    .order('class', { ascending: true });
  if (error) throw error;

  // Natural numeric sort by roll number so seeded students and registered students sort identically (1, 2, ... 10)
  return (data || []).sort((a, b) => {
    if (a.stream !== b.stream) return (a.stream || '').localeCompare(b.stream || '');
    if (a.year !== b.year) return (a.year || '').localeCompare(b.year || '');
    if (a.class !== b.class) return (a.class || '').localeCompare(b.class || '');
    const rollA = parseInt(a.roll_number, 10);
    const rollB = parseInt(b.roll_number, 10);
    if (!isNaN(rollA) && !isNaN(rollB)) {
      if (rollA !== rollB) return rollA - rollB;
    } else if (!isNaN(rollA)) {
      return -1;
    } else if (!isNaN(rollB)) {
      return 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

// ─── Query Student Marks with Test Metadata ───
export async function getStudentMarks(studentId) {
  const { data, error } = await supabase
    .from('mark_entries')
    .select('*, tests(*)')
    .eq('student_id', studentId);

  if (error) throw error;
  // Sort by test date/creation descending
  const sorted = (data || []).sort((a, b) => {
    const dateA = new Date(a.tests?.created_at || 0);
    const dateB = new Date(b.tests?.created_at || 0);
    return dateB - dateA;
  });

  return sorted;
}

// ─── Query Comprehensive Test & Marks Report ───
export async function getStudentTestReport(studentId, stream, year, cls) {
  // 1. Fetch all tests conducted for this student's batch
  let batchTests = [];
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', cls)
      .order('created_at', { ascending: false });
    if (!error && data) {
      batchTests = data;
    }
  } catch (e) {
    console.warn('Failed to fetch batch tests:', e);
  }

  // 2. Fetch all mark entries recorded for this student
  let markEntries = [];
  try {
    const { data, error } = await supabase
      .from('mark_entries')
      .select('*, tests(*)')
      .eq('student_id', studentId);
    if (!error && data) {
      markEntries = data;
    }
  } catch (e) {
    console.warn('Failed to fetch student mark entries:', e);
  }

  const markMap = new Map();
  markEntries.forEach(me => {
    markMap.set(me.test_id, me);
  });

  // Build combined list of tests: start with all batch tests conducted
  const allTests = [...batchTests];
  // Add any test the student wrote from previous classes or batches
  markEntries.forEach(me => {
    if (me.tests && !allTests.some(t => t.id === me.test_id)) {
      allTests.push(me.tests);
    }
  });

  // Sort tests by creation date descending
  allTests.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const testReports = allTests.map(test => {
    const entry = markMap.get(test.id);
    const isRecorded = Boolean(entry);
    const isAbsent = Boolean(!entry || entry.is_absent);
    const isAttended = Boolean(entry && !entry.is_absent);
    const marksObj = entry?.marks || {};

    const subjects = (test.subjects || []).map(s => {
      const name = typeof s === 'string' ? s : s.name;
      const maxMarks = typeof s === 'string' ? 100 : (Number(s.maxMarks) || 100);
      const score = marksObj[name] !== undefined && marksObj[name] !== '' ? Number(marksObj[name]) : null;
      return { name, maxMarks, score };
    });

    let totalScore = 0;
    let totalMaxMarks = 0;
    subjects.forEach(sub => {
      totalMaxMarks += sub.maxMarks;
      if (sub.score !== null && !isNaN(sub.score)) {
        totalScore += sub.score;
      }
    });

    const percentage = totalMaxMarks > 0 && isAttended ? Math.round((totalScore / totalMaxMarks) * 100) : 0;

    return {
      testId: test.id,
      testName: test.name,
      createdAt: test.created_at,
      subjects,
      marks: marksObj,
      totalScore,
      totalMaxMarks,
      percentage,
      isRecorded,
      isAttended,
      isAbsent
    };
  });

  const testsConducted = allTests.length;
  const testsAttended = testReports.filter(t => t.isAttended).length;
  const testsAbsent = testsConducted - testsAttended;

  const attendedReports = testReports.filter(t => t.isAttended && t.totalMaxMarks > 0);
  const averageScore = attendedReports.length > 0
    ? Math.round(attendedReports.reduce((sum, r) => sum + r.percentage, 0) / attendedReports.length)
    : 0;

  return {
    testsConducted,
    testsAttended,
    testsAbsent,
    averageScore,
    testReports
  };
}

// ─── Query Student Attendance History ───
export async function getStudentAttendance(studentId) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, attendance_sessions(*)')
    .eq('student_id', studentId);

  if (error) throw error;

  // Sort by session date descending
  const sorted = (data || []).sort((a, b) => {
    const dateA = new Date(a.attendance_sessions?.date || 0);
    const dateB = new Date(b.attendance_sessions?.date || 0);
    return dateB - dateA;
  });

  return sorted;
}

// ─── Query Compliances & Teacher Remarks ───
export async function getStudentCompliances(studentId) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('remarks, attendance_sessions(date)')
    .eq('student_id', studentId)
    .not('remarks', 'is', null)
    .not('remarks', 'eq', '');

  if (error) throw error;

  const sorted = (data || []).sort((a, b) => {
    const dateA = new Date(a.attendance_sessions?.date || 0);
    const dateB = new Date(b.attendance_sessions?.date || 0);
    return dateB - dateA;
  });

  return sorted.map(item => ({
    date: item.attendance_sessions?.date,
    remark: item.remarks
  }));
}

// ─── Uniqueness & Roll Number Helpers ───
export async function checkRollNumberAvailable(stream, year, cls, rollNumber, excludeStudentId = null) {
  const rollInt = parseInt(rollNumber, 10);
  if (isNaN(rollInt) || rollInt <= 0) return false;

  try {
    let query = supabase
      .from('students')
      .select('id, name, roll_number')
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', cls);

    if (excludeStudentId) {
      query = query.neq('id', excludeStudentId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Check roll number query failed:', error.message);
      return true;
    }
    // Match numerically to guarantee parity across string (seeds) and integer (registered) roll numbers
    const exists = (data || []).some(s => parseInt(s.roll_number, 10) === rollInt);
    return !exists;
  } catch (err) {
    return true;
  }
}

export async function getNextAvailableRollNumber(stream, year, cls) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('roll_number')
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', cls);

    if (error || !data || data.length === 0) return 1;

    const rollNumbers = data
      .map(s => parseInt(s.roll_number, 10))
      .filter(n => !isNaN(n) && n > 0);

    if (rollNumbers.length === 0) return 1;
    const maxRoll = Math.max(...rollNumbers);
    return maxRoll + 1;
  } catch (e) {
    return 1;
  }
}

// ─── Register Student (ADD) ───
export async function registerStudent(studentData) {
  const rollInt = parseInt(studentData.roll_number, 10);
  if (isNaN(rollInt) || rollInt <= 0) {
    throw new Error('Please specify a valid positive roll number.');
  }

  // Validate uniqueness in the specified batch
  const isAvailable = await checkRollNumberAvailable(
    studentData.stream,
    studentData.year,
    studentData.class,
    rollInt
  );

  if (!isAvailable) {
    throw new Error(
      `Roll No ${rollInt} is already occupied in ${studentData.stream} (${studentData.year}) - ${studentData.class}. Each student must have a unique roll number in their class.`
    );
  }

  const fullPayload = {
    name: studentData.name.trim(),
    stream: studentData.stream,
    year: studentData.year,
    class: studentData.class,
    roll_number: rollInt,
    parent_phone: studentData.parent_phone?.trim() || null,
    status: studentData.status || 'Active',
    parent_name: studentData.parent_name?.trim() || null,
    notes: studentData.notes?.trim() || null
  };

  try {
    const { data, error } = await supabase
      .from('students')
      .insert([fullPayload])
      .select()
      .single();

    if (error) {
      // Fallback if extended columns are not yet deployed in live schema
      if (error.message && (error.message.includes('column') || error.code === 'PGRST204')) {
        const corePayload = {
          name: fullPayload.name,
          stream: fullPayload.stream,
          year: fullPayload.year,
          class: fullPayload.class,
          roll_number: fullPayload.roll_number,
          parent_phone: fullPayload.parent_phone
        };
        const { data: retryData, error: retryError } = await supabase
          .from('students')
          .insert([corePayload])
          .select()
          .single();

        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Update Student Details ───
export async function updateStudent(studentId, studentData) {
  const rollInt = parseInt(studentData.roll_number, 10);
  if (isNaN(rollInt) || rollInt <= 0) {
    throw new Error('Please specify a valid positive roll number.');
  }

  // Check uniqueness excluding current student
  const isAvailable = await checkRollNumberAvailable(
    studentData.stream,
    studentData.year,
    studentData.class,
    rollInt,
    studentId
  );

  if (!isAvailable) {
    throw new Error(
      `Roll No ${rollInt} is already taken in ${studentData.stream} - ${studentData.class}. Please choose a unique roll number.`
    );
  }

  const updatePayload = {
    name: studentData.name.trim(),
    stream: studentData.stream,
    year: studentData.year,
    class: studentData.class,
    roll_number: rollInt,
    parent_phone: studentData.parent_phone?.trim() || null,
    shift: studentData.shift || 'Morning Shift',
    status: studentData.status || 'Active',
    parent_name: studentData.parent_name?.trim() || null,
    email: studentData.email?.trim() || null,
    notes: studentData.notes?.trim() || null,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      if (error.message && (error.message.includes('column') || error.code === 'PGRST204')) {
        const corePayload = {
          name: updatePayload.name,
          stream: updatePayload.stream,
          year: updatePayload.year,
          class: updatePayload.class,
          roll_number: updatePayload.roll_number,
          parent_phone: updatePayload.parent_phone
        };
        const { data: retryData, error: retryError } = await supabase
          .from('students')
          .update(corePayload)
          .eq('id', studentId)
          .select()
          .single();

        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Shift Student (SHIFT) ───
// Moves a student to a new Stream / Year / Class / Shift while preserving
// all their associated academic marks, attendance records, and personal profile data!
export async function shiftStudent(studentId, { targetStream, targetYear, targetClass, targetShift, targetRollNumber = null }) {
  let finalRollNumber = targetRollNumber ? parseInt(targetRollNumber, 10) : null;

  // If no roll number specified or invalid, or if roll number is already occupied in target batch:
  if (!finalRollNumber || isNaN(finalRollNumber) || finalRollNumber <= 0) {
    finalRollNumber = await getNextAvailableRollNumber(targetStream, targetYear, targetClass);
  } else {
    const isAvail = await checkRollNumberAvailable(
      targetStream,
      targetYear,
      targetClass,
      finalRollNumber,
      studentId
    );
    if (!isAvail) {
      // Auto-assign next free roll number
      finalRollNumber = await getNextAvailableRollNumber(targetStream, targetYear, targetClass);
    }
  }

  const shiftPayload = {
    stream: targetStream,
    year: targetYear,
    class: targetClass,
    roll_number: finalRollNumber,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('students')
      .update(shiftPayload)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      if (error.message && (error.message.includes('column') || error.code === 'PGRST204')) {
        const coreShiftPayload = {
          stream: targetStream,
          year: targetYear,
          class: targetClass,
          roll_number: finalRollNumber
        };
        const { data: retryData, error: retryError } = await supabase
          .from('students')
          .update(coreShiftPayload)
          .eq('id', studentId)
          .select()
          .single();

        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Batch Shift Students ───
export async function batchShiftStudents(studentIds, { targetStream, targetYear, targetClass, targetShift }) {
  if (!studentIds || studentIds.length === 0) return [];

  // Determine starting available roll number in destination
  let nextRoll = await getNextAvailableRollNumber(targetStream, targetYear, targetClass);
  const shiftedResults = [];

  for (const stuId of studentIds) {
    const res = await shiftStudent(stuId, {
      targetStream,
      targetYear,
      targetClass,
      targetShift,
      targetRollNumber: nextRoll
    });
    shiftedResults.push(res);
    nextRoll++;
  }

  return shiftedResults;
}

// ─── Permanent Student Deletion (DELETE) ───
// Permanently deletes student from the application and cleans up child records
export async function deleteStudentPermanently(studentId) {
  if (!studentId) return null;

  try {
    // Proactively clean up dependent rows to prevent foreign key blocks
    await Promise.allSettled([
      supabase.from('mark_entries').delete().eq('student_id', studentId),
      supabase.from('attendance_records').delete().eq('student_id', studentId),
      supabase.from('student_transport_assignments').delete().eq('student_id', studentId),
      supabase.from('transport_fees').delete().eq('student_id', studentId)
    ]);

    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to permanently delete student:', err);
    throw err;
  }
}

// ─── Batch Permanent Student Deletion ───
export async function batchDeleteStudentsPermanently(studentIds) {
  if (!studentIds || studentIds.length === 0) return [];

  try {
    await Promise.allSettled([
      supabase.from('mark_entries').delete().in('student_id', studentIds),
      supabase.from('attendance_records').delete().in('student_id', studentIds),
      supabase.from('student_transport_assignments').delete().in('student_id', studentIds),
      supabase.from('transport_fees').delete().in('student_id', studentIds)
    ]);

    const { data, error } = await supabase
      .from('students')
      .delete()
      .in('id', studentIds)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to batch permanently delete students:', err);
    throw err;
  }
}

// Backwards-compatible aliases
export const removeStudent = deleteStudentPermanently;
export const batchRemoveStudents = batchDeleteStudentsPermanently;

// ─── Admissions Helpers ───
export async function getAdmissions() {
  try {
    const { data, error } = await supabase
      .from('admissions')
      .select('*')
      .order('application_date', { ascending: false });

    if (error) {
      console.warn('Admissions table query:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function updateAdmissionStatus(admissionId, status) {
  try {
    const { data, error } = await supabase
      .from('admissions')
      .update({ status })
      .eq('id', admissionId)
      .select();

    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Failed to update admission status:', e);
    return null;
  }
}
