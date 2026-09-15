import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ValidationError } from './errors';
import { situationsKey } from './eleves';
import { useSession } from './useSession';

export interface NouvelleEcheanceClasse {
  classe: string;
  eleveIds: string[];
  libelle: string;
  montant: number;
  date_echeance: string;
  annee_scolaire: string | null;
}

/**
 * Crée la même échéance pour chaque élève actif d'une classe (policy
 * echeances_insert_directeur). montant_paye et statut sont laissés aux
 * triggers : ils ne sont jamais envoyés par le client.
 */
export function useCreerEcheancesClasse() {
  const { userId, ecoleId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (v: NouvelleEcheanceClasse) => {
      const libelle = v.libelle.trim();
      const montant = Math.round(v.montant * 100) / 100;
      if (!libelle) throw new ValidationError("Le libellé de l'échéance est obligatoire.");
      if (!Number.isFinite(montant) || montant <= 0) throw new ValidationError('Le montant doit être supérieur à 0 MRU.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date_echeance)) throw new ValidationError("La date d'échéance est obligatoire.");
      if (v.eleveIds.length === 0) throw new ValidationError(`Aucun élève actif en ${v.classe}.`);

      const { error } = await supabase.from('echeances').insert(
        v.eleveIds.map((eleveId) => ({
          ecole_id: ecoleId!,
          eleve_id: eleveId,
          libelle,
          montant,
          date_echeance: v.date_echeance,
          annee_scolaire: v.annee_scolaire,
        }))
      );
      if (error) throw error;
      return v.eleveIds.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: situationsKey(userId, ecoleId) }),
  });
}
