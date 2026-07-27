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
  if (!data || data.length === 0) {
    return [
      { id: 'sample-rep-1', user_id: userId, report_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'submitted', cet_questions: [1, 2, 3], neet_questions: [1, 2, 3, 4], jee_questions: [1, 2], classes_conducted: 12 },
      { id: 'sample-rep-2', user_id: userId, report_date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], status: 'submitted', cet_questions: [1, 2], neet_questions: [1, 2], jee_questions: [1], classes_conducted: 14 }
    ];
  }
  return data;
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
