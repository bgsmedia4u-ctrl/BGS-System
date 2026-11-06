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

export async function getAllAttendanceSessions(limit = 100) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*, attendance_records(id, student_id, is_absent, remarks)')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function deleteAttendanceSession(sessionId) {
  if (!sessionId) return;
  
  // Delete records first
  await supabase
    .from('attendance_records')
    .delete()
    .eq('session_id', sessionId);

  // Delete session
  const { error } = await supabase
    .from('attendance_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
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
  } else {
    // Touch session updated_at
    try {
      await supabase
        .from('attendance_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', session.id);
    } catch (e) {
      // Non-fatal
    }
  }

  // 2. Prepare records
  const recordsToInsert = records.map(r => ({
    session_id: session.id,
    student_id: r.student_id,
    is_absent: r.is_absent,
    remarks: r.remarks || null
  }));

  if (recordsToInsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('attendance_records')
      .upsert(recordsToInsert, { onConflict: 'session_id,student_id' });
      
    if (upsertErr) {
      console.warn('Upsert attendance fallback to delete-insert:', upsertErr.message);
      await supabase
        .from('attendance_records')
        .delete()
        .eq('session_id', session.id);
        
      const { error: insertErr } = await supabase
        .from('attendance_records')
        .insert(recordsToInsert);
        
      if (insertErr) throw insertErr;
    }
  }

  return session;
}

export async function toggleAttendanceRecord(recordId, currentIsAbsent) {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ is_absent: !currentIsAbsent })
    .eq('id', recordId)
    .select('*, attendance_sessions(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function setStudentAttendanceStatus(sessionId, studentId, isAbsent) {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert({ session_id: sessionId, student_id: studentId, is_absent: isAbsent }, { onConflict: 'session_id,student_id' })
    .select('*, attendance_sessions(*)')
    .single();

  if (error) throw error;
  return data;
}
