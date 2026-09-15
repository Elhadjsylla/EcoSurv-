/**
 * Calculs purs sur les données lues dans Supabase : aucune requête ici, tout
 * est testable sans réseau.
 */
import type { MonthlyCollectionReport } from '../components/ui/CollectionChart';
import type { EcheanceRow } from '../types/database';
import type {
  AbsenceView,
  EcheanceView,
  EleveIdentite,
  EleveSituation,
  ElevePedagogique,
  StatutEcheance,
  Tuteur,
} from '../types/domain';

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Date du jour au format des colonnes `date` (AAAA-MM-JJ). */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/**
 * Même règle que `calculer_statut_echeance` en base (BACKEND_AGENT.md §5).
 *
 * Le statut stocké n'est rafraîchi qu'à l'exécution quotidienne de
 * `rafraichir_statuts_echeances()`, pas encore planifiée : on le recalcule
 * donc à l'affichage, pour qu'une échéance échue apparaisse en retard le jour
 * même. `en_retard` prime sur `partiel`.
 */
export function statutEcheanceEffectif(
  montant: number,
  montantPaye: number,
  dateEcheance: string,
  today: string
): StatutEcheance {
  if (montantPaye >= montant) return 'paye';
  if (dateEcheance < today) return 'en_retard';
  if (montantPaye > 0) return 'partiel';
  return 'a_jour';
}

export function toEcheanceView(
  row: Pick<EcheanceRow, 'id' | 'eleve_id' | 'libelle' | 'montant' | 'montant_paye' | 'date_echeance' | 'annee_scolaire'>,
  today: string
): EcheanceView {
  const montant = Number(row.montant);
  const montantPaye = Number(row.montant_paye);
  return {
    id: row.id,
    eleve_id: row.eleve_id,
    libelle: row.libelle,
    montant,
    montant_paye: montantPaye,
    date_echeance: row.date_echeance,
    annee_scolaire: row.annee_scolaire,
    statut: statutEcheanceEffectif(montant, montantPaye, row.date_echeance, today),
    reste: round2(Math.max(0, montant - montantPaye)),
  };
}

/** Statut global d'un élève : le plus préoccupant de ses échéances. */
export function statutEleve(echeances: Pick<EcheanceView, 'statut'>[]): StatutEcheance {
  if (echeances.length === 0) return 'a_jour';
  if (echeances.some((e) => e.statut === 'en_retard')) return 'en_retard';
  if (echeances.every((e) => e.statut === 'paye')) return 'paye';
  if (echeances.some((e) => e.statut === 'partiel')) return 'partiel';
  return 'a_jour';
}

export function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export function buildSituation(
  eleve: EleveIdentite,
  echeances: EcheanceView[],
  tuteur: Tuteur | null,
  nbAbsences: number | null
): EleveSituation {
  const sorted = [...echeances].sort((a, b) => a.date_echeance.localeCompare(b.date_echeance));
  const totalDue = round2(sorted.reduce((sum, e) => sum + e.montant, 0));
  const totalPaid = round2(sorted.reduce((sum, e) => sum + Math.min(e.montant_paye, e.montant), 0));
  const prochaine = sorted.find((e) => e.reste > 0);
  return {
    ...eleve,
    tuteur,
    echeances: sorted,
    total_due: totalDue,
    total_paid: totalPaid,
    remaining: round2(sorted.reduce((sum, e) => sum + e.reste, 0)),
    statut: statutEleve(sorted),
    prochaine_echeance: prochaine
      ? { libelle: prochaine.libelle, date: prochaine.date_echeance, reste: prochaine.reste }
      : null,
    nb_absences: nbAbsences,
  };
}

export function buildSituations(
  eleves: EleveIdentite[],
  echeances: EcheanceView[],
  options: { tuteurs?: Map<string, Tuteur>; absences?: Map<string, number> } = {}
): EleveSituation[] {
  const parEleve = groupBy(echeances, (e) => e.eleve_id);
  return eleves.map((eleve) =>
    buildSituation(
      eleve,
      parEleve.get(eleve.id) ?? [],
      options.tuteurs?.get(eleve.id) ?? null,
      options.absences ? options.absences.get(eleve.id) ?? 0 : null
    )
  );
}

export interface DashboardKpis {
  totalAttendu: number;
  totalEncaisse: number;
  totalImpayes: number;
  tauxRecouvrement: number;
  nombreEleves: number;
  nombreEnRetard: number;
  nombrePaye: number;
  nombrePartiel: number;
  nombreAJour: number;
}

export function computeKpis(situations: EleveSituation[]): DashboardKpis {
  const totalAttendu = round2(situations.reduce((s, e) => s + e.total_due, 0));
  const totalEncaisse = round2(situations.reduce((s, e) => s + e.total_paid, 0));
  return {
    totalAttendu,
    totalEncaisse,
    totalImpayes: round2(situations.reduce((s, e) => s + e.remaining, 0)),
    tauxRecouvrement: totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0,
    nombreEleves: situations.length,
    nombreEnRetard: situations.filter((e) => e.statut === 'en_retard').length,
    nombrePaye: situations.filter((e) => e.statut === 'paye').length,
    nombrePartiel: situations.filter((e) => e.statut === 'partiel').length,
    nombreAJour: situations.filter((e) => e.statut === 'a_jour').length,
  };
}

/**
 * Situation mensuelle, par mois d'échéance : attendu = montants dus ce mois,
 * encaissé = paiements confirmés imputés à ces échéances, impayés = reste.
 */
export function monthlyReports(echeances: EcheanceView[]): MonthlyCollectionReport[] {
  const parMois = groupBy(echeances, (e) => e.date_echeance.slice(0, 7));
  return [...parMois.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, items]) => {
      const attendu = round2(items.reduce((s, e) => s + e.montant, 0));
      const encaisse = round2(items.reduce((s, e) => s + Math.min(e.montant_paye, e.montant), 0));
      const [annee, numeroMois] = mois.split('-').map(Number);
      const libelle = new Date(annee, numeroMois - 1, 1).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      return {
        mois: libelle.charAt(0).toUpperCase() + libelle.slice(1),
        attendu,
        encaisse,
        impayes: round2(attendu - encaisse),
        taux: attendu > 0 ? Math.round((encaisse / attendu) * 100) : 0,
      };
    });
}

/** Échéances de même libellé, date et montant : une « campagne » d'appel de fonds. */
export interface PlanEcheance {
  cle: string;
  libelle: string;
  date_echeance: string;
  montant: number;
  classes: string[];
  nb_eleves: number;
  total_attendu: number;
  total_encaisse: number;
  nb_soldees: number;
}

export function groupPlans(situations: EleveSituation[]): PlanEcheance[] {
  const plans = new Map<string, PlanEcheance & { classesSet: Set<string> }>();
  for (const eleve of situations) {
    for (const e of eleve.echeances) {
      const cle = `${e.libelle}|${e.date_echeance}|${e.montant}`;
      let plan = plans.get(cle);
      if (!plan) {
        plan = {
          cle,
          libelle: e.libelle,
          date_echeance: e.date_echeance,
          montant: e.montant,
          classes: [],
          classesSet: new Set(),
          nb_eleves: 0,
          total_attendu: 0,
          total_encaisse: 0,
          nb_soldees: 0,
        };
        plans.set(cle, plan);
      }
      if (eleve.classe) plan.classesSet.add(eleve.classe);
      plan.nb_eleves += 1;
      plan.total_attendu = round2(plan.total_attendu + e.montant);
      plan.total_encaisse = round2(plan.total_encaisse + Math.min(e.montant_paye, e.montant));
      if (e.statut === 'paye') plan.nb_soldees += 1;
    }
  }
  return [...plans.values()]
    .map(({ classesSet, ...plan }) => ({ ...plan, classes: [...classesSet].sort() }))
    .sort((a, b) => a.date_echeance.localeCompare(b.date_echeance) || a.libelle.localeCompare(b.libelle));
}

/** Classes distinctes, triées, en ignorant les élèves sans classe. */
export function listeClasses(eleves: Pick<EleveIdentite, 'classe'>[]): string[] {
  return [...new Set(eleves.map((e) => e.classe).filter((c): c is string => !!c))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );
}

export function buildElevesPedagogiques(eleves: EleveIdentite[], absences: AbsenceView[]): ElevePedagogique[] {
  const parEleve = groupBy(absences, (a) => a.eleve_id);
  return eleves.map((eleve) => {
    const liste = parEleve.get(eleve.id) ?? [];
    return {
      ...eleve,
      nb_absences: liste.filter((a) => a.type === 'absence').length,
      nb_retards: liste.filter((a) => a.type === 'retard').length,
      nb_non_justifiees: liste.filter((a) => !a.justifiee).length,
    };
  });
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export function nomComplet(personne: { prenom?: string | null; nom: string }): string {
  return [personne.prenom, personne.nom].filter(Boolean).join(' ');
}
