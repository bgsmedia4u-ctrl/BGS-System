import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';

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
        fetchOrCreateProfile(authUser);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      
      if (authUser) {
        await fetchOrCreateProfile(authUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Fetch the profile from the database. If the DB trigger hasn't created it yet,
   * we create it manually as a fallback. This prevents the "Failed to load report"
   * error that happens when the user signs in for the first time.
   */
  async function fetchOrCreateProfile(authUser) {
    try {
      // Try to fetch the profile
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      // If the profile doesn't exist yet (trigger may have been slow), create it manually
      if (!data) {
        const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
        const email = authUser.email;

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            name,
            email,
            role: 'teacher', // Default role; admin must be set manually or via trigger
          })
          .select('*')
          .single();

        if (insertError) {
          // If insert also failed (e.g. conflict because trigger did create it), try fetching again
          console.warn('Insert profile fallback failed, retrying fetch:', insertError.message);
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          data = retryData;
        } else {
          data = newProfile;
        }
      }

      setProfile(data);
    } catch (err) {
      console.error('Unexpected error in profile fetch:', err);
    } finally {
      setLoading(false);
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
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  }

  async function updatePhone(phone) {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ phone })
      .eq('id', user.id);

    if (error) throw error;
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
        logout,
        updatePhone,
        isAdmin,
        fetchProfile: () => user ? fetchOrCreateProfile(user) : null,
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
