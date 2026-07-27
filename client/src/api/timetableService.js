import { supabase } from './supabase';

export async function getTimetable(stream, year, classVal) {
  try {
    const { data, error } = await supabase
      .from('timetable')
      .select(`
        *,
        teacher:teacher_id ( id, raw_user_meta_data )
      `)
      .eq('stream', stream)
      .eq('year', year)
      .eq('class', classVal);

    if (error) {
      console.error('Timetable query failed:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Timetable fetch exception:', err);
    return [];
  }
}

export async function getTeacherTimetable(teacherId) {
  try {
    const { data, error } = await supabase
      .from('timetable')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('Teacher timetable query failed:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Teacher timetable exception:', err);
    return [];
  }
}

export async function updateTimetableEntry(entryData) {
  // If entry exists (id), update it. Otherwise, insert it.
  const { data, error } = await supabase
    .from('timetable')
    .upsert({
      id: entryData.id, // Supabase will match by this if it exists, or by unique constraints
      stream: entryData.stream,
      year: entryData.year,
      class: entryData.class,
      day_of_week: entryData.day_of_week,
      period: entryData.period,
      subject: entryData.subject,
      teacher_id: entryData.teacher_id || null
    }, { onConflict: 'stream,year,class,day_of_week,period' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
