import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';

export interface UserProfile {
  id: string;
  ecole_id: string | null;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: UserRole;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, profile: null, isLoading: false }),
}));
