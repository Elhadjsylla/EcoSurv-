/**
 * Logique de la saisie des absences (sans accès réseau, testable seule).
 *
 * Modèle réel de la table public.absences (migration 20260908090000_schema_mvp.sql) :
 *   type  : 'absence' | 'retard'   (pas de valeur « présent » : un élève présent n'a aucune ligne)
 *   justifiee : booléen, motif : texte libre (« Malade » n'est pas un statut, seulement un motif saisi)
 *   unicité : (eleve_id, date_absence, type) — pas de créneau en base.
 * Conséquence : à l'écran, un élève a UN seul état (présent, absent ou retard). Une ligne absence et une
 * ligne retard pour le même élève et la même date (possible en base) est traitée comme un conflit à résoudre.
 */

export type AttendanceStatus = 'present' | 'absent' | 'retard';

export interface AbsenceRow {
  id: string;
  eleve_id: string;
  date_absence: string;
  type: 'absence' | 'retard';
  justifiee: boolean;
  motif: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AttendanceEntry {
  /** null = rien n'est encore renseigné pour cet élève. */
  status: AttendanceStatus | null;
  motif: string;
  justifiee: boolean;
  /** Vrai si la base contient à la fois une absence et un retard pour cet élève ce jour-là. */
  conflict?: boolean;
}

export const EMPTY_ENTRY: AttendanceEntry = { status: null, motif: '', justifiee: false };

export const QUICK_MOTIFS = ['Malade', 'Famille', 'Transport'] as const;

/**
 * Construit l'état affiché à partir des lignes lues en base.
 * Si au moins une ligne existe pour la classe et la date, la feuille a été enregistrée par cette page, qui couvre
 * toute la classe : les élèves sans ligne sont donc réellement présents. Sans aucune ligne, rien ne permet de
 * savoir si l'appel a été fait : tous les élèves restent « non renseignés ».
 */
export function entriesFromRows(rows: AbsenceRow[], studentIds: string[]): Record<string, AttendanceEntry> {
  const hasRows = rows.length > 0;
  const result: Record<string, AttendanceEntry> = {};
  for (const id of studentIds) {
    const mine = rows.filter((r) => r.eleve_id === id);
    const abs = mine.find((r) => r.type === 'absence');
    const ret = mine.find((r) => r.type === 'retard');
    const chosen = abs ?? ret;
    if (!chosen) {
      result[id] = hasRows ? { status: 'present', motif: '', justifiee: false } : { ...EMPTY_ENTRY };
    } else {
      result[id] = {
        status: chosen.type === 'absence' ? 'absent' : 'retard',
        motif: chosen.motif ?? '',
        justifiee: Boolean(chosen.justifiee),
        conflict: Boolean(abs && ret),
      };
    }
  }
  return result;
}

/** Forme comparable : un élève présent ou non renseigné n'a ni motif ni justification. */
function comparable(e: AttendanceEntry | undefined): string {
  const entry = e ?? EMPTY_ENTRY;
  if (entry.status !== 'absent' && entry.status !== 'retard') return String(entry.status);
  return `${entry.status}|${entry.motif.trim()}|${entry.justifiee ? 1 : 0}`;
}

export function entryChanged(draft: AttendanceEntry | undefined, saved: AttendanceEntry | undefined): boolean {
  // Un conflit en base (absence + retard) n'est pas résolu tant que l'enregistrement n'a pas eu lieu.
  if (saved?.conflict) return true;
  return comparable(draft) !== comparable(saved);
}

export function countChanges(
  studentIds: string[],
  draft: Record<string, AttendanceEntry>,
  saved: Record<string, AttendanceEntry>
): number {
  return studentIds.filter((id) => entryChanged(draft[id], saved[id])).length;
}

export interface SavePlan {
  upserts: {
    ecole_id: string;
    eleve_id: string;
    date_absence: string;
    type: 'absence' | 'retard';
    justifiee: boolean;
    motif: string | null;
    saisie_par: string;
  }[];
  /** Lignes à supprimer : l'élève est devenu présent, ou a changé de type (absence <-> retard). */
  deleteIds: string[];
}

/** Calcule uniquement ce qui a changé : les lignes inchangées ne sont ni réécrites ni supprimées. */
export function planSave(args: {
  studentIds: string[];
  draft: Record<string, AttendanceEntry>;
  saved: Record<string, AttendanceEntry>;
  rows: AbsenceRow[];
  date: string;
  ecoleId: string;
  userId: string;
}): SavePlan {
  const { studentIds, draft, saved, rows, date, ecoleId, userId } = args;
  const plan: SavePlan = { upserts: [], deleteIds: [] };
  for (const id of studentIds) {
    if (!entryChanged(draft[id], saved[id])) continue;
    const entry = draft[id] ?? EMPTY_ENTRY;
    const desiredType = entry.status === 'absent' ? 'absence' : entry.status === 'retard' ? 'retard' : null;
    if (desiredType) {
      plan.upserts.push({
        ecole_id: ecoleId,
        eleve_id: id,
        date_absence: date,
        type: desiredType,
        justifiee: entry.justifiee,
        motif: entry.motif.trim() || null,
        saisie_par: userId,
      });
    }
    for (const r of rows) {
      if (r.eleve_id === id && r.type !== desiredType) plan.deleteIds.push(r.id);
    }
  }
  return plan;
}

/** Date et heure du dernier enregistrement parmi les lignes, ou null si aucune horodatage n'est disponible. */
export function latestSavedAt(rows: AbsenceRow[]): Date | null {
  let best: Date | null = null;
  for (const r of rows) {
    const raw = r.updated_at || r.created_at;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    if (!best || d > best) best = d;
  }
  return best;
}

export function formatSavedAt(d: Date, now: Date = new Date()): string {
  const hhmm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return hhmm;
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${hhmm} le ${jj}/${mm}`;
}

/** Résumé lisible du détail d'une absence : « Motif : Malade · Justifiée ». */
export function describeDetail(e: AttendanceEntry): string {
  const parts: string[] = [];
  if (e.motif.trim()) parts.push(`Motif : ${e.motif.trim()}`);
  parts.push(e.justifiee ? 'Justifiée' : 'Non justifiée');
  return parts.join(' · ');
}
