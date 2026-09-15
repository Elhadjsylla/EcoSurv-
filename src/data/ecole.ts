import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { EcoleView } from '../types/domain';
import { ValidationError } from './errors';
import { useSession } from './useSession';

const ECOLE_COLUMNS = 'id, nom, ville, adresse, telephone, email, statut_abonnement, annee_scolaire';

export const ecoleKey = (userId: string, ecoleId: string | null) => [userId, 'ecole', ecoleId] as const;

/** Fiche de l'école du profil connecté (policy ecoles_select_membre : sa seule école). */
export function useEcole() {
  const { userId, ecoleId } = useSession();
  return useQuery({
    queryKey: ecoleKey(userId, ecoleId),
    enabled: !!ecoleId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<EcoleView> => {
      const { data, error } = await supabase.from('ecoles').select(ECOLE_COLUMNS).eq('id', ecoleId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export type EcoleModifiable = Pick<EcoleView, 'nom' | 'ville' | 'adresse' | 'telephone' | 'email' | 'annee_scolaire'>;

/** Coordonnées de l'école : seules colonnes ouvertes au directeur (grants de colonnes). */
export function useModifierEcole() {
  const { userId, ecoleId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valeurs: EcoleModifiable): Promise<EcoleView> => {
      const nom = valeurs.nom.trim();
      if (!nom) throw new ValidationError("Le nom de l'établissement est obligatoire.");
      const vide = (v: string | null) => (v && v.trim() ? v.trim() : null);

      const { data, error } = await supabase
        .from('ecoles')
        .update({
          nom,
          ville: vide(valeurs.ville),
          adresse: vide(valeurs.adresse),
          telephone: vide(valeurs.telephone),
          email: vide(valeurs.email),
          annee_scolaire: vide(valeurs.annee_scolaire),
        })
        .eq('id', ecoleId!)
        .select(ECOLE_COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (ecole) => queryClient.setQueryData(ecoleKey(userId, ecoleId), ecole),
  });
}
