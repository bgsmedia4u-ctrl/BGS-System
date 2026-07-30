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
    ]);

  if (error) throw error;
  return res;
}

export async function getTeacherLeaves(teacherId) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .or(`teacher_id.eq.${teacherId},substitute_teacher_id.eq.${teacherId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return await attachProfiles(data);
}

export async function getAllPendingLeaves() {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return await attachProfiles(data);
}

async function attachProfiles(leaves) {
  if (!leaves || leaves.length === 0) return leaves;

  const profileIds = new Set();
  leaves.forEach(l => {
    if (l.teacher_id) profileIds.add(l.teacher_id);
    if (l.substitute_teacher_id) profileIds.add(l.substitute_teacher_id);
  });

  const idsArray = Array.from(profileIds);
  if (idsArray.length === 0) return leaves;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', idsArray);

  const profileMap = {};
  if (profiles) {
    profiles.forEach(p => {
      // Create a mock raw_user_meta_data object to match the component's expectations
      profileMap[p.id] = { id: p.id, raw_user_meta_data: { full_name: p.name, name: p.name } };
    });
  }

  return leaves.map(l => ({
    ...l,
    teacher: l.teacher_id ? profileMap[l.teacher_id] : null,
    substitute: l.substitute_teacher_id ? profileMap[l.substitute_teacher_id] : null
  }));
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

