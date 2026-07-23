import { supabase } from './supabase';

/**
 * Fetches all teachers whose status is 'pending'
 */
export async function getPendingTeachers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, created_at, status')
    .eq('role', 'teacher')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetches all teachers whose status is 'approved' or 'rejected'
 */
export async function getProcessedTeachers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, created_at, status')
    .eq('role', 'teacher')
    .in('status', ['approved', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Updates a teacher's approval status.
 * Requires admin privileges via RLS.
 */
export async function updateTeacherStatus(teacherId, status) {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', teacherId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
