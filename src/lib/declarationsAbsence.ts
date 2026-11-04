import { supabase } from './supabase';
import { MONTHS_FR_LOWER, parseIsoDate } from './dateParts';

/**
 * Déclarations d'absence faites par les parents (table public.declarations_absence).
 *
 * La base impose elle-même toutes les règles (durée, fenêtre de dates, quotas, statut,
 * école, auteur). Ce module les reflète côté interface pour guider la saisie, sans les remplacer.
 * Le client Supabase n'a pas de types générés dans ce dépôt : le type est donc défini ici.
 */

export type MotifAbsence = 'malade' | 'famille' | 'transport' | 'autre';
export type StatutDeclaration = 'en_attente' | 'acceptee' | 'refusee';

export interface DeclarationAbsence {
  id: string;
  eleve_id: string;
  date_debut: string; // AAAA-MM-JJ
  date_fin: string; // AAAA-MM-JJ
  motif: MotifAbsence;
  commentaire: string | null;
  statut: StatutDeclaration;
  reponse: string | null;
  traite_le: string | null;
  created_at: string;
}

/** Ce que le front envoie, et rien d'autre (ecole_id, declare_par et statut sont remplis par la base). */
export interface NouvelleDeclaration {
  eleve_id: string;
  date_debut: string;
  date_fin: string;
  motif: MotifAbsence;
  commentaire?: string;
}

export const MOTIFS: { value: MotifAbsence; label: string }[] = [
  { value: 'malade', label: 'Malade' },
  { value: 'famille', label: 'Famille' },
  { value: 'transport', label: 'Transport' },
  { value: 'autre', label: 'Autre' },
];

export const STATUT_LABEL: Record<StatutDeclaration, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
};

export const LIMITES = {
  commentaire: 500,
  /** date_fin - date_debut <= 13 (14 jours au maximum) */
  ecartMaxJours: 13,
  passeMaxJours: 30,
  futurMaxJours: 14,
} as const;

const COLONNES = 'id, eleve_id, date_debut, date_fin, motif, commentaire, statut, reponse, traite_le, created_at';

/* ---------------------------- Dates (sans fuseau) ---------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');

/** Date d'aujourd'hui dans le fuseau local de l'appareil, au format AAAA-MM-JJ (pas de conversion UTC). */
export function aujourdhuiLocal(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Ajoute des jours à une date AAAA-MM-JJ. Calcul calendaire pur : aucun fuseau, aucun changement d'heure. */
export function ajouterJours(isoDate: string, jours: number): string {
  const p = parseIsoDate(isoDate);
  if (p.year === null || p.month === null || p.day === null) return '';
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + jours));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Nombre de jours entre deux dates AAAA-MM-JJ (b - a). */
export function ecartJours(a: string, b: string): number {
  const pa = parseIsoDate(a);
  const pb = parseIsoDate(b);
  if (pa.year === null || pb.year === null || pa.month === null || pb.month === null || pa.day === null || pb.day === null) {
    return NaN;
  }
  return Math.round((Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / 86400000);
}

export function formatDateFr(isoDate: string): string {
  const p = parseIsoDate(isoDate);
  if (p.year === null || p.month === null || p.day === null) return isoDate;
  return `${p.day === 1 ? '1er' : p.day} ${MONTHS_FR_LOWER[p.month - 1]} ${p.year}`;
}

export function formatPeriode(debut: string, fin: string): string {
  if (debut === fin) return formatDateFr(debut);
  const a = parseIsoDate(debut);
  const b = parseIsoDate(fin);
  if (a.year === null || b.year === null || a.month === null || b.month === null || a.day === null || b.day === null) {
    return `${debut} – ${fin}`;
  }
  const jourA = a.day === 1 ? '1er' : String(a.day);
  if (a.year === b.year && a.month === b.month) {
    return `du ${jourA} au ${formatDateFr(fin)}`;
  }
  if (a.year === b.year) {
    return `du ${jourA} ${MONTHS_FR_LOWER[a.month - 1]} au ${formatDateFr(fin)}`;
  }
  return `du ${formatDateFr(debut)} au ${formatDateFr(fin)}`;
}

/** Bornes que la base accepte pour la date de début et la date de fin, à partir d'aujourd'hui. */
export function bornes(aujourdhui: string) {
  return {
    debutMin: ajouterJours(aujourdhui, -LIMITES.passeMaxJours),
    finMax: ajouterJours(aujourdhui, LIMITES.futurMaxJours),
  };
}

/* ------------------------------- Validation -------------------------------- */

export interface ChampsDeclaration {
  date_debut: string;
  date_fin: string;
  motif: MotifAbsence | '';
  commentaire: string;
}

export type ErreursDeclaration = Partial<Record<keyof ChampsDeclaration, string>>;

/** Miroir des règles de la base, avec des messages qui disent quoi faire plutôt que ce qui est faux. */
export function validerDeclaration(champs: ChampsDeclaration, aujourdhui: string): ErreursDeclaration {
  const erreurs: ErreursDeclaration = {};
  const { debutMin, finMax } = bornes(aujourdhui);
  const { date_debut: debut, date_fin: fin } = champs;

  if (!debut) {
    erreurs.date_debut = 'Choisissez le premier jour d’absence.';
  } else if (debut < debutMin) {
    erreurs.date_debut = `Choisissez une date à partir du ${formatDateFr(debutMin)} : on peut déclarer jusqu’à 30 jours en arrière.`;
  } else if (debut > finMax) {
    erreurs.date_debut = `Choisissez une date jusqu’au ${formatDateFr(finMax)} : on peut déclarer jusqu’à 14 jours à l’avance.`;
  }

  if (!fin) {
    erreurs.date_fin = 'Choisissez le dernier jour d’absence.';
  } else if (fin > finMax) {
    erreurs.date_fin = `Choisissez une date jusqu’au ${formatDateFr(finMax)} : on peut déclarer jusqu’à 14 jours à l’avance.`;
  } else if (debut && fin < debut) {
    erreurs.date_fin = 'Le dernier jour doit être le même jour que le premier, ou après.';
  } else if (debut && ecartJours(debut, fin) > LIMITES.ecartMaxJours) {
    erreurs.date_fin = 'Une déclaration couvre 14 jours au plus. Pour une absence plus longue, faites-en une seconde ou contactez l’école.';
  }

  if (!champs.motif) {
    erreurs.motif = 'Choisissez le motif qui correspond le mieux.';
  }

  if (champs.commentaire.length > LIMITES.commentaire) {
    erreurs.commentaire = `Le commentaire peut faire ${LIMITES.commentaire} caractères au plus.`;
  }

  return erreurs;
}

/* ------------------------------- Erreurs base ------------------------------ */

export const MESSAGE_ERREUR_GENERAL =
  'La déclaration n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez. Votre saisie est conservée.';

interface ErreurSupabase {
  message?: string;
  code?: string;
}

/**
 * Les règles de la base lèvent des exceptions de déclencheur (code P0xxx) dont le message est déjà en
 * français : il est affiché tel quel. Toute autre erreur (réseau, droits, contrainte technique) reçoit
 * le message général, car son texte est technique et souvent en anglais.
 */
export function messageErreur(error: ErreurSupabase | null | undefined, general = MESSAGE_ERREUR_GENERAL): string {
  const message = (error?.message ?? '').trim();
  if (message && /^P0\d{3}$/.test(error?.code ?? '') && message.length <= 200) return message;
  return general;
}

/* --------------------------------- Accès base -------------------------------- */

export class ErreurDeclaration extends Error {}

/** Déclarations d'un élève, les plus récentes d'abord. La base ne renvoie que celles des enfants du parent. */
export async function listerDeclarations(eleveId: string): Promise<DeclarationAbsence[]> {
  const { data, error } = await supabase
    .from('declarations_absence')
    .select(COLONNES)
    .eq('eleve_id', eleveId)
    .order('created_at', { ascending: false });
  if (error) throw new ErreurDeclaration(messageErreur(error, 'Impossible de charger les déclarations pour le moment.'));
  return (data ?? []) as DeclarationAbsence[];
}

/** Envoie uniquement eleve_id, date_debut, date_fin, motif et commentaire. Retourne la ligne confirmée par la base. */
export async function creerDeclaration(nouvelle: NouvelleDeclaration): Promise<DeclarationAbsence> {
  const ligne: NouvelleDeclaration = {
    eleve_id: nouvelle.eleve_id,
    date_debut: nouvelle.date_debut,
    date_fin: nouvelle.date_fin,
    motif: nouvelle.motif,
  };
  const commentaire = nouvelle.commentaire?.trim();
  if (commentaire) ligne.commentaire = commentaire;

  const { data, error } = await supabase.from('declarations_absence').insert(ligne).select(COLONNES).single();
  if (error) throw new ErreurDeclaration(messageErreur(error));
  if (!data) throw new ErreurDeclaration(MESSAGE_ERREUR_GENERAL);
  return data as DeclarationAbsence;
}

/** Retire une déclaration encore en attente. Confirme qu'une ligne a bien été supprimée. */
export async function retirerDeclaration(id: string): Promise<void> {
  const { data, error } = await supabase.from('declarations_absence').delete().eq('id', id).select('id');
  if (error) {
    throw new ErreurDeclaration(messageErreur(error, 'Le retrait n’a pas pu être effectué. Vérifiez votre connexion puis réessayez.'));
  }
  if (!data || data.length === 0) {
    throw new ErreurDeclaration('Cette déclaration n’est plus en attente : l’école l’a peut-être déjà traitée. La liste va se mettre à jour.');
  }
}
