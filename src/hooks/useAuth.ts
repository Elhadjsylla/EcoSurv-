import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserProfile } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useEcoleStore } from '../store/useEcoleStore';

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
          .select('id, nom, ville, adresse, telephone, email, annee_scolaire, statut_activation, statut_abonnement')
          .eq('id', userProfile.ecole_id)
          .maybeSingle();

        if (ecoleData) {
          useAuthStore.getState().setEcole(ecoleData);
          useEcoleStore.getState().updateEcole({
            id: ecoleData.id,
            nom: ecoleData.nom || '',
            ville: ecoleData.ville || '',
            adresse: ecoleData.adresse || '',
            telephone: ecoleData.telephone || '',
            email: ecoleData.email || '',
            annee_scolaire: ecoleData.annee_scolaire || '',
            statut_activation: ecoleData.statut_activation,
            statut_abonnement: ecoleData.statut_abonnement as any,
          });
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
