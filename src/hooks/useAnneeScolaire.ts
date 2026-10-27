import { useAuthStore } from '../store/useAuthStore';
import { useEcoleStore } from '../store/useEcoleStore';

/**
 * Renvoie l'année scolaire active enregistrée pour l'établissement courant,
 * ou null si aucune année scolaire n'est configurée en base.
 */
export function useAnneeScolaire(): string | null {
  const authAnnee = useAuthStore((s) => s.ecole?.annee_scolaire);
  const ecoleAnnee = useEcoleStore((s) => s.ecole?.annee_scolaire);
  const val = authAnnee || ecoleAnnee;
  if (!val || !val.trim()) {
    return null;
  }
  return val.trim();
}

/**
 * Accès direct et non-réactif à l'année scolaire depuis les stores (pour les fonctions utilitaires hors React).
 * Renvoie l'année ou null si vide.
 */
export function getAnneeScolaire(): string | null {
  const authAnnee = useAuthStore.getState().ecole?.annee_scolaire;
  const ecoleAnnee = useEcoleStore.getState().ecole?.annee_scolaire;
  const val = authAnnee || ecoleAnnee;
  if (!val || !val.trim()) {
    return null;
  }
  return val.trim();
}
