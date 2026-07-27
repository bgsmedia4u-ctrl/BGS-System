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
  try {
    const payload = {
      stream: entryData.stream,
      year: entryData.year,
      class: entryData.class,
      day_of_week: entryData.day_of_week,
      period: entryData.period,
      subject: entryData.subject,
      teacher_id: entryData.teacher_id || null
    };

    let targetId = entryData.id;
    if (!targetId) {
      // Check if entry already exists in database for this specific slot and batch
      const { data: existing, error: findError } = await supabase
        .from('timetable')
        .select('id')
        .eq('stream', payload.stream)
        .eq('year', payload.year)
        .eq('class', payload.class)
        .eq('day_of_week', payload.day_of_week)
        .eq('period', payload.period)
        .maybeSingle();

      if (!findError && existing?.id) {
        targetId = existing.id;
      }
    }

    if (targetId) {
      const { data, error } = await supabase
        .from('timetable')
        .update(payload)
        .eq('id', targetId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('timetable')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Timetable save error:', error);
    throw new Error(error.message || 'Failed to save timetable entry to database.');
  }
}
