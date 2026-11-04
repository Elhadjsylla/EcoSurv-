/**
 * Les 15 wilayas (régions) de la Mauritanie.
 * Orthographe vérifiée contre la page « Regions of Mauritania » de Wikipedia le 3 novembre 2026
 * (Nouakchott y est découpée en trois wilayas depuis le décret n° 2014-182 bis du 2 décembre 2014).
 * Les noms n'ont pas été comparés à un texte officiel de l'administration mauritanienne.
 */
export const WILAYAS_MAURITANIE: readonly string[] = [
  'Hodh Ech Chargui',
  'Hodh El Gharbi',
  'Assaba',
  'Gorgol',
  'Brakna',
  'Trarza',
  'Adrar',
  'Dakhlet Nouadhibou',
  'Tagant',
  'Guidimaka',
  'Tiris Zemmour',
  'Inchiri',
  'Nouakchott-Nord',
  'Nouakchott-Ouest',
  'Nouakchott-Sud',
];

/** Minuscules, sans accents, tirets et espaces multiples ramenés à un espace : pour comparer des saisies. */
export function normalizeForSearch(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .trim();
}
