import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserProfile } from '../store/useAuthStore';

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, logout } =
    useAuthStore();

  useEffect(() => {
    // Vérification initiale de la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Écoute des changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, logout]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profils')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  };
}
