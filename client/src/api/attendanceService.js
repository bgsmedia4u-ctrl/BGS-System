import { supabase } from './supabase';

export async function getAttendanceSession(stream, year, cls, date) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('stream', stream)
    .eq('year', year)
    .eq('class', cls)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAttendanceRecords(sessionId) {
  if (!sessionId) return [];
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;
  return data || [];
}

export async function saveAttendance(stream, year, cls, date, records, userId) {
  // 1. Get or create session
  let session = await getAttendanceSession(stream, year, cls, date);
  
  if (!session) {
    const { data: newSession, error: sessionErr } = await supabase
      .from('attendance_sessions')
      .insert({
        stream, year, class: cls, date, created_by: userId
      })
      .select()
      .single();
      
    if (sessionErr) throw sessionErr;
    session = newSession;
  }

  // 2. Upsert records
  // Delete existing records for this session first
  const { error: delErr } = await supabase
    .from('attendance_records')
    .delete()
    .eq('session_id', session.id);
    
  if (delErr) throw delErr;

  // Insert new records
  const recordsToInsert = records.map(r => ({
    session_id: session.id,
    student_id: r.student_id,
    is_absent: r.is_absent,
    remarks: r.remarks || null
  }));

  if (recordsToInsert.length > 0) {
    const { error: insertErr } = await supabase
      .from('attendance_records')
      .insert(recordsToInsert);
      
    if (insertErr) throw insertErr;
  }
}
