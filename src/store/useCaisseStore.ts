import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { CaisseTransaction } from '../types';
import { useAuthStore } from './useAuthStore';

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
  addTransaction: (tx: CaisseTransaction) => void;
  triggerRefresh: () => void;
  isDateCloturee: (dateStr?: string) => boolean;
  getClotureForDate: (dateStr?: string) => ClotureCaisseData | null;
  cloturerCaisseDuJour: (
    montantTotal: number,
    nbTransactions: number
  ) => Promise<{ success: boolean; error?: string }>;
}

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const useCaisseStore = create<CaisseStoreState>()(
  persist(
    (set, get) => ({
      clotures: {},
      transactions: [],
      refreshKey: 1,

      addTransaction: (tx: CaisseTransaction) => {
        set((state) => ({
          transactions: [tx, ...state.transactions],
          refreshKey: state.refreshKey + 1,
        }));
      },

      triggerRefresh: () => {
        set((state) => ({ refreshKey: state.refreshKey + 1 }));
      },

      isDateCloturee: (dateStr?: string) => {
        const d = dateStr || getTodayDateStr();
        return !!get().clotures[d];
      },

      getClotureForDate: (dateStr?: string) => {
        const d = dateStr || getTodayDateStr();
        return get().clotures[d] || null;
      },

      cloturerCaisseDuJour: async (montantTotal: number, nbTransactions: number) => {
        const today = getTodayDateStr();
        const authProfile = useAuthStore.getState().profile;
        const caissierId = authProfile?.id || '';
        const caissierNom = authProfile ? `${authProfile.prenom} ${authProfile.nom}`.trim() : 'Caissier';
        const ecoleId = authProfile?.ecole_id || '';

        const clotureRecord: ClotureCaisseData = {
          id: `clot-${Date.now()}`,
          ecole_id: ecoleId,
          caissier_id: caissierId,
          caissier_nom: caissierNom,
          date_cloture: today,
          montant_total: montantTotal,
          nb_transactions: nbTransactions,
          statut: 'cloture',
          created_at: new Date().toISOString(),
        };

        // 1. Tenter l'écriture réelle dans Supabase (table clotures_caisse)
        // Colonnes réelles non calculées : ecole_id, caissier_id, date_cloture
        // montant_total_encaisse et nombre_operations sont calculés automatiquement par le trigger clotures_caisse_calcul
        if (ecoleId && caissierId) {
          try {
            const { error } = await supabase.from('clotures_caisse').insert([
              {
                ecole_id: ecoleId,
                caissier_id: caissierId,
                date_cloture: today,
              },
            ]);
            if (error) {
              console.error(
                '[EcoSurv Caisse] Erreur insertion clotures_caisse:',
                error.code,
                error.message,
                error.details
              );
              return {
                success: false,
                error: `Échec de clôture (${error.code || 'ERR'}) : ${error.message}`,
              };
            }
          } catch (err: any) {
            console.error('[EcoSurv Caisse] Erreur inattendue clotures_caisse:', err);
            return {
              success: false,
              error: `Erreur inattendue : ${err?.message || err}`,
            };
          }
        } else {
          const errMsg = "Identifiants d'école ou de caissier introuvables.";
          console.error('[EcoSurv Caisse]', errMsg);
          return {
            success: false,
            error: errMsg,
          };
        }

        // 2. Persister dans l'état applicatif frontend uniquement en cas de succès
        set((state) => ({
          clotures: {
            ...state.clotures,
            [today]: clotureRecord,
          },
        }));

        return { success: true };
      },
    }),
    {
      name: 'ecosurv-clotures-caisse-store',
    }
  )
);
