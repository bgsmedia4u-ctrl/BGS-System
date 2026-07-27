import { supabase } from './supabase';

export async function getRecentAnnouncements(limit = 5) {
  const fallbackAnnouncements = [
    {
      id: 'sample-ann-1',
      title: 'Midterm Examination Schedule & Mark Submission Guidelines',
      body: 'Please ensure all internal and midterm test marks for 1st & 2nd Year PUC are updated in the portal by this Friday.',
      posted_by: 'Principal Office',
      created_at: new Date().toISOString()
    },
    {
      id: 'sample-ann-2',
      title: 'Science Department Curriculum Coordination Meeting',
      body: 'All science department faculty members are requested to join the upcoming curriculum coordination briefing in Seminar Hall B.',
      posted_by: 'Academic Director',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Announcements query failed, using fallback:', error.message);
      return fallbackAnnouncements;
    }
    if (!data || data.length === 0) {
      return fallbackAnnouncements;
    }
    return data;
  } catch (err) {
    console.warn('Announcements fetch error, using fallback:', err);
    return fallbackAnnouncements;
  }
}
