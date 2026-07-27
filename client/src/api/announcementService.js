import { supabase } from './supabase';

export async function getRecentAnnouncements(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Announcements query failed:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Announcements fetch error:', err);
    return [];
  }
}
