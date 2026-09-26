/**
 * Configuration des drapeaux de fonctionnalités (Feature Flags).
 * Respecte les directives de sécurité et de séparation des rôles (ECOSURV_RULES.md).
 */

/**
 * Détermine si le sélecteur de simulation de rôle ("Voir en tant que") est autorisé.
 *
 * Règles strictes :
 * 1. Pour un compte client réel en production (rattaché à un établissement réel en base) :
 *    JAMAIS visible par défaut. Accessible UNIQUEMENT si la variable VITE_ENABLE_ROLE_SIMULATOR
 *    vaut expressément 'true' (par exemple pour une session de test ou support dédiée).
 * 2. Pour un compte de démonstration fictif / déconnecté :
 *    Accessible en environnement de développement local ou si VITE_ENABLE_ROLE_SIMULATOR est 'true'.
 */
export function isRoleSimulatorAllowed(isRealAccount: boolean): boolean {
  const explicitFlag = import.meta.env.VITE_ENABLE_ROLE_SIMULATOR === 'true';

  if (isRealAccount) {
    // Client réel : strict verrouillage par défaut
    return explicitFlag;
  }

  // Démo ou hors-ligne : activable en DEV ou avec le drapeau
  return explicitFlag || Boolean(import.meta.env.DEV);
}
