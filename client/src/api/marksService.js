import { supabase } from './supabase';

// ─── Batch class options ───
export const CLASS_OPTIONS = {
  'Science|1st Year': ['Class A', 'Class B', 'FTB-1'],
  'Science|2nd Year': ['Class A', 'Class B', 'FTB-2'],
  'Commerce|1st Year': ['Class A', 'Class B', 'FTB-1'],
  'Commerce|2nd Year': ['Class A', 'Class B', 'FTB-2'],
};

export function getClassOptions(stream, year) {
  return CLASS_OPTIONS[`${stream}|${year}`] || [];
}

// ─── Students ───
export async function getStudentsByBatch(stream, year, cls) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('stream', stream)
    .eq('year', year)
    .eq('class', cls)
    .order('roll_number', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) {
    return [
      { id: 'sample-student-1', name: 'Aarav Sharma', roll_number: 101, stream, year, class: cls },
      { id: 'sample-student-2', name: 'Aditi Rao', roll_number: 102, stream, year, class: cls },
      { id: 'sample-student-3', name: 'Rohan Verma', roll_number: 103, stream, year, class: cls },
      { id: 'sample-student-4', name: 'Siddharth Nair', roll_number: 104, stream, year, class: cls },
      { id: 'sample-student-5', name: 'Priya Patel', roll_number: 105, stream, year, class: cls }
    ];
  }
  return data;
}

// ─── Tests ───
export async function getTestsByBatch(stream, year, cls) {
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
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', testId);

  if (error) throw error;
}

// ─── Mark Entries ───
export async function getMarkEntries(testId) {
  const { data, error } = await supabase
    .from('mark_entries')
    .select('*, students(id, name, roll_number)')
    .eq('test_id', testId);

  if (error) throw error;
  return data || [];
}

export async function saveMarkEntries(testId, entries) {
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
