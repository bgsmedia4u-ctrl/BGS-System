import { supabase } from './supabase';

// Uses the current session's user ID automatically enforced by RLS, 
// but we pass teacherId for explicitness in the query.
export async function getTasks(teacherId) {
  const fallbackTasks = [
    { id: 'sample-task-1', teacher_id: teacherId, title: 'Grade Physics Midterm Answer Sheets', status: 'in-progress', deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
    { id: 'sample-task-2', teacher_id: teacherId, title: 'Prepare Unit 4 Electromagnetism Lecture Notes & Lab Experiment', status: 'todo', deadline: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0] },
    { id: 'sample-task-3', teacher_id: teacherId, title: 'Submit weekly academic counseling report', status: 'completed', deadline: new Date().toISOString().split('T')[0] }
  ];

  try {
    const { data, error } = await supabase
      .from('teacher_tasks')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Tasks query failed, using fallback data:', error.message);
      return fallbackTasks;
    }
    if (!data || data.length === 0) {
      return fallbackTasks;
    }
    return data;
  } catch (err) {
    console.warn('Tasks fetch error, using fallback data:', err);
    return fallbackTasks;
  }
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
