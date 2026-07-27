import { supabase } from './supabase';

export async function getTimetable(stream, year, classVal) {
  const fallbackTimetable = [
    { id: 'sample-tt-1', stream, year, class: classVal, day_of_week: 'Monday', period: '1st Period', subject: 'Physics (Lecture)', teacher: { id: 'demo-1', raw_user_meta_data: { full_name: 'Dr. Alok Verma' } } },
    { id: 'sample-tt-2', stream, year, class: classVal, day_of_week: 'Tuesday', period: '2nd Period', subject: 'Chemistry (Lab)', teacher: { id: 'demo-2', raw_user_meta_data: { full_name: 'Prof. Sneha Rao' } } },
    { id: 'sample-tt-3', stream, year, class: classVal, day_of_week: 'Wednesday', period: '3rd Period', subject: 'Mathematics', teacher: { id: 'demo-3', raw_user_meta_data: { full_name: 'Mr. Rajesh Kumar' } } }
  ];

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
      console.warn('Timetable query failed, using fallback:', error.message);
      return fallbackTimetable;
    }
    return (!data || data.length === 0) ? fallbackTimetable : data;
  } catch (err) {
    console.warn('Timetable fetch exception, using fallback:', err);
    return fallbackTimetable;
  }
}

export async function getTeacherTimetable(teacherId) {
  const fallbackTeacherTimetable = [
    { id: 'sample-ttt-1', teacher_id: teacherId, stream: 'Science', year: '2nd Year', class: 'Class A', day_of_week: 'Monday', period: '1st Period', subject: 'Physics — Advanced Mechanics' },
    { id: 'sample-ttt-2', teacher_id: teacherId, stream: 'Science', year: '2nd Year', class: 'Class A', day_of_week: 'Tuesday', period: '3rd Period', subject: 'Physics — Wave Optics' },
    { id: 'sample-ttt-3', teacher_id: teacherId, stream: 'Science', year: '1st Year', class: 'Class B', day_of_week: 'Thursday', period: '2nd Period', subject: 'Physics — Thermodynamics Lab' }
  ];

  try {
    const { data, error } = await supabase
      .from('timetable')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      console.warn('Teacher timetable query failed, using fallback:', error.message);
      return fallbackTeacherTimetable;
    }
    return (!data || data.length === 0) ? fallbackTeacherTimetable : data;
  } catch (err) {
    console.warn('Teacher timetable exception, using fallback:', err);
    return fallbackTeacherTimetable;
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
