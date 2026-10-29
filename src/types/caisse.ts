import { MethodePaiement } from './common';

export interface CaissierMock {
  id: string;
  ecole_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'caissier';
  guichet: string;
}

export interface CaisseTransaction {
  id: string;
  eleve_id: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe: string;
  echeance_libelle: string;
  montant: number;
  date: string;
  heure: string;
  methode: MethodePaiement;
  recu_ref: string;
  reference_transaction?: string | null;
  encaisse_par: string;
  statut: 'confirme' | 'en_attente' | 'annule';
}
