/**
 * Configuration des mentions officielles, institutionnelles et de certification juridique.
 * 
 * Par défaut, TOUS les indicateurs sont à `false` pour respecter la conformité réglementaire.
 * L'établissement ou l'administrateur peut les activer un par un s'il dispose
 * des autorisations officielles requises.
 */

export interface ClaimsConfig {
  /** En-tête "RÉPUBLIQUE ISLAMIQUE DE MAURITANIE" */
  republiqueIslamiqueMauritanie: boolean;

  /** Devise nationale "Honneur - Fraternité - Justice" */
  deviseNationale: boolean;

  /** Mention ministérielle "MINISTÈRE DE L'ÉDUCATION NATIONALE..." */
  ministereEducationNationale: boolean;

  /** Mention "Document certifié" ou "certifiée conforme" */
  documentCertifie: boolean;

  /** Mention "Document officiel" ou "Sceau officiel certifiant conforme" */
  documentOfficiel: boolean;

  /** Mention "Journal certifié conforme" dans le journal de caisse */
  journalCertifieConforme: boolean;

  /** Mention "Duplicata Quittance Officielle" dans l'impression du reçu */
  duplicataQuittanceOfficielle: boolean;

  /** Mention "Quittances certifiées par l'établissement" dans le portail parent */
  quittancesCertifiees: boolean;
}

export const CLAIMS_CONFIG: ClaimsConfig = {
  republiqueIslamiqueMauritanie: false,
  deviseNationale: false,
  ministereEducationNationale: false,
  documentCertifie: false,
  documentOfficiel: false,
  journalCertifieConforme: false,
  duplicataQuittanceOfficielle: false,
  quittancesCertifiees: false,
};
