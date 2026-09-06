import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const isTestMode = import.meta.env.DEV && (
                         window.location.search.includes('testMode=true') || 
                         (window as any).__TEST_BYPASS__ === true ||
                         localStorage.getItem('bannon_test_mode') === 'true'
                       );
      if (isTestMode) {
        localStorage.setItem('bannon_test_mode', 'true');
        return {
          uid: 'test-uid',
          email: 'MarquisWhitacre@gmail.com',
          displayName: 'Marquis Whitacre'
        };
      }
    }
    // Immediate load from local storage to avoid white screens
    const cached = localStorage.getItem('bannon_auth_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isTestActive = () => {
      return import.meta.env.DEV && typeof window !== 'undefined' && (
        window.location.search.includes('testMode=true') || 
        (window as any).__TEST_BYPASS__ === true ||
        localStorage.getItem('bannon_test_mode') === 'true'
      );
    };

    // Implement onAuthStateChange listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: User = {
          uid: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || 'User',
          photoURL: session.user.user_metadata?.avatar_url || undefined,
        };
        setUser(u);
        localStorage.setItem('bannon_auth_user', JSON.stringify(u));
      } else {
        if (isTestActive()) {
          // Keep mock user intact
        } else {
          setUser(null);
          localStorage.removeItem('bannon_auth_user');
        }
      }
      setLoading(false);
    });

    // Explicitly verify the current session against Firebase on page reload/mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          uid: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.full_name || 'User',
          photoURL: session.user.user_metadata?.avatar_url || undefined,
        };
        setUser(u);
        localStorage.setItem('bannon_auth_user', JSON.stringify(u));
      } else {
        if (isTestActive()) {
          // Keep mock user intact
        } else {
          setUser(null);
          localStorage.removeItem('bannon_auth_user');
        }
      }
      setLoading(false);
    }).catch((err) => {
      console.error("Firebase auth verification failed:", err);
      // Fallback: if session lookup fails but we have cached user, keep it but stop loading
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('bannon_auth_user');
    setLoading(false);
  };

  return { user, loading, logout };
}
