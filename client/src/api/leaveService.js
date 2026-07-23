import { supabase } from './supabase';

export async function submitLeaveRequest(data) {
  const { data: res, error } = await supabase
    .from('leave_requests')
    .insert([
      {
        teacher_id: data.teacher_id,
        date: data.date,
        period: data.period,
        reason: data.reason,
        substitute_teacher_id: data.substitute_teacher_id || null
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return res;
}

export async function getTeacherLeaves(teacherId) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      substitute:substitute_teacher_id ( id, raw_user_meta_data )
    `)
    .or(`teacher_id.eq.${teacherId},substitute_teacher_id.eq.${teacherId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllPendingLeaves() {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      teacher:teacher_id ( id, raw_user_meta_data ),
      substitute:substitute_teacher_id ( id, raw_user_meta_data )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Structured for future email hook injection
export async function updateLeaveStatus(leaveId, status, substituteId = null) {
  const updateData = { status };
  if (substituteId) {
    updateData.substitute_teacher_id = substituteId;
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .update(updateData)
    .eq('id', leaveId)
    .select()
    .single();

  if (error) throw error;
  
  // Future: notifyStatusChange(data) stub here
  
  return data;
}
