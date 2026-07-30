import { supabase } from './supabase';

export async function getStudentById(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

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

export async function getStudentCompliances(studentId) {
  // Currently utilizing attendance remarks as a proxy for compliances
  const { data, error } = await supabase
    .from('attendance_records')
    .select('remarks, attendance_sessions(date)')
    .eq('student_id', studentId)
    .not('remarks', 'is', null)
    .not('remarks', 'eq', '');

  if (error) throw error;
  
  // Sort descending
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
