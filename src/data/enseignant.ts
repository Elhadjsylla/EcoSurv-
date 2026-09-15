import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { AbsenceView, ElevePedagogique, TypeAbsence } from '../types/domain';
import { buildElevesPedagogiques, chunk } from './aggregations';
import { ABSENCE_COLUMNS, ELEVE_COLUMNS } from './eleves';
import { fetchAll } from './fetchAll';
import { useSession } from './useSession';

/** Au-delà, la liste d'identifiants d'un filtre `in` rallonge trop l'URL. */
const IN_CHUNK = 100;

const enseignantKey = (userId: string) => [userId, 'enseignant'] as const;

/** Classes affectées à l'enseignant connecté (policy affectations_select_enseignant). */
export function useMesClasses() {
  const { userId, profile } = useSession();
  return useQuery({
    queryKey: [...enseignantKey(userId), 'classes'],
    enabled: profile.role === 'enseignant',
    queryFn: async (): Promise<string[]> => {
      const lignes = await fetchAll((from, to) =>
        supabase
          .from('affectations_enseignants')
          .select('id, classe')
          .eq('enseignant_id', userId)
          .order('classe')
          .order('id')
          .range(from, to)
      );
      return [...new Set(lignes.map((l) => l.classe))];
    },
  });
}

export interface DonneesClasses {
  eleves: ElevePedagogique[];
  /** Absences et retards de ces élèves, du plus récent au plus ancien. */
  absences: AbsenceView[];
}

/**
 * Élèves des classes de l'enseignant et leurs absences.
 * Aucune donnée financière ni coordonnée de tuteur n'est demandée.
 */
export function useElevesEnseignant() {
  const { userId, ecoleId } = useSession();
  const classes = useMesClasses();

  const query = useQuery({
    queryKey: [...enseignantKey(userId), 'eleves', classes.data],
    enabled: !!ecoleId && !!classes.data,
    queryFn: async (): Promise<DonneesClasses> => {
      const mesClasses = classes.data ?? [];
      if (mesClasses.length === 0) return { eleves: [], absences: [] };

      const eleves = await fetchAll((from, to) =>
        supabase
          .from('eleves')
          .select(ELEVE_COLUMNS)
          .eq('ecole_id', ecoleId!)
          .in('classe', mesClasses)
          .eq('actif', true)
          .order('nom')
          .order('prenom')
          .order('id')
          .range(from, to)
      );

      const lignes = (
        await Promise.all(
          chunk(
            eleves.map((e) => e.id),
            IN_CHUNK
          ).map((ids) =>
            fetchAll((from, to) =>
              supabase
                .from('absences')
                .select(ABSENCE_COLUMNS)
                .eq('ecole_id', ecoleId!)
                .in('eleve_id', ids)
                .order('date_absence', { ascending: false })
                .order('id')
                .range(from, to)
            )
          )
        )
      ).flat();

      const parId = new Map(eleves.map((e) => [e.id, e]));
      const absences: AbsenceView[] = lignes
        .map((a) => {
          const eleve = parId.get(a.eleve_id)!;
          return { ...a, eleve_nom: eleve.nom, eleve_prenom: eleve.prenom, classe: eleve.classe };
        })
        .sort((a, b) => b.date_absence.localeCompare(a.date_absence));

      return { eleves: buildElevesPedagogiques(eleves, absences), absences };
    },
  });

  return {
    classes: classes.data,
    data: query.data,
    isLoading: classes.isLoading || query.isLoading,
    error: classes.error ?? query.error,
    refetch: () => {
      void classes.refetch();
      void query.refetch();
    },
  };
}

export type StatutPresence = 'present' | 'absent' | 'retard';

export interface SaisiePresence {
  statut: StatutPresence;
  motif: string;
  justifiee: boolean;
}

export interface Appel {
  date: string;
  eleveIds: string[];
  saisies: Record<string, SaisiePresence>;
}

const typeAbsence = (statut: StatutPresence | undefined): TypeAbsence | null =>
  statut === 'absent' ? 'absence' : statut === 'retard' ? 'retard' : null;

/**
 * Enregistre la feuille d'appel d'une date : crée ou met à jour les absences
 * et retards saisis, puis supprime ceux de la même date qui ne correspondent
 * plus à la saisie (élève finalement présent, retard devenu absence).
 * Les écritures sont bornées aux élèves de l'enseignant par la RLS.
 */
export function useEnregistrerAppel() {
  const { userId, ecoleId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, eleveIds, saisies }: Appel) => {
      const aEnregistrer = eleveIds.flatMap((eleveId) => {
        const saisie = saisies[eleveId];
        const type = typeAbsence(saisie?.statut);
        return type
          ? [
              {
                ecole_id: ecoleId!,
                eleve_id: eleveId,
                date_absence: date,
                type,
                justifiee: saisie.justifiee,
                motif: saisie.motif.trim() || null,
                saisie_par: userId,
              },
            ]
          : [];
      });

      const existantes = (
        await Promise.all(
          chunk(eleveIds, IN_CHUNK).map((ids) =>
            fetchAll((from, to) =>
              supabase
                .from('absences')
                .select('id, eleve_id, type')
                .eq('date_absence', date)
                .in('eleve_id', ids)
                .order('id')
                .range(from, to)
            )
          )
        )
      ).flat();

      if (aEnregistrer.length > 0) {
        const { error } = await supabase
          .from('absences')
          .upsert(aEnregistrer, { onConflict: 'eleve_id,date_absence,type' });
        if (error) throw error;
      }

      // Suppression après l'écriture : en cas d'échec, aucune saisie n'est perdue.
      const obsoletes = existantes
        .filter((a) => typeAbsence(saisies[a.eleve_id]?.statut) !== a.type)
        .map((a) => a.id);
      for (const ids of chunk(obsoletes, IN_CHUNK)) {
        const { error } = await supabase.from('absences').delete().in('id', ids);
        if (error) throw error;
      }

      return { enregistrees: aEnregistrer.length, supprimees: obsoletes.length };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enseignantKey(userId) }),
  });
}
