import { supabase } from '../api/supabase';

/**
 * Normalizes a joined persons/employees row or legacy profiles row into a standard profile object.
 */
function normalizeProfile(personOrProfile) {
  if (!personOrProfile) return null;

  // If it's already a legacy profile row
  if ('role' in personOrProfile && !('employees' in personOrProfile)) {
    return {
      ...personOrProfile,
      staff_type: personOrProfile.staff_type || 'teaching',
      role: personOrProfile.role || 'teacher'
    };
  }

  // If it's a person row with embedded employees array/object
  const employeesProp = personOrProfile.employees;
  const employee = Array.isArray(employeesProp) 
    ? (employeesProp.length > 0 ? employeesProp[0] : {}) 
    : (employeesProp || {});

  return {
    id: personOrProfile.user_id || personOrProfile.id,
    person_id: personOrProfile.id,
    name: personOrProfile.first_name || personOrProfile.name || '',
    email: personOrProfile.email || '',
    phone: personOrProfile.phone || '',
    role: employee.role || personOrProfile.role || 'teacher',
    status: employee.status || personOrProfile.status || 'approved',
    subject: employee.subject || personOrProfile.subject || null,
    department: employee.department || personOrProfile.department || null,
    staff_type: employee.staff_type || personOrProfile.staff_type || 'teaching',
    created_at: personOrProfile.created_at,
    updated_at: personOrProfile.updated_at,
    // Preserve raw joins if present (e.g. weekly_reports)
    weekly_reports: personOrProfile.weekly_reports || employee.weekly_reports || []
  };
}

/**
 * Fetches profile by Auth user ID.
 */
export async function getProfileByUserId(userId) {
  try {
    // Try target model: persons -> employees
    const { data: personData, error: personError } = await supabase
      .from('persons')
      .select('*, employees(*)')
      .eq('user_id', userId)
      .maybeSingle();

    const hasLinkedEmployee = personData && (
      Array.isArray(personData.employees) 
        ? personData.employees.length > 0 
        : Boolean(personData.employees)
    );

    if (!personError && hasLinkedEmployee) {
      return normalizeProfile(personData);
    }
  } catch (err) {
    console.warn('persons query failed, falling back to profiles:', err);
  }

  // Fallback to legacy profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeProfile(data);
}

/**
 * Updates a user's phone number.
 */
export async function updateProfilePhone(userId, phone) {
  let personsUpdated = false;

  // Try target persons table first
  try {
    const { error: personError } = await supabase
      .from('persons')
      .update({ phone })
      .eq('user_id', userId);
    if (!personError) {
      personsUpdated = true;
    }
  } catch (e) {
    console.warn('Could not update phone in persons table:', e);
  }

  // Update profiles for fallback
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ phone })
    .eq('id', userId);

  if (!personsUpdated && profileError) {
    throw profileError;
  }
}

/**
 * Fetches all active/registered teachers.
 */
export async function getAllTeachers() {
  try {
    const { data: personsData, error: personsError } = await supabase
      .from('persons')
      .select('*, employees!inner(*)')
      .eq('employees.role', 'teacher')
      .order('first_name');

    if (!personsError && personsData && personsData.length > 0) {
      return personsData.map(normalizeProfile);
    }
  } catch (err) {
    console.warn('persons teachers query failed, falling back to profiles:', err);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Fetches teachers excluding current logged-in user (for substitute selection).
 */
export async function getTeachersExcluding(excludeUserId) {
  try {
    const { data: personsData, error: personsError } = await supabase
      .from('persons')
      .select('*, employees!inner(*)')
      .eq('employees.role', 'teacher')
      .neq('user_id', excludeUserId);

    if (!personsError && personsData && personsData.length > 0) {
      return personsData.map(normalizeProfile);
    }
  } catch (err) {
    console.warn('Fallback to profiles for substitute teachers list:', err);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'teacher')
    .neq('id', excludeUserId);

  if (error) throw error;
  return data || [];
}

/**
 * Fetches pending teacher applications.
 */
export async function getPendingTeachers() {
  try {
    const { data: personsData, error } = await supabase
      .from('persons')
      .select('*, employees!inner(*)')
      .eq('employees.role', 'teacher')
      .eq('employees.status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && personsData && personsData.length > 0) {
      return personsData.map(normalizeProfile);
    }
  } catch (e) {
    // fallback
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, created_at, status')
    .eq('role', 'teacher')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetches processed teacher applications (approved or rejected).
 */
export async function getProcessedTeachers() {
  try {
    const { data: personsData, error } = await supabase
      .from('persons')
      .select('*, employees!inner(*)')
      .eq('employees.role', 'teacher')
      .in('employees.status', ['approved', 'rejected'])
      .order('created_at', { ascending: false });

    if (!error && personsData && personsData.length > 0) {
      return personsData.map(normalizeProfile);
    }
  } catch (e) {
    // fallback
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, created_at, status')
    .eq('role', 'teacher')
    .in('status', ['approved', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Updates teacher approval status.
 */
export async function updateTeacherStatus(teacherId, status) {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  let personsSuccess = false;

  // Try updating target employees table first
  try {
    const { data: person } = await supabase
      .from('persons')
      .select('id')
      .eq('user_id', teacherId)
      .maybeSingle();

    if (person) {
      const { error: empError } = await supabase
        .from('employees')
        .update({ status })
        .eq('person_id', person.id);
      if (!empError) personsSuccess = true;
    }
  } catch (e) {
    console.warn('Could not update status in employees table:', e);
  }

  // Update legacy profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', teacherId)
    .select()
    .maybeSingle();

  if (!personsSuccess && error) throw error;
  return data || { id: teacherId, status };
}

/**
 * Fetches teachers along with their weekly reports for Admin portal.
 */
export async function getTeachersWithReports() {
  try {
    const { data: personsData, error: personsError } = await supabase
      .from('persons')
      .select('*, employees!inner(*)')
      .eq('employees.role', 'teacher')
      .order('first_name');

    if (!personsError && personsData && personsData.length > 0) {
      const userIds = personsData.map(p => p.user_id).filter(Boolean);
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('id, status, report_date, user_id')
        .in('user_id', userIds);

      const reportsByUserId = {};
      (reports || []).forEach(r => {
        if (!reportsByUserId[r.user_id]) reportsByUserId[r.user_id] = [];
        reportsByUserId[r.user_id].push(r);
      });

      return personsData.map(p => {
        const norm = normalizeProfile(p);
        norm.weekly_reports = reportsByUserId[norm.id] || [];
        return norm;
      });
    }
  } catch (err) {
    console.warn('persons teachers with reports query failed, falling back to profiles:', err);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*, weekly_reports(id, status, report_date)')
    .eq('role', 'teacher')
    .order('name');

  if (error) throw error;
  return data || [];
}
