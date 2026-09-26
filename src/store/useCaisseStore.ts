import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { CURRENT_CAISSIER, CaisseTransaction, MOCK_CAISSE_TRANSACTIONS_INITIAL } from '../lib/mockData';

export interface ClotureCaisseData {
  id?: string;
  ecole_id?: string;
  caissier_id?: string;
  caissier_nom: string;
  date_cloture: string;
  montant_total: number;
  nb_transactions: number;
  statut: 'cloture' | 'valide';
  created_at?: string;
}

interface CaisseStoreState {
  clotures: Record<string, ClotureCaisseData>; // indexées par date YYYY-MM-DD
  transactions: CaisseTransaction[];
  refreshKey: number;
  elevePaymentDeductions: Record<string, number>;
  addTransaction: (tx: CaisseTransaction) => void;
  triggerRefresh: () => void;
  deductEleveBalance: (eleveId: string, amount: number) => void;
  isDateCloturee: (dateStr?: string) => boolean;
  getClotureForDate: (dateStr?: string) => ClotureCaisseData | null;
  cloturerCaisseDuJour: (montantTotal: number, nbTransactions: number) => Promise<boolean>;
  reouvrirCaisseDemo: (dateStr?: string) => void;
}

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const useCaisseStore = create<CaisseStoreState>()(
  persist(
    (set, get) => ({
      clotures: {},
      transactions: MOCK_CAISSE_TRANSACTIONS_INITIAL,
      refreshKey: 1,
      elevePaymentDeductions: {},

      addTransaction: (tx: CaisseTransaction) => {
        set((state) => ({
          transactions: [tx, ...state.transactions],
          refreshKey: state.refreshKey + 1,
        }));
      },

      triggerRefresh: () => {
        set((state) => ({ refreshKey: state.refreshKey + 1 }));
      },

      deductEleveBalance: (eleveId: string, amount: number) => {
        set((state) => ({
          elevePaymentDeductions: {
            ...state.elevePaymentDeductions,
            [eleveId]: (state.elevePaymentDeductions[eleveId] || 0) + amount,
          },
          refreshKey: state.refreshKey + 1,
        }));
      },

      isDateCloturee: (dateStr) => {
        const d = dateStr || getTodayDateStr();
        return !!get().clotures[d];
      },

      getClotureForDate: (dateStr) => {
        const d = dateStr || getTodayDateStr();
        return get().clotures[d] || null;
      },

      cloturerCaisseDuJour: async (montantTotal: number, nbTransactions: number) => {
        const today = getTodayDateStr();
        const caissierId = CURRENT_CAISSIER.id || 'usr-cais-001';
        const caissierNom = `${CURRENT_CAISSIER.prenom} ${CURRENT_CAISSIER.nom}`;

        const clotureRecord: ClotureCaisseData = {
          id: `clot-${Date.now()}`,
          ecole_id: 'ecole-demo-001',
          caissier_id: caissierId,
          caissier_nom: caissierNom,
          date_cloture: today,
          montant_total: montantTotal,
          nb_transactions: nbTransactions,
          statut: 'cloture',
          created_at: new Date().toISOString(),
        };

        // 1. Tenter l'écriture réelle dans Supabase (table clotures_caisse)
        try {
          const { error } = await supabase.from('clotures_caisse').insert([
            {
              ecole_id: 'ecole-demo-001',
              caissier_id: caissierId,
              date_cloture: today,
              montant_total: montantTotal,
              nb_transactions: nbTransactions,
              statut: 'cloture',
            },
          ]);
          if (error) {
            console.warn('[EcoSurv Caisse] Supabase fallback local:', error.message);
          }
        } catch (err) {
          console.warn('[EcoSurv Caisse] Mode hors-ligne / fallback local:', err);
        }

        // 2. Persister dans l'état applicatif frontend
        set((state) => ({
          clotures: {
            ...state.clotures,
            [today]: clotureRecord,
          },
        }));

        return true;
      },

      reouvrirCaisseDemo: (dateStr) => {
        const d = dateStr || getTodayDateStr();
        set((state) => {
          const updated = { ...state.clotures };
          delete updated[d];
          return { clotures: updated };
        });
      },
    }),
    {
      name: 'ecosurv-clotures-caisse-store',
    }
  )
);
