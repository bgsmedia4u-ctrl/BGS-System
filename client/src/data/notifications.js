import { supabase } from '../api/supabase';

/**
 * Fetches available pre-approved notification templates.
 */
export async function getNotificationTemplates() {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching notification templates:', error);
    throw error;
  }
  return data || [];
}

/**
 * Sends SMS notification to selected teachers via notify-teacher Edge Function.
 */
export async function notifyTeachers({ templateId, recipientIds, variables }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  // Invoke notify-teacher Edge Function
  const { data, error } = await supabase.functions.invoke('notify-teacher', {
    body: { templateId, recipientIds, variables },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (error) {
    throw new Error(error.message || 'Failed to send SMS notification');
  }

  return data;
}

/**
 * Fetches sent notification log for admin view.
 */
export async function getNotificationLog() {
  const { data, error } = await supabase
    .from('notification_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('Error fetching notification log:', error);
    return [];
  }
  return data || [];
}

/**
 * Triggers automated/batch parent SMS alerts for absent students for a specific date.
 */
export async function triggerAbsentStudentSms(date) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const { data, error } = await supabase.functions.invoke('notify-absent-student', {
    body: { date },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (error) {
    throw new Error(error.message || 'Failed to trigger absent student SMS alerts');
  }

  return data;
}

/**
 * Triggers SMS notification to meeting attendees when a meeting is created or updated.
 */
export async function notifyMeetingAttendees({ meetingId, isUpdate = false }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const { data, error } = await supabase.functions.invoke('notify-meeting-attendees', {
    body: { meetingId, isUpdate },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (error) {
    console.warn('Meeting SMS notification issue:', error);
  }

  return data;
}
