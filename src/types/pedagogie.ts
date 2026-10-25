import { LienParente, StatutEcheance } from './common';

export interface EnseignantMock {
  id: string;
  ecole_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'enseignant';
  classes_assignees: string[];
  matieres: string[];
}

export interface ElevePedagogique {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: 'M' | 'F';
  classe: string;
  nom_tuteur: string;
  telephone_tuteur: string;
  adresse_tuteur: string;
  lien_parente: LienParente;
  actif: boolean;
  nb_absences: number;
  nb_retards: number;
  moyenne_generale: number;
  statut_presence_jour?: 'present' | 'absent' | 'retard';
}

export interface AbsenceRecord {
  id: string;
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe: string;
  date_absence: string; // YYYY-MM-DD
  creneau: 'matin' | 'apres_midi';
  type: 'absence' | 'retard';
  justifiee: boolean;
  motif?: string;
  minutes_retard?: number;
}

export interface EvaluationRecord {
  id: string;
  classe: string;
  matiere: string;
  titre: string;
  date: string;
  trimestre: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  coefficient: number;
  bareme: number; // ex: 20
  notes: Record<string, number | null>; // eleve_id -> note (/20)
}

export interface ParentMock {
  id: string;
  ecole_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  role: 'parent';
  enfants_ids: string[];
}

export interface ParentMatiereNote {
  matiere: string;
  moyenne: number;
  coefficient: number;
  professeur: string;
  appreciation: string;
  moyenne_classe: number;
}

export interface ParentEnfantDetail {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  photo_initiales: string;
  date_naissance: string;
  professeur_principal: string;
  total_scolarite: number;
  total_regle: number;
  reste_a_payer: number;
  statut_paiement: StatutEcheance;
  prochaine_echeance_date: string;
  prochaine_echeance_montant: number;
  moyenne_generale: number;
  rang: string;
  nb_absences_total: number;
  nb_retards_total: number;
  bulletin: ParentMatiereNote[];
  emploi_du_temps_aujourdhui: Array<{
    heure: string;
    matiere: string;
    salle: string;
    professeur: string;
  }>;
}
