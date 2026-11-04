/**
 * Numéros de téléphone mauritaniens : 8 chiffres, indicatif +222.
 * Saisie acceptée avec ou sans « +222 » ou « 00222 », avec ou sans espaces, points ou tirets.
 * Forme enregistrée : +222XXXXXXXX.
 */

const COUNTRY_CODE = '222';
const LOCAL_LENGTH = 8;

/**
 * Retourne les 8 chiffres locaux d'une saisie, ou null si la saisie n'est pas un numéro valide.
 * L'indicatif n'est retiré que s'il est explicite : « + », « 00 », ou 11 chiffres commençant par 222.
 */
export function extractMauritanianLocalDigits(raw: string): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;

  // Seuls les chiffres, espaces, points, tirets, parenthèses et un « + » en tête sont tolérés.
  if (!/^\+?[\d\s.\-()]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) {
    if (!digits.startsWith(COUNTRY_CODE)) return null;
    digits = digits.slice(COUNTRY_CODE.length);
  } else if (digits.startsWith('00')) {
    if (!digits.startsWith('00' + COUNTRY_CODE)) return null;
    digits = digits.slice(2 + COUNTRY_CODE.length);
  } else if (digits.length === COUNTRY_CODE.length + LOCAL_LENGTH && digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(COUNTRY_CODE.length);
  }

  return digits.length === LOCAL_LENGTH ? digits : null;
}

export function isValidMauritanianPhone(raw: string): boolean {
  return extractMauritanianLocalDigits(raw) !== null;
}

/** Forme enregistrée : +222XXXXXXXX, ou null si invalide. */
export function normalizeMauritanianPhone(raw: string): string | null {
  const local = extractMauritanianLocalDigits(raw);
  return local ? `+${COUNTRY_CODE}${local}` : null;
}

/**
 * Forme affichée : « +222 XX XX XX XX ». Si la saisie n'est pas un numéro valide,
 * elle est renvoyée telle quelle pour ne pas effacer ce que l'utilisateur a tapé.
 */
export function formatMauritanianPhone(raw: string): string {
  const local = extractMauritanianLocalDigits(raw);
  if (!local) return raw ?? '';
  return `+${COUNTRY_CODE} ${local.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`;
}

export const PHONE_INVALID_MESSAGE =
  'Numéro de téléphone invalide : 8 chiffres attendus (exemple : +222 22 11 33 44).';
export const PHONE_REQUIRED_MESSAGE = 'Le numéro de téléphone est obligatoire.';

/**
 * Vrai si la valeur actuelle d'un champ est celle qui avait été chargée (telle quelle, reformatée,
 * ou réduite à ses 8 chiffres). Sert à ne pas bloquer l'enregistrement d'un numéro ancien non modifié.
 */
export function isPhoneValueUnchanged(current: string, original: string): boolean {
  const cur = (current ?? '').trim();
  const orig = (original ?? '').trim();
  if (!orig) return false;
  if (cur === orig) return true;
  const origLocal = extractMauritanianLocalDigits(orig);
  if (origLocal === null) return false;
  return extractMauritanianLocalDigits(cur) === origLocal;
}

/**
 * Nettoie ce qui est tapé ou collé dans un champ qui affiche déjà « +222 » en préfixe :
 * retire un « +222 » ou « 00222 » explicite en tête, ou les 3 premiers chiffres d'une saisie complète
 * de 11 chiffres commençant par 222. Le reste est conservé tel quel (la validation se fait à la sortie).
 */
export function stripTypedCountryCode(typed: string): string {
  const explicit = typed.replace(/^\s*(\+|00)\s*222[\s.\-]*/, '');
  if (explicit !== typed) return explicit;
  if (/^[\d\s.\-()]+$/.test(typed)) {
    const digits = typed.replace(/\D/g, '');
    if (digits.length === COUNTRY_CODE.length + LOCAL_LENGTH && digits.startsWith(COUNTRY_CODE)) {
      return digits.slice(COUNTRY_CODE.length);
    }
  }
  return typed;
}

/** Valeur affichée dans la zone de saisie (après le préfixe +222) : 8 chiffres groupés si le numéro est valide. */
export function toLocalInputValue(value: string): string {
  const local = extractMauritanianLocalDigits(value);
  if (local) return local.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  return stripTypedCountryCode(value ?? '');
}
