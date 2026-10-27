/**
 * Calcule l'année scolaire suggérée en fonction d'une date (par défaut aujourd'hui).
 * - De septembre (mois index 8) à décembre (mois index 11) : "Y-(Y+1)" (ex: 2026-2027)
 * - De janvier (mois index 0) à août (mois index 7) : "(Y-1)-Y" (ex: 2025-2026)
 *
 * Cette fonction sert UNIQUEMENT de proposition pré-sélectionnée dans le menu
 * quand l'année est vide, JAMAIS de valeur silencieuse par défaut.
 */
export function anneeScolaireSuggeree(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Janvier, ..., 8 = Septembre, ..., 11 = Décembre
  const year = date.getFullYear();

  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Génère les options d'années scolaires pour les sélecteurs de configuration.
 * Propose l'année en cours (suggérée) et la suivante, ainsi que l'année précédente
 * et la valeur actuellement enregistrée si elle est différente.
 */
export function getAnneeScolaireOptions(
  currentValue?: string | null,
  date: Date = new Date()
): { value: string; label: string }[] {
  const suggested = anneeScolaireSuggeree(date);
  const startYear = parseInt(suggested.split('-')[0], 10);

  const valuesSet = new Set<string>();

  if (currentValue && currentValue.trim()) {
    valuesSet.add(currentValue.trim());
  }

  // Année précédente, année suggérée (en cours), année suivante
  valuesSet.add(`${startYear - 1}-${startYear}`);
  valuesSet.add(suggested);
  valuesSet.add(`${startYear + 1}-${startYear + 2}`);

  const sorted = Array.from(valuesSet).sort();

  return sorted.map((val) => ({
    value: val,
    label: val === suggested ? `${val} (Suggérée)` : val,
  }));
}

/**
 * @deprecated Remplacé par l'année scolaire de l'établissement (authProfile.ecole.annee_scolaire).
 * Conservé temporairement pour compatibilité avec les composants en cours de refactorisation.
 */
export const ANNEE_SCOLAIRE_ACTIVE = anneeScolaireSuggeree();
export const ANNEE_SCOLAIRE_PAR_DEFAUT = ANNEE_SCOLAIRE_ACTIVE;
