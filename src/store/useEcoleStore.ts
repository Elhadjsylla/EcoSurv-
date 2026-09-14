import { create } from 'zustand';
import { CURRENT_ECOLE, EcoleMock } from '../lib/mockData';

interface EcoleState {
  ecole: EcoleMock;
  updateEcole: (updated: Partial<EcoleMock>) => void;
}

export const useEcoleStore = create<EcoleState>((set) => ({
  ecole: CURRENT_ECOLE,
  updateEcole: (updated) =>
    set((state) => ({
      ecole: { ...state.ecole, ...updated },
    })),
}));
