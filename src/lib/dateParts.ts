/**
 * Découpage et recomposition de dates AAAA-MM-JJ par chaînes de caractères uniquement :
 * aucun objet Date n'est utilisé pour la valeur échangée, donc aucun décalage de fuseau
 * ni inversion jour/mois n'est possible.
 */

export const MONTHS_FR_LOWER = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export interface DateParts {
  day: number | null;
  month: number | null; // 1 à 12
  year: number | null;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Nombre de jours du mois. Sans année connue, février compte 29 jours. */
export function daysInMonth(year: number | null, month: number | null): number {
  if (month === null) return 31;
  if (month === 2) return year !== null && !isLeapYear(year) ? 28 : 29;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Ramène le jour au dernier jour valide du mois. */
export function clampDay(day: number | null, year: number | null, month: number | null): number | null {
  if (day === null) return null;
  return Math.min(day, daysInMonth(year, month));
}

export function parseIsoDate(iso: string | undefined | null): DateParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? '').trim());
  if (!m) return { day: null, month: null, year: null };
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return { day: null, month: null, year: null };
  }
  return { day, month, year };
}

/** AAAA-MM-JJ si les trois parties sont connues et valides, sinon chaîne vide. */
export function toIsoDate(parts: DateParts): string {
  const { day, month, year } = parts;
  if (day === null || month === null || year === null) return '';
  if (day > daysInMonth(year, month)) return '';
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
