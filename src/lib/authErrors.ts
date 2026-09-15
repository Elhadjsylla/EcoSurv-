import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

export const MESSAGE_IDENTIFIANTS_INVALIDES = 'Email ou mot de passe incorrect.';

/**
 * Traduit une erreur de connexion en message affichable.
 *
 * Mauvais mot de passe, compte inexistant ou email mal formé donnent
 * volontairement le même message : l'écran ne doit jamais permettre de
 * savoir si une adresse possède un compte.
 */
export function messageErreurConnexion(error: AuthError): string {
  if (isAuthRetryableFetchError(error) || error.status === 0) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.';
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return 'Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.';
  }
  // Renvoyés uniquement quand le mot de passe est correct : ils ne révèlent
  // rien à quelqu'un qui ne le connaît pas.
  if (error.code === 'email_not_confirmed') {
    return "Ce compte n'est pas encore activé. Contactez la direction de votre établissement.";
  }
  if (error.code === 'user_banned') {
    return 'Ce compte est suspendu. Contactez la direction de votre établissement.';
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return 'Le service de connexion est momentanément indisponible. Réessayez dans quelques instants.';
  }
  return MESSAGE_IDENTIFIANTS_INVALIDES;
}
