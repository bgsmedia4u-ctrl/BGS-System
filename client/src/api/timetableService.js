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
      stream: entryData.stream || 'General',
      year: entryData.year || '1st Year',
      class: entryData.class || 'Section A',
      day_of_week: entryData.day_of_week,
      period: entryData.period,
      subject: entryData.subject || 'Free Hour',
      teacher_id: entryData.teacher_id || null
    };

    let targetId = entryData.id;
    if (!targetId) {
      // When a Teacher edits their schedule, check if they already have an entry for this day & period
      if (entryData.isTeacherEdit && payload.teacher_id) {
        const { data: existingSlot } = await supabase
          .from('timetable')
          .select('id')
          .eq('teacher_id', payload.teacher_id)
          .eq('day_of_week', payload.day_of_week)
          .eq('period', payload.period)
          .maybeSingle();

        if (existingSlot?.id) {
          targetId = existingSlot.id;
        }
      } else {
        // For Admin class view, check if entry already exists for this specific batch & slot
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

export async function deleteTimetableEntry(entryId) {
  if (!entryId) return;
  try {
    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('id', entryId);
    if (error) throw error;
  } catch (error) {
    console.error('Timetable delete error:', error);
    throw new Error(error.message || 'Failed to remove timetable slot.');
  }
}

