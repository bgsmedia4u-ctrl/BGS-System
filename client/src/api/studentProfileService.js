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
    .order('class', { ascending: true })
    .order('roll_number', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
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
      .eq('class', cls)
      .eq('roll_number', rollInt);

    if (excludeStudentId) {
      query = query.neq('id', excludeStudentId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Check roll number query failed:', error.message);
      return true;
    }
    return (data || []).length === 0;
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
    shift: studentData.shift || 'Morning Shift',
    status: studentData.status || 'Active',
    parent_name: studentData.parent_name?.trim() || null,
    email: studentData.email?.trim() || null,
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
    shift: targetShift || 'Morning Shift',
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

// ─── Remove Student (REMOVE) ───
export async function removeStudent(studentId) {
  const { data, error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)
    .select();

  if (error) throw error;
  return data;
}

// ─── Batch Remove Students ───
export async function batchRemoveStudents(studentIds) {
  if (!studentIds || studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from('students')
    .delete()
    .in('id', studentIds)
    .select();

  if (error) throw error;
  return data;
}

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
