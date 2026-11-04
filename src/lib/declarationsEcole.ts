import { supabase } from './supabase';
import { ErreurDeclaration, messageErreur, formatDateFr, type DeclarationAbsence, type StatutDeclaration } from './declarationsAbsence';

/**
 * Déclarations d'absence vues par l'école (directeur et enseignant).
 * La base filtre ce que chacun peut lire et traiter ; ce module ne contourne rien :
 * il demande, affiche, et envoie seulement statut et reponse pour un traitement.
 * Aucune donnée n'a d'autre source que la base.
 */

export type FiltreDeclarations = 'a_traiter' | 'traitees';

export interface DeclarationEcole extends DeclarationAbsence {
  declare_par: string | null;
  eleve: { nom: string; prenom: string; classe: string | null } | null;
  /** Nom du parent déclarant si la base le laisse lire, sinon null (affiché « Un tuteur »). */
  declarePar: string | null;
}

export const LIMITE_REPONSE = 300;
/** Nombre maximal de déclarations traitées affichées (les plus récentes). */
export const LIMITE_TRAITEES = 100;

export const MESSAGE_DEJA_TRAITEE = 'Cette déclaration a déjà été traitée ou ne peut plus être modifiée.';
export const MESSAGE_CHARGEMENT = 'Impossible de charger les déclarations pour le moment. Vérifiez votre connexion puis réessayez.';

const COLONNES =
  'id, eleve_id, declare_par, date_debut, date_fin, motif, commentaire, statut, reponse, traite_le, created_at, eleves(nom, prenom, classe)';

/** Date locale lisible (« 4 novembre 2026 ») d'un horodatage ISO de la base. Aucun décalage affiché en UTC. */
export function dateLocaleFr(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return formatDateFr(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
}

/** Noms des parents déclarants, si la base laisse les lire (profils). Une erreur ou zéro ligne n'est pas bloquant. */
async function lireNomsParents(ids: string[]): Promise<Map<string, string>> {
  const noms = new Map<string, string>();
  if (ids.length === 0) return noms;
  try {
    const { data, error } = await supabase.from('profils').select('id, nom, prenom').in('id', ids);
    if (error || !data) return noms;
    for (const p of data as { id: string; nom: string | null; prenom: string | null }[]) {
      const nom = [p.prenom, p.nom].filter((x) => x && x.trim()).join(' ').trim();
      if (nom) noms.set(p.id, nom);
    }
  } catch {
    // le nom reste simplement absent
  }
  return noms;
}

export async function listerDeclarationsEcole(filtre: FiltreDeclarations): Promise<DeclarationEcole[]> {
  let requete = supabase.from('declarations_absence').select(COLONNES);
  requete =
    filtre === 'a_traiter'
      ? requete.eq('statut', 'en_attente')
      : requete.in('statut', ['acceptee', 'refusee'] satisfies StatutDeclaration[]);
  requete = requete.order('created_at', { ascending: false });
  if (filtre === 'traitees') requete = requete.limit(LIMITE_TRAITEES);

  const { data, error } = await requete;
  if (error) throw new ErreurDeclaration(messageErreur(error, MESSAGE_CHARGEMENT));

  const lignes = (data ?? []) as unknown as (Omit<DeclarationEcole, 'eleve' | 'declarePar'> & {
    eleves: DeclarationEcole['eleve'] | DeclarationEcole['eleve'][];
  })[];
  const ids = Array.from(new Set(lignes.map((l) => l.declare_par).filter((x): x is string => Boolean(x))));
  const noms = await lireNomsParents(ids);

  return lignes.map(({ eleves, ...reste }) => ({
    ...reste,
    eleve: Array.isArray(eleves) ? eleves[0] ?? null : eleves ?? null,
    declarePar: reste.declare_par ? noms.get(reste.declare_par) ?? null : null,
  }));
}

/** Nombre de déclarations en attente visibles par l'utilisateur. Rien d'autre n'est demandé à la base. */
export async function compterDeclarationsEnAttente(): Promise<number> {
  const { count, error } = await supabase
    .from('declarations_absence')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'en_attente');
  if (error || typeof count !== 'number') throw new ErreurDeclaration(MESSAGE_CHARGEMENT);
  return count;
}

export class DejaTraiteeError extends ErreurDeclaration {}

/**
 * Traite une déclaration. Seuls statut et reponse sont envoyés, avec les conditions id et statut = 'en_attente'.
 * Le succès n'est reconnu que si la base renvoie la ligne modifiée ; zéro ligne = déjà traitée.
 */
export async function traiterDeclaration(
  id: string,
  statut: Extract<StatutDeclaration, 'acceptee' | 'refusee'>,
  reponse: string
): Promise<void> {
  const mot = reponse.trim();
  const { data, error } = await supabase
    .from('declarations_absence')
    .update({ statut, reponse: mot ? mot : null })
    .eq('id', id)
    .eq('statut', 'en_attente')
    .select('id, statut');
  if (error) {
    const message = messageErreur(error, 'Le traitement n’a pas pu être enregistré. Vérifiez votre connexion puis réessayez.');
    // « Cette déclaration a déjà été traitée. » levée par la base : même issue que zéro ligne.
    if (/déjà été traitée/i.test(message)) throw new DejaTraiteeError(message);
    throw new ErreurDeclaration(message);
  }
  if (!data || data.length === 0) throw new DejaTraiteeError(MESSAGE_DEJA_TRAITEE);
}

export interface ReperePresence {
  eleve_id: string;
  motif: string;
  statut: 'acceptee' | 'en_attente';
}

/**
 * Déclarations acceptées ou en attente dont la période couvre la date, pour des élèves donnés.
 * Information seulement : ne remplit rien dans la feuille d'appel.
 */
export async function listerReperesPresence(eleveIds: string[], date: string): Promise<ReperePresence[]> {
  if (eleveIds.length === 0 || !date) return [];
  const { data, error } = await supabase
    .from('declarations_absence')
    .select('eleve_id, motif, statut')
    .in('eleve_id', eleveIds)
    .in('statut', ['acceptee', 'en_attente'])
    .lte('date_debut', date)
    .gte('date_fin', date);
  if (error) throw new ErreurDeclaration(error.message ?? '');
  return (data ?? []) as ReperePresence[];
}
