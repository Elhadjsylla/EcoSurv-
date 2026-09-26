import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { useNavigationStore } from './useNavigationStore';

export type UserRole = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';

/** Le super admin n'a pas de portail metier : il ne dispose que de sa console. */
export type PortalRole = Exclude<UserRole, 'super_admin'>;

export interface UserProfile {
  id: string;
  ecole_id: string | null;
  nom: string;
  prenom: string;
  telephone: string | null;
  email?: string | null;
  role: UserRole;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EcoleInfo {
  id: string;
  nom: string;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  statut_activation: 'en_attente' | 'active' | 'suspendue';
  statut_abonnement?: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  ecole: EcoleInfo | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setEcole: (ecole: EcoleInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  ecole: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setEcole: (ecole) => set({ ecole }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    useNavigationStore.getState().reset();
    set({ user: null, profile: null, ecole: null, isLoading: false });
  },
}));

