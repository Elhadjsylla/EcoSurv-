/**
 * Libellés affichés quand une information manque.
 * Principe : l'écran dit qu'elle manque, il n'invente jamais une valeur plausible.
 */
export const NON_RENSEIGNE = 'Non renseigné';
export const NON_RENSEIGNEE = 'Non renseignée';
export const NON_ATTRIBUE = 'Non attribué';

/** Vrai si la valeur est un vrai nom (ni vide, ni le libellé « Non renseigné »). */
export function estRenseigne(valeur: string | null | undefined): valeur is string {
  const v = (valeur ?? '').trim();
  return v !== '' && v !== NON_RENSEIGNE && v !== NON_RENSEIGNEE && v !== NON_ATTRIBUE;
}
