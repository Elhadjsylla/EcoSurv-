/**
 * Helper d'extraction et de traduction des erreurs Supabase Edge Functions.
 * Empêche tout affichage technique du type "Edge Function returned a non-2xx status code"
 * et garantit un message clair en français pour l'utilisateur.
 */
export async function parseEdgeFunctionError(
  error: any,
  defaultMessage = "Une erreur est survenue lors de l'appel au serveur."
): Promise<string> {
  if (!error) return defaultMessage;

  let candidate = '';

  // 1. Tenter d'extraire la réponse HTTP encapsulée dans error.context ou response
  const ctx = error.context || (error as any).response;
  if (ctx) {
    if (typeof ctx.clone === 'function') {
      try {
        const bodyJson = await ctx.clone().json();
        if (bodyJson?.error && typeof bodyJson.error === 'string') {
          candidate = bodyJson.error;
        } else if (bodyJson?.message && typeof bodyJson.message === 'string') {
          candidate = bodyJson.message;
        } else if (bodyJson?.msg && typeof bodyJson.msg === 'string') {
          candidate = bodyJson.msg;
        }
      } catch {
        try {
          const bodyText = await ctx.clone().text();
          if (bodyText && !bodyText.trim().startsWith('<') && bodyText.length < 300) {
            candidate = bodyText.trim();
          }
        } catch {
          // pas de corps texte lisible
        }
      }
    } else if (typeof ctx.json === 'function') {
      try {
        const bodyJson = await ctx.json();
        if (bodyJson?.error) candidate = bodyJson.error;
        else if (bodyJson?.message) candidate = bodyJson.message;
      } catch {
        // pas de corps json
      }
    }
  }

  // 2. Si aucun message n'a été extrait du corps HTTP, inspecter error.message
  if (!candidate && error.message) {
    candidate = error.message;
  }

  // 3. Remplacer les messages techniques bruts par des explications claires en français
  if (!candidate || candidate.includes('non-2xx status code') || candidate.includes('FunctionsHttpError')) {
    const status = ctx?.status;
    if (status === 401 || status === 403) {
      return "Accès non autorisé ou session expirée. Veuillez vous reconnecter.";
    }
    if (status === 404) {
      return "Le service d'invitation n'est pas actif ou introuvable sur le serveur.";
    }
    if (status === 500) {
      return "Erreur interne survenue dans la fonction d'invitation sur le serveur.";
    }
    return defaultMessage;
  }

  // 4. Traduction des erreurs d'authentification Supabase courantes en anglais
  if (candidate.includes('already been registered') || candidate.includes('User already registered')) {
    return "Cette adresse email est déjà associée à un compte utilisateur.";
  }
  if (candidate.includes('rate limit exceeded')) {
    return "Limite d'envois atteinte pour cette adresse email. Veuillez patienter quelques minutes.";
  }
  if (candidate.includes('valid email') || candidate.includes('invalid email')) {
    return "Le format de l'adresse email renseignée est invalide.";
  }
  if (candidate.includes('network') || candidate.includes('Failed to fetch')) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
  }

  return candidate;
}
