import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { messageErreurConnexion } from '../lib/authErrors';
import type { ProfilRow } from '../types/database';
import { useNavigationStore } from './useNavigationStore';

export type { RoleUtilisateur as UserRole } from '../types/database';

/** Profil applicatif de l'utilisateur connecté (table `profils`). */
export type UserProfile = Pick<
  ProfilRow,
  'id' | 'ecole_id' | 'role' | 'nom' | 'prenom' | 'telephone' | 'email' | 'actif'
>;

/**
 * - initializing : lecture de la session enregistrée au démarrage ;
 * - signed_out : aucune session, l'écran de connexion s'affiche ;
 * - loading_profile : session valide, rôle en cours de lecture dans `profils` ;
 * - authenticated : session et profil actif chargés ;
 * - profile_error : session valide mais profil illisible (réseau, serveur).
 */
export type AuthStatus = 'initializing' | 'signed_out' | 'loading_profile' | 'authenticated' | 'profile_error';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  /** Information affichée sur l'écran de connexion (session expirée, compte refusé). */
  notice: string | null;
  /** S'abonne aux changements de session ; renvoie la fonction de désabonnement. */
  initialize: () => () => void;
  /** Renvoie un message d'erreur affichable, ou null si les identifiants sont acceptés. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  reloadProfile: () => void;
}

const PROFILE_COLUMNS = 'id, ecole_id, role, nom, prenom, telephone, email, actif';

/** Efface tout ce que l'application garde en mémoire pour le compte sortant. */
function clearApplicationState() {
  queryClient.clear();
  useNavigationStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Distingue une déconnexion demandée d'une session expirée ou révoquée.
  let signOutRequested = false;

  const closeSession = async (notice: string | null) => {
    signOutRequested = true;
    set({ status: 'signed_out', user: null, profile: null, notice });
    clearApplicationState();
    await supabase.auth.signOut({ scope: 'local' });
  };

  const loadProfile = async (user: User) => {
    set({ status: 'loading_profile', user, profile: null });

    const { data, error } = await supabase
      .from('profils')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .maybeSingle();

    // Une autre session a pris la main pendant la requête : ce résultat n'est plus le bon.
    if (get().user?.id !== user.id) return;

    if (error) {
      set({ status: 'profile_error' });
      return;
    }

    let refusal: string | null = null;
    if (!data) {
      refusal = "Ce compte n'est rattaché à aucun profil EcoSurv. Contactez la direction de votre établissement.";
    } else if (!data.actif) {
      refusal = 'Ce compte est désactivé. Contactez la direction de votre établissement.';
    } else if (data.role !== 'super_admin' && !data.ecole_id) {
      refusal = "Ce compte n'est rattaché à aucun établissement. Contactez la direction de votre établissement.";
    }

    if (refusal || !data) {
      await closeSession(refusal);
      return;
    }

    set({ status: 'authenticated', profile: data, notice: null });
  };

  return {
    status: 'initializing',
    user: null,
    profile: null,
    notice: null,

    initialize: () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user ?? null;
        const current = get();

        if (!user) {
          const expired = current.status === 'authenticated' && !signOutRequested;
          signOutRequested = false;
          set({
            status: 'signed_out',
            user: null,
            profile: null,
            notice: current.notice ?? (expired ? 'Votre session a expiré. Veuillez vous reconnecter.' : null),
          });
          clearApplicationState();
          return;
        }

        // Même compte (jeton rafraîchi, profil Auth mis à jour) : rien à recharger.
        if (current.user?.id === user.id && current.status === 'authenticated') {
          set({ user });
          return;
        }

        // Changement de compte sans déconnexion préalable : rien ne doit survivre du précédent.
        if (current.user && current.user.id !== user.id) clearApplicationState();

        // Hors du callback : un appel Supabase attendu ici bloquerait le verrou de session du client.
        void event;
        setTimeout(() => void loadProfile(user), 0);
      });

      return () => subscription.unsubscribe();
    },

    signIn: async (email, password) => {
      set({ notice: null });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? messageErreurConnexion(error) : null;
    },

    signOut: async () => {
      signOutRequested = true;
      set({ notice: null });
      // Portée locale : la session de cet appareil est supprimée même hors ligne,
      // sans déconnecter les autres appareils du même compte.
      await supabase.auth.signOut({ scope: 'local' });
      if (get().status !== 'signed_out') {
        set({ status: 'signed_out', user: null, profile: null });
        clearApplicationState();
      }
    },

    reloadProfile: () => {
      const { user } = get();
      if (user) void loadProfile(user);
    },
  };
});
