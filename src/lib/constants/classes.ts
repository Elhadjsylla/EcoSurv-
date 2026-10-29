/**
 * Nomenclature de départ des classes scolaires en République Islamique de Mauritanie.
 * Sert uniquement de modèle optionnel lors de l'initialisation dans Configuration > Classes.
 */
export const DEFAULT_CLASSES_MAURITANIE: string[] = [
  // Fondamental / Primaire
  '1AF (CI / CP1)',
  '2AF (CP / CP2)',
  '3AF (CE1)',
  '4AF (CE2)',
  '5AF (CM1)',
  '6AF (CM2 / Concours)',

  // Collège (Enseignement Secondaire 1er cycle)
  '1AS (6ème A)',
  '1AS (6ème B)',
  '2AS (5ème A)',
  '2AS (5ème B)',
  '3AS (4ème A)',
  '3AS (4ème B)',
  '4AS (Brevet / 3ème A)',
  '4AS (Brevet / 3ème B)',

  // Lycée (Enseignement Secondaire 2nd cycle)
  '2nde C (Scientifique)',
  '2nde A (Littéraire)',
  '1ère C (Mathématiques)',
  '1ère D (Sciences Expérimentales)',
  '1ère A (Lettres Modernes)',
  'Terminales C',
  'Terminales D',
  'Terminales A',

  // Préscolaire / Maternelle
  'Petite Section',
  'Moyenne Section',
  'Grande Section',
];

export type NiveauModeleMauritanien = 'Maternelle' | 'Primaire' | 'Collège' | 'Lycée';

export const NIVEAUX_SCOLAIRES_ORDRE: NiveauModeleMauritanien[] = [
  'Maternelle',
  'Primaire',
  'Collège',
  'Lycée',
];

/**
 * Déduit le niveau scolaire à partir du libellé du modèle mauritanien :
 * - sections de maternelle -> Maternelle
 * - AF -> Primaire
 * - AS -> Collège
 * - 2nde / 1ère / Terminale -> Lycée
 */
export function deduireNiveauModeleMauritanien(nom: string): NiveauModeleMauritanien {
  if (nom.includes('Section')) return 'Maternelle';
  if (nom.includes('AF')) return 'Primaire';
  if (nom.includes('AS')) return 'Collège';
  if (nom.includes('2nde') || nom.includes('1ère') || nom.includes('Terminale')) return 'Lycée';
  return 'Primaire';
}
