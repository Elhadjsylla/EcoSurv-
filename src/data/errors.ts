/** Message affichable pour une erreur de lecture ou d'écriture Supabase. */
export function messageErreurDonnees(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  switch (e?.code) {
    case '42501':
      return "Action refusée : votre rôle n'y donne pas accès.";
    case '23505':
      return 'Cette valeur existe déjà (matricule ou référence en double).';
    case '23503':
    case '23514':
      return 'Données incohérentes : vérifiez les informations saisies.';
    case 'PGRST301':
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    default:
      if (e instanceof Error && e.name === 'ValidationError') return e.message;
      return 'Impossible de charger ou d’enregistrer les données. Vérifiez votre connexion puis réessayez.';
  }
}

/** Erreur de saisie détectée avant l'envoi : son message est affiché tel quel. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
