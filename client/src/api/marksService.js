import { supabase } from './supabase';

// ─── Batch class options ───
export const CLASS_OPTIONS = {
  'Science|1st Year': ['1st FTB', '1st Class A', '1st Class B', '1st Inspire', 'Class A', 'Class B'],
  'Science|2nd Year': ['2nd FTB - 1', '2nd FTB - 2', '2nd Class A', '2nd Class B', '2nd Inspire', 'Class A', 'Class B'],
  'Commerce|1st Year': ['1st FTB', '1st Class A', '1st Class B', '1st Inspire', 'Class A', 'Class B'],
  'Commerce|2nd Year': ['2nd FTB - 1', '2nd FTB - 2', '2nd Class A', '2nd Class B', '2nd Inspire', 'Class A', 'Class B'],
};

export function getClassOptions(stream, year) {
  return CLASS_OPTIONS[`${stream}|${year}`] || [];
}

// ─── Students ───
export async function getStudentsByBatch(stream, year, cls) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', cls)
      .order('roll_number', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Students query failed:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Students fetch error:', err);
    return [];
  }
}

// ─── Backend Security Verification ───
async function assertNotAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      throw new Error('Security Violation: Administrative staff are strictly prohibited from viewing or altering student academic marks.');
    }
  } catch (e) {
    if (e.message?.includes('Security Violation')) throw e;
  }
}

// ─── Tests ───
export async function getTestsByBatch(stream, year, cls) {
  await assertNotAdmin();
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('stream', stream)
    .eq('year', year)
    .eq('class', cls)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTest(name, stream, year, cls, subjects, userId) {
  await assertNotAdmin();
  const { data, error } = await supabase
    .from('tests')
    .insert({
      name,
      stream,
      year,
      class: cls,
      subjects,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A test with this name already exists for this class.');
    }
    throw error;
  }
  return data;
}

export async function deleteTest(testId) {
  await assertNotAdmin();
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', testId);

  if (error) throw error;
}

// ─── Mark Entries ───
export async function getMarkEntries(testId) {
  await assertNotAdmin();
  const { data, error } = await supabase
    .from('mark_entries')
    .select('*, students(id, name, roll_number)')
    .eq('test_id', testId);

  if (error) throw error;
  return data || [];
}

export async function saveMarkEntries(testId, entries) {
  await assertNotAdmin();
  // entries: [{ student_id, marks: { subject: score }, is_absent }]
  const rows = entries.map((e) => ({
    test_id: testId,
    student_id: e.student_id,
    marks: e.marks,
    is_absent: e.is_absent || false,
  }));

  const { error } = await supabase
    .from('mark_entries')
    .upsert(rows, { onConflict: 'test_id,student_id' });

  if (error) throw error;
}

