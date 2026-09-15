import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { EleveSituation, Tuteur } from '../types/domain';
import { buildSituations, nomComplet, toEcheanceView, todayISO } from './aggregations';
import { ValidationError } from './errors';
import { fetchAll } from './fetchAll';
import { useSession } from './useSession';

export const ELEVE_COLUMNS =
  'id, ecole_id, matricule, nom, prenom, classe, date_naissance, lieu_naissance, sexe, annee_scolaire, actif';
export const ECHEANCE_COLUMNS = 'id, eleve_id, libelle, montant, montant_paye, date_echeance, annee_scolaire';
export const ABSENCE_COLUMNS = 'id, eleve_id, date_absence, type, justifiee, motif';

export const situationsKey = (userId: string, ecoleId: string | null) => [userId, 'situations', ecoleId] as const;

function lireEleves(ecoleId: string) {
  return fetchAll((from, to) =>
    supabase
      .from('eleves')
      .select(ELEVE_COLUMNS)
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('nom')
      .order('prenom')
      .order('id')
      .range(from, to)
  );
}

function lireEcheances(ecoleId: string) {
  return fetchAll((from, to) =>
    supabase
      .from('echeances')
      .select(ECHEANCE_COLUMNS)
      .eq('ecole_id', ecoleId)
      .order('date_echeance')
      .order('id')
      .range(from, to)
  );
}

/** Tuteur de chaque élève : le principal s'il est désigné, sinon le premier lien. Directeur uniquement. */
async function lireTuteurs(ecoleId: string): Promise<Map<string, Tuteur>> {
  const [liens, parents] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from('parents_eleves')
        .select('id, eleve_id, parent_id, lien, principal')
        .eq('ecole_id', ecoleId)
        .order('id')
        .range(from, to)
    ),
    fetchAll((from, to) =>
      supabase
        .from('profils')
        .select('id, nom, prenom, telephone, email')
        .eq('ecole_id', ecoleId)
        .eq('role', 'parent')
        .order('id')
        .range(from, to)
    ),
  ]);

  const parentsParId = new Map(parents.map((p) => [p.id, p]));
  const tuteurs = new Map<string, Tuteur>();
  for (const lien of [...liens].sort((a, b) => Number(b.principal) - Number(a.principal))) {
    if (tuteurs.has(lien.eleve_id)) continue;
    const parent = parentsParId.get(lien.parent_id);
    if (!parent) continue;
    tuteurs.set(lien.eleve_id, {
      nom: nomComplet(parent),
      telephone: parent.telephone,
      email: parent.email,
      lien: lien.lien,
    });
  }
  return tuteurs;
}

/** Nombre d'absences (hors retards) par élève. Directeur uniquement. */
async function compterAbsences(ecoleId: string): Promise<Map<string, number>> {
  const lignes = await fetchAll((from, to) =>
    supabase
      .from('absences')
      .select('id, eleve_id')
      .eq('ecole_id', ecoleId)
      .eq('type', 'absence')
      .order('id')
      .range(from, to)
  );
  const compte = new Map<string, number>();
  for (const l of lignes) compte.set(l.eleve_id, (compte.get(l.eleve_id) ?? 0) + 1);
  return compte;
}

/**
 * Élèves actifs de l'école avec leur situation financière.
 *
 * Portails Directeur et Caissier. Tuteurs et absences ne sont demandés que
 * pour le directeur : le caissier n'y a pas accès (SECURITY_RULES.md §2), la
 * requête n'est donc même pas émise pour lui.
 */
export function useSituationsEleves() {
  const { userId, profile, ecoleId } = useSession();
  const direction = profile.role === 'directeur';

  return useQuery({
    queryKey: situationsKey(userId, ecoleId),
    enabled: !!ecoleId && (direction || profile.role === 'caissier'),
    queryFn: async (): Promise<EleveSituation[]> => {
      const id = ecoleId!;
      const [eleves, echeances, tuteurs, absences] = await Promise.all([
        lireEleves(id),
        lireEcheances(id),
        direction ? lireTuteurs(id) : Promise.resolve(undefined),
        direction ? compterAbsences(id) : Promise.resolve(undefined),
      ]);
      const today = todayISO();
      return buildSituations(
        eleves,
        echeances.map((e) => toEcheanceView(e, today)),
        { tuteurs, absences }
      );
    },
  });
}

export interface NouvelEleve {
  nom: string;
  prenom: string;
  classe: string;
  matricule: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: 'M' | 'F' | '';
  annee_scolaire: string | null;
}

/** Inscription d'un élève (policy eleves_insert_directeur : dans son école uniquement). */
export function useInscrireEleve() {
  const { userId, ecoleId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (v: NouvelEleve) => {
      const nom = v.nom.trim();
      const prenom = v.prenom.trim();
      if (nom.length < 2 || prenom.length < 2) {
        throw new ValidationError("Le nom et le prénom de l'élève sont obligatoires (2 caractères minimum).");
      }
      if (!v.classe.trim()) throw new ValidationError('La classe est obligatoire.');
      if (v.date_naissance && (v.date_naissance <= '1950-01-01' || v.date_naissance > todayISO())) {
        throw new ValidationError('La date de naissance est invalide.');
      }

      const { data, error } = await supabase
        .from('eleves')
        .insert({
          ecole_id: ecoleId!,
          nom,
          prenom,
          classe: v.classe.trim(),
          matricule: v.matricule.trim() || null,
          date_naissance: v.date_naissance || null,
          lieu_naissance: v.lieu_naissance.trim() || null,
          sexe: v.sexe || null,
          annee_scolaire: v.annee_scolaire,
        })
        .select(ELEVE_COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: situationsKey(userId, ecoleId) }),
  });
}
