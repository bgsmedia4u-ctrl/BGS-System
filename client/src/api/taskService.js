import { supabase } from './supabase';

// Uses the current session's user ID automatically enforced by RLS, 
// but we pass teacherId for explicitness in the query.
export async function getTasks(teacherId) {
  const { data, error } = await supabase
    .from('teacher_tasks')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(teacherId, title, deadline) {
  const { data, error } = await supabase
    .from('teacher_tasks')
    .insert([
      { teacher_id: teacherId, title, deadline, status: 'todo' }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId, teacherId, updates) {
  const { data, error } = await supabase
    .from('teacher_tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('teacher_id', teacherId) // Double safeguard, though RLS handles it
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId, teacherId) {
  const { error } = await supabase
    .from('teacher_tasks')
    .delete()
    .eq('id', taskId)
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return true;
}
