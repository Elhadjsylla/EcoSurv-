export type RoleUtilisateur = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';
export type StatutEcheance = 'a_jour' | 'en_retard' | 'partiel' | 'paye';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse' | 'annule';
export type MethodePaiement = 'especes' | 'bankily' | 'masrvi' | 'sedad' | 'cheque' | 'virement';
export type LienParente = 'pere' | 'mere' | 'tuteur' | 'autre';
export type FrequenceEcheance = 'mensuel' | 'trimestriel' | 'annuel';
