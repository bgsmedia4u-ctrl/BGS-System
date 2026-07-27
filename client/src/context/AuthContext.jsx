import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';
import { getProfileByUserId, updateProfilePhone } from '../data/profileService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        fetchProfile(authUser);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      
      if (authUser) {
        await fetchProfile(authUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function fetchProfile(authUser) {
    try {
      const data = await getProfileByUserId(authUser.id);
      if (data) {
        setProfile(data);
      } else {
        // No profile found in DB — create a fallback from Google OAuth metadata
        console.warn('No profile found in database, using OAuth metadata fallback');
        setProfile({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Teacher',
          email: authUser.email || '',
          role: 'teacher',
          status: 'approved',
          department: null,
          subject: null,
          staff_type: 'teaching',
          phone: authUser.phone || null
        });
      }
    } catch (err) {
      console.error('Profile fetch failed, using OAuth metadata fallback:', err);
      setProfile({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Teacher',
        email: authUser.email || '',
        role: 'teacher',
        status: 'approved',
        department: null,
        subject: null,
        staff_type: 'teaching',
        phone: authUser.phone || null
      });
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user);
    }
  }

  function loginWithGoogle() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }

  function loginAsDemoTeacher() {
    const demoUser = { id: 'demo-teacher-id-101', email: 'alok.verma@bgs.edu', user_metadata: { full_name: 'Dr. Alok Verma' } };
    const demoProfile = {
      id: 'demo-teacher-id-101',
      name: 'Dr. Alok Verma',
      email: 'alok.verma@bgs.edu',
      role: 'teacher',
      department: 'Science',
      subject: 'Physics',
      staff_type: 'teaching',
      status: 'approved',
      phone: '9876543210'
    };
    setUser(demoUser);
    setProfile(demoProfile);
    setLoading(false);
  }

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  }

  async function updatePhone(phone) {
    if (!user) return;
    await updateProfilePhone(user.id, phone);
    setProfile((prev) => (prev ? { ...prev, phone } : null));
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        loginAsDemoTeacher,
        logout,
        updatePhone,
        isAdmin,
        refreshProfile,
        fetchProfile: () => user ? fetchProfile(user) : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
