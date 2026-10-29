import { create } from 'zustand';
import { EcoleMock } from '../types';

export const INITIAL_ECOLE: EcoleMock = {
  id: '',
  nom: '',
  adresse: '',
  telephone: '',
  email: '',
  devise: 'MRU',
  statut_activation: 'active',
  date_creation: new Date().toISOString(),
  ville: '',
  annee_scolaire: '',
};

interface EcoleState {
  ecole: EcoleMock;
  updateEcole: (updated: Partial<EcoleMock>) => void;
}

export const useEcoleStore = create<EcoleState>((set) => ({
  ecole: INITIAL_ECOLE,
  updateEcole: (updated) =>
    set((state) => ({
      ecole: { ...state.ecole, ...updated },
    })),
}));
