/**
 * Types de la base Supabase EcoSurv, écrits à la main d'après
 * supabase/migrations (schéma MVP, policies RLS, enum des modes de paiement).
 * À remplacer par `supabase gen types typescript` dès que le projet est
 * accessible par la CLI.
 *
 * Les types `Insert` et `Update` ne reprennent que les colonnes que le rôle
 * `authenticated` a le droit d'écrire (BACKEND_AGENT.md §6, grants de
 * colonnes) : le frontend ne peut donc pas, même par erreur, envoyer
 * `montant_paye`, un `statut` d'échéance ou le statut d'un paiement existant.
 */

export type RoleUtilisateur = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';
export type StatutAbonnement = 'essai' | 'actif' | 'suspendu' | 'expire' | 'annule';
export type StatutEcheance = 'a_jour' | 'en_retard' | 'partiel' | 'paye';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse' | 'annule';
export type MethodePaiement = 'especes' | 'bankily' | 'masrvi' | 'cheque';
export type LienParente = 'pere' | 'mere' | 'tuteur' | 'autre';
export type TypeAbsence = 'absence' | 'retard';

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type EcoleRow = {
  id: string;
  nom: string;
  ville: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  statut_abonnement: StatutAbonnement;
  abonnement_debut: string | null;
  abonnement_fin: string | null;
  annee_scolaire: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfilRow = {
  id: string;
  ecole_id: string | null;
  role: RoleUtilisateur;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type EleveRow = {
  id: string;
  ecole_id: string;
  matricule: string | null;
  nom: string;
  prenom: string;
  classe: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  sexe: 'M' | 'F' | null;
  annee_scolaire: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type ParentEleveRow = {
  id: string;
  ecole_id: string;
  parent_id: string;
  eleve_id: string;
  lien: LienParente;
  principal: boolean;
  created_at: string;
};

export type EcheanceRow = {
  id: string;
  ecole_id: string;
  eleve_id: string;
  libelle: string;
  montant: number;
  montant_paye: number;
  date_echeance: string;
  statut: StatutEcheance;
  annee_scolaire: string | null;
  created_at: string;
  updated_at: string;
};

export type PaiementRow = {
  id: string;
  ecole_id: string;
  echeance_id: string;
  montant: number;
  methode: MethodePaiement;
  statut: StatutPaiement;
  reference_transaction: string | null;
  encaisse_par: string | null;
  note: string | null;
  paye_le: string | null;
  created_at: string;
  updated_at: string;
};

export type AbsenceRow = {
  id: string;
  ecole_id: string;
  eleve_id: string;
  date_absence: string;
  type: TypeAbsence;
  justifiee: boolean;
  motif: string | null;
  saisie_par: string | null;
  created_at: string;
  updated_at: string;
};

export type AffectationEnseignantRow = {
  id: string;
  ecole_id: string;
  enseignant_id: string;
  classe: string;
  annee_scolaire: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      ecoles: Table<
        EcoleRow,
        Pick<EcoleRow, 'nom'> &
          Partial<Pick<EcoleRow, 'ville' | 'adresse' | 'telephone' | 'email' | 'annee_scolaire'>>,
        Partial<Pick<EcoleRow, 'nom' | 'ville' | 'adresse' | 'telephone' | 'email' | 'annee_scolaire'>>
      >;
      profils: Table<
        ProfilRow,
        Pick<ProfilRow, 'id' | 'role' | 'nom'> &
          Partial<Pick<ProfilRow, 'ecole_id' | 'prenom' | 'telephone' | 'email' | 'actif'>>,
        Partial<Pick<ProfilRow, 'nom' | 'prenom' | 'telephone' | 'email' | 'actif'>>
      >;
      eleves: Table<
        EleveRow,
        Pick<EleveRow, 'ecole_id' | 'nom' | 'prenom'> &
          Partial<
            Pick<
              EleveRow,
              'matricule' | 'classe' | 'date_naissance' | 'lieu_naissance' | 'sexe' | 'annee_scolaire' | 'actif'
            >
          >,
        Partial<
          Pick<
            EleveRow,
            'matricule' | 'nom' | 'prenom' | 'classe' | 'date_naissance' | 'lieu_naissance' | 'sexe' | 'annee_scolaire' | 'actif'
          >
        >
      >;
      parents_eleves: Table<
        ParentEleveRow,
        Pick<ParentEleveRow, 'ecole_id' | 'parent_id' | 'eleve_id'> & Partial<Pick<ParentEleveRow, 'lien' | 'principal'>>,
        Partial<Pick<ParentEleveRow, 'lien' | 'principal'>>
      >;
      echeances: Table<
        EcheanceRow,
        Pick<EcheanceRow, 'ecole_id' | 'eleve_id' | 'libelle' | 'montant' | 'date_echeance'> &
          Partial<Pick<EcheanceRow, 'annee_scolaire'>>,
        Partial<Pick<EcheanceRow, 'libelle' | 'montant' | 'date_echeance' | 'annee_scolaire'>>
      >;
      paiements: Table<
        PaiementRow,
        Pick<PaiementRow, 'ecole_id' | 'echeance_id' | 'montant' | 'methode'> &
          Partial<Pick<PaiementRow, 'statut' | 'reference_transaction' | 'encaisse_par' | 'note' | 'paye_le'>>,
        Partial<Pick<PaiementRow, 'note'>>
      >;
      absences: Table<
        AbsenceRow,
        Pick<AbsenceRow, 'ecole_id' | 'eleve_id' | 'date_absence'> &
          Partial<Pick<AbsenceRow, 'type' | 'justifiee' | 'motif' | 'saisie_par'>>,
        Partial<Pick<AbsenceRow, 'date_absence' | 'type' | 'justifiee' | 'motif' | 'saisie_par'>>
      >;
      affectations_enseignants: Table<
        AffectationEnseignantRow,
        Pick<AffectationEnseignantRow, 'ecole_id' | 'enseignant_id' | 'classe'> &
          Partial<Pick<AffectationEnseignantRow, 'annee_scolaire'>>,
        Partial<Pick<AffectationEnseignantRow, 'classe' | 'annee_scolaire'>>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_utilisateur: RoleUtilisateur;
      statut_abonnement: StatutAbonnement;
      statut_echeance: StatutEcheance;
      statut_paiement: StatutPaiement;
      methode_paiement: MethodePaiement;
      lien_parente: LienParente;
      type_absence: TypeAbsence;
    };
    CompositeTypes: Record<string, never>;
  };
};
