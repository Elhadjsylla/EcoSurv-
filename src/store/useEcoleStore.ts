import { create } from 'zustand';
import { EcoleMock } from '../lib/mockData';

export const INITIAL_ECOLE: EcoleMock = {
  id: '',
  nom: 'Établissement Scolaire',
  adresse: '',
  telephone: '',
  email: '',
  devise: 'MRU',
  statut_activation: 'active',
  date_creation: new Date().toISOString(),
  ville: 'Nouakchott',
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
