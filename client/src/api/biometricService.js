import { supabase } from './supabase';

/**
 * Logs a new biometric file upload
 */
export async function logBiometricUpload(metadata) {
  const { data, error } = await supabase
    .from('biometric_upload_history')
    .insert([metadata])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Upserts biometric attendance records
 */
export async function upsertBiometricRecords(records) {
  const { data, error } = await supabase
    .from('biometric_attendance_records')
    .upsert(records, { onConflict: 'teacher_id,date' })
    .select();
    
  if (error) throw error;
  return data;
}

/**
 * Fetches all upload history
 */
export async function getBiometricHistory() {
  const { data, error } = await supabase
    .from('biometric_upload_history')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

/**
 * Fetches biometric records with optional date filters
 */
export async function getBiometricRecords(startDate = null, endDate = null) {
  let query = supabase
    .from('biometric_attendance_records')
    .select(`
      *,
      profiles(name, department, email)
    `)
    .order('date', { ascending: false });
    
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
