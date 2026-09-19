import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserProfile } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';

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
      const userProfile = data as UserProfile;
      setProfile(userProfile);

      // Vérification du statut de l'école si rôle non super_admin
      if (userProfile.role !== 'super_admin' && userProfile.ecole_id) {
        const { data: ecoleData } = await supabase
          .from('ecoles')
          .select('id, nom, ville, telephone, email, statut_activation, statut_abonnement')
          .eq('id', userProfile.ecole_id)
          .maybeSingle();

        if (ecoleData) {
          useAuthStore.getState().setEcole(ecoleData);
          if (ecoleData.statut_activation !== 'active') {
            useNavigationStore.getState().navigateToPendingActivation();
          }
        }
      }
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
