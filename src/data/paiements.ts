import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatMRU } from '../lib/utils';
import type { PaiementRow } from '../types/database';
import type { EcheanceView, EleveSituation, MethodePaiement, PaiementView, StatutPaiement } from '../types/domain';
import { ValidationError } from './errors';
import { fetchAll } from './fetchAll';
import { situationsKey, useSituationsEleves } from './eleves';
import { useSession } from './useSession';

export const PAIEMENT_COLUMNS =
  'id, echeance_id, montant, methode, statut, reference_transaction, encaisse_par, note, paye_le, created_at';

export const paiementsKey = (userId: string, ecoleId: string | null) => [userId, 'paiements', ecoleId] as const;

type PaiementLigne = Pick<
  PaiementRow,
  'id' | 'echeance_id' | 'montant' | 'methode' | 'statut' | 'reference_transaction' | 'encaisse_par' | 'note' | 'paye_le' | 'created_at'
>;

export interface Rattachement {
  echeance_libelle: string;
  eleve: PaiementView['eleve'];
}

export function toPaiementView(row: PaiementLigne, rattachement?: Rattachement): PaiementView {
  return {
    ...row,
    montant: Number(row.montant),
    echeance_libelle: rattachement?.echeance_libelle ?? null,
    eleve: rattachement?.eleve ?? null,
  };
}

/** Index échéance -> élève, pour rattacher un paiement à son dossier. */
export function indexRattachements(situations: EleveSituation[]): Map<string, Rattachement> {
  const index = new Map<string, Rattachement>();
  for (const s of situations) {
    for (const e of s.echeances) {
      index.set(e.id, {
        echeance_libelle: e.libelle,
        eleve: { id: s.id, nom: s.nom, prenom: s.prenom, matricule: s.matricule, classe: s.classe },
      });
    }
  }
  return index;
}

/** Paiements de l'école, du plus récent au plus ancien. Portails Directeur et Caissier. */
export function usePaiementsEcole() {
  const { userId, profile, ecoleId } = useSession();
  const situations = useSituationsEleves();

  const paiements = useQuery({
    queryKey: paiementsKey(userId, ecoleId),
    enabled: !!ecoleId && (profile.role === 'directeur' || profile.role === 'caissier'),
    queryFn: () =>
      fetchAll((from, to) =>
        supabase
          .from('paiements')
          .select(PAIEMENT_COLUMNS)
          .eq('ecole_id', ecoleId!)
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, to)
      ),
  });

  const data = useMemo(() => {
    if (!paiements.data || !situations.data) return undefined;
    const index = indexRattachements(situations.data);
    return paiements.data.map((p) => toPaiementView(p, index.get(p.echeance_id)));
  }, [paiements.data, situations.data]);

  return {
    data,
    isLoading: paiements.isLoading || situations.isLoading,
    error: paiements.error ?? situations.error,
    refetch: () => {
      void paiements.refetch();
      void situations.refetch();
    },
  };
}

/**
 * Statut à la saisie : seules les espèces remises en main propre sont
 * confirmées immédiatement (BACKEND_AGENT.md §6). Mobile money et chèque
 * restent en attente : ils ne soldent rien tant que la confirmation ne vient
 * pas du serveur (SECURITY_RULES.md §6).
 */
export function statutInitialPaiement(methode: MethodePaiement): StatutPaiement {
  return methode === 'especes' ? 'confirme' : 'en_attente';
}

export interface NouveauPaiement {
  echeance: Pick<EcheanceView, 'id' | 'reste' | 'libelle'>;
  montant: number;
  methode: MethodePaiement;
  reference: string;
  note: string;
}

/** Encaissement au guichet (policies paiements_insert_caissier / _directeur : encaisse_par = soi). */
export function useEnregistrerPaiement() {
  const { userId, ecoleId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (p: NouveauPaiement): Promise<PaiementView> => {
      const montant = Math.round(p.montant * 100) / 100;
      if (!Number.isFinite(montant) || montant <= 0) {
        throw new ValidationError('Saisissez un montant supérieur à 0 MRU.');
      }
      if (montant > p.echeance.reste) {
        throw new ValidationError(
          `Le montant dépasse le reste dû sur « ${p.echeance.libelle} » (${formatMRU(p.echeance.reste)}).`
        );
      }
      if (p.methode !== 'especes' && !p.reference.trim()) {
        throw new ValidationError('La référence de transaction ou le numéro de chèque est obligatoire pour ce mode.');
      }

      const statut = statutInitialPaiement(p.methode);
      const { data, error } = await supabase
        .from('paiements')
        .insert({
          ecole_id: ecoleId!,
          echeance_id: p.echeance.id,
          montant,
          methode: p.methode,
          statut,
          reference_transaction: p.reference.trim() || null,
          note: p.note.trim() || null,
          encaisse_par: userId,
          paye_le: statut === 'confirme' ? new Date().toISOString() : null,
        })
        .select(PAIEMENT_COLUMNS)
        .single();
      if (error) throw error;
      return toPaiementView(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: situationsKey(userId, ecoleId) });
      void queryClient.invalidateQueries({ queryKey: paiementsKey(userId, ecoleId) });
    },
  });
}
