/**
 * Modèles d'affichage des écrans, construits à partir des tables Supabase
 * (src/types/database.ts). Aucun champ ici n'est inventé : une donnée que le
 * rôle ne peut pas lire vaut `null`, jamais une valeur de démonstration.
 */
import type {
  EcheanceRow,
  EleveRow,
  LienParente,
  MethodePaiement,
  RoleUtilisateur,
  StatutEcheance,
  StatutPaiement,
  TypeAbsence,
} from './database';

export type {
  LienParente,
  MethodePaiement,
  RoleUtilisateur,
  StatutEcheance,
  StatutPaiement,
  TypeAbsence,
} from './database';

export type EleveIdentite = Pick<
  EleveRow,
  | 'id'
  | 'ecole_id'
  | 'matricule'
  | 'nom'
  | 'prenom'
  | 'classe'
  | 'date_naissance'
  | 'lieu_naissance'
  | 'sexe'
  | 'annee_scolaire'
  | 'actif'
>;

/** Échéance avec son statut recalculé à la date du jour et son reste dû. */
export type EcheanceView = Pick<
  EcheanceRow,
  'id' | 'eleve_id' | 'libelle' | 'montant' | 'montant_paye' | 'date_echeance' | 'annee_scolaire'
> & {
  statut: StatutEcheance;
  reste: number;
};

export interface Tuteur {
  nom: string;
  telephone: string | null;
  email: string | null;
  lien: LienParente;
}

/** Dossier élève avec sa situation financière (portails Directeur, Caissier, Parent). */
export type EleveSituation = EleveIdentite & {
  /** null si aucun tuteur n'est déclaré, ou si le rôle ne peut pas lire les tuteurs. */
  tuteur: Tuteur | null;
  echeances: EcheanceView[];
  total_due: number;
  total_paid: number;
  remaining: number;
  statut: StatutEcheance;
  /** Première échéance non soldée, par date. */
  prochaine_echeance: { libelle: string; date: string; reste: number } | null;
  /** null si le rôle ne peut pas lire les absences (caissier). */
  nb_absences: number | null;
};

export interface PaiementView {
  id: string;
  echeance_id: string;
  montant: number;
  methode: MethodePaiement;
  statut: StatutPaiement;
  reference_transaction: string | null;
  encaisse_par: string | null;
  note: string | null;
  paye_le: string | null;
  created_at: string;
  /** Rattachement, quand l'échéance et l'élève sont lisibles par le rôle. */
  echeance_libelle: string | null;
  eleve: Pick<EleveIdentite, 'id' | 'nom' | 'prenom' | 'matricule' | 'classe'> | null;
}

export interface AbsenceView {
  id: string;
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe: string | null;
  date_absence: string;
  type: TypeAbsence;
  justifiee: boolean;
  motif: string | null;
}

/** Élève vu par un enseignant : aucune donnée financière ni coordonnée de tuteur. */
export type ElevePedagogique = EleveIdentite & {
  nb_absences: number;
  nb_retards: number;
  nb_non_justifiees: number;
};

export interface MembrePersonnel {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  role: RoleUtilisateur;
  actif: boolean;
  created_at: string;
  classes: string[];
}

/** Enfant d'un parent : situation financière, paiements et assiduité. */
export type EnfantParent = EleveSituation & {
  paiements: PaiementView[];
  absences: AbsenceView[];
};

export interface EcoleView {
  id: string;
  nom: string;
  ville: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  statut_abonnement: import('./database').StatutAbonnement;
  annee_scolaire: string | null;
}
