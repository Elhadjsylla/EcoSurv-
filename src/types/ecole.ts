import { RoleUtilisateur } from './common';

export interface EcoleMock {
  id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  annee_scolaire?: string;
  statut_abonnement?: 'essai' | 'actif' | 'suspendu' | 'expire' | 'annule';
  statut_activation?: string;
  devise?: string;
  date_creation?: string;
}

export interface StaffMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: RoleUtilisateur;
  classe_assignee?: string;
  actif: boolean;
  date_ajout: string;
}
