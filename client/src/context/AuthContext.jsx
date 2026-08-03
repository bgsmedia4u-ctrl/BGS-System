import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../api/supabase';
import { getProfileByUserId, updateProfilePhone } from '../data/profileService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const authGenerationRef = useRef(0);

  useEffect(() => {
    // 1. Check current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        fetchProfile(authUser);
      } else {
        authGenerationRef.current += 1;
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
        authGenerationRef.current += 1;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function fetchProfile(authUser) {
    const currentGen = ++authGenerationRef.current;
    try {
      const data = await getProfileByUserId(authUser.id);
      if (authGenerationRef.current !== currentGen) return;
      if (data) {
        setProfile(data);
      } else {
        // No profile found in DB — preserve existing or use pending fallback with no role
        console.warn('No profile found in database, using OAuth metadata fallback');
        setProfile((prev) => {
          if (prev && prev.id === authUser.id) return prev;
          return {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            role: null,
            status: 'pending',
            department: null,
            subject: null,
            staff_type: 'teaching',
            phone: authUser.phone || null
          };
        });
      }
    } catch (err) {
      if (authGenerationRef.current !== currentGen) return;
      console.error('Profile fetch failed, using OAuth metadata fallback:', err);
      setProfile((prev) => {
        if (prev && prev.id === authUser.id) return prev;
        return {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: null,
          status: 'pending',
          department: null,
          subject: null,
          staff_type: 'teaching',
          phone: authUser.phone || null
        };
      });
    } finally {
      if (authGenerationRef.current === currentGen) {
        setLoading(false);
      }
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

  async function logout() {
    authGenerationRef.current += 1;
    setLoading(true);
    await supabase.auth.signOut();
    authGenerationRef.current += 1;
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
  const isOffice = profile?.role === 'office';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        logout,
        updatePhone,
        isAdmin,
        isOffice,
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
