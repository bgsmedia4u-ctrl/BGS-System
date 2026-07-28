import { supabase } from './supabase';

// ─── FETCH TASKS ───

// Fetch tasks for a specific teacher (teacher view)
export async function getTasks(teacherId) {
  try {
    const { data, error } = await supabase
      .from('teacher_tasks')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Tasks query failed:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Tasks fetch error:', err);
    return [];
  }
}

// Fetch ALL tasks across all teachers (admin view)
export async function getAllTasks() {
  try {
    const { data, error } = await supabase
      .from('teacher_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('All tasks query failed:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('All tasks fetch error:', err);
    return [];
  }
}

// Fetch all teacher profiles for dropdown
export async function getAllTeacherProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, subject')
      .eq('role', 'teacher')
      .order('name', { ascending: true });

    if (error) {
      console.error('Profiles query failed:', error.message);
      return [];
    }
    return (data || []).filter(p => p.name);
  } catch (err) {
    console.error('Profiles fetch error:', err);
    return [];
  }
}

// ─── CREATE TASK (Admin only) ───
export async function createTask(assignedBy, teacherId, title, description, deadline, priority) {
  const { data, error } = await supabase
    .from('teacher_tasks')
    .insert([
      { 
        teacher_id: teacherId, 
        title, 
        description: description || '',
        deadline: deadline || null, 
        priority: priority || 'medium',
        status: 'todo',
        assigned_by: assignedBy,
        remarks: '',
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── UPDATE TASK (Both admin and teacher) ───
export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('teacher_tasks')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE TASK (Admin only) ───
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('teacher_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  return true;
}
