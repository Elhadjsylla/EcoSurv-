import { useMesEnfants } from '../../data/parent';

/**
 * Enfant affiché dans le portail Parent : celui choisi, ou le premier enfant
 * rattaché au compte. Un identifiant qui n'appartient pas au parent n'est
 * jamais résolu (la liste ne contient que ses enfants).
 */
export function useEnfantSelectionne(selectedChildId: string) {
  const query = useMesEnfants();
  const enfants = query.data ?? [];
  const enfant = enfants.find((e) => e.id === selectedChildId) ?? enfants[0] ?? null;
  return { ...query, enfants, enfant };
}
