import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { AbsenceView, EnfantParent } from '../types/domain';
import { buildSituation, chunk, groupBy, toEcheanceView, todayISO } from './aggregations';
import { ABSENCE_COLUMNS, ECHEANCE_COLUMNS, ELEVE_COLUMNS } from './eleves';
import { fetchAll } from './fetchAll';
import { PAIEMENT_COLUMNS, toPaiementView } from './paiements';
import { useSession } from './useSession';

const IN_CHUNK = 100;

/**
 * Enfants du parent connecté, avec échéances, paiements et absences.
 *
 * Tout part des liens `parents_eleves` du parent : chaque requête suivante
 * est filtrée sur ces seuls élèves (ou leurs échéances), jamais sur l'école.
 * Un parent peut avoir des enfants dans plusieurs écoles (§5.1).
 */
export function useMesEnfants() {
  const { userId, profile } = useSession();

  return useQuery({
    queryKey: [userId, 'enfants'],
    enabled: profile.role === 'parent',
    queryFn: async (): Promise<EnfantParent[]> => {
      const liens = await fetchAll((from, to) =>
        supabase
          .from('parents_eleves')
          .select('id, eleve_id')
          .eq('parent_id', userId)
          .order('id')
          .range(from, to)
      );
      const ids = [...new Set(liens.map((l) => l.eleve_id))];
      if (ids.length === 0) return [];

      const [eleves, echeances, absences] = await Promise.all([
        fetchAll((from, to) =>
          supabase.from('eleves').select(ELEVE_COLUMNS).in('id', ids).order('prenom').order('id').range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('echeances')
            .select(ECHEANCE_COLUMNS)
            .in('eleve_id', ids)
            .order('date_echeance')
            .order('id')
            .range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('absences')
            .select(ABSENCE_COLUMNS)
            .in('eleve_id', ids)
            .order('date_absence', { ascending: false })
            .order('id')
            .range(from, to)
        ),
      ]);

      const paiements = (
        await Promise.all(
          chunk(
            echeances.map((e) => e.id),
            IN_CHUNK
          ).map((echeanceIds) =>
            fetchAll((from, to) =>
              supabase
                .from('paiements')
                .select(PAIEMENT_COLUMNS)
                .in('echeance_id', echeanceIds)
                .order('created_at', { ascending: false })
                .order('id')
                .range(from, to)
            )
          )
        )
      ).flat();

      const today = todayISO();
      const echeancesVues = echeances.map((e) => toEcheanceView(e, today));
      const echeancesParEleve = groupBy(echeancesVues, (e) => e.eleve_id);
      const echeanceParId = new Map(echeancesVues.map((e) => [e.id, e]));
      const absencesParEleve = groupBy(absences, (a) => a.eleve_id);

      return eleves.map((eleve) => {
        const sesEcheances = echeancesParEleve.get(eleve.id) ?? [];
        const sesAbsences: AbsenceView[] = (absencesParEleve.get(eleve.id) ?? []).map((a) => ({
          ...a,
          eleve_nom: eleve.nom,
          eleve_prenom: eleve.prenom,
          classe: eleve.classe,
        }));
        const sesPaiements = paiements
          .filter((p) => echeanceParId.get(p.echeance_id)?.eleve_id === eleve.id)
          .map((p) =>
            toPaiementView(p, {
              echeance_libelle: echeanceParId.get(p.echeance_id)!.libelle,
              eleve: { id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, matricule: eleve.matricule, classe: eleve.classe },
            })
          );

        return {
          ...buildSituation(
            eleve,
            sesEcheances,
            null,
            sesAbsences.filter((a) => a.type === 'absence').length
          ),
          paiements: sesPaiements,
          absences: sesAbsences,
        };
      });
    },
  });
}
