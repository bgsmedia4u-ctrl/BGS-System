import { supabase } from './supabase';

export async function getRecentReports(userId, limit = 10) {
  let query = supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId)
    .order('report_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getReportByDate(userId, targetDate) {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('report_date', targetDate)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveReport(payload, reportId = null) {
  if (reportId) {
    const { data, error } = await supabase
      .from('weekly_reports')
      .update(payload)
      .eq('id', reportId)
      .select('id')
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('weekly_reports')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return data;
  }
}
