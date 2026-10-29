import { StatutEcheance, MethodePaiement, LienParente } from './common';

export interface PaymentTimelineItem {
  id: string;
  libelle: string;
  montant: number;
  date: string;
  methode: MethodePaiement;
  statut: 'regle' | 'en_attente';
  recu_ref: string;
}

export interface EleveWithStats {
  id: string;
  ecole_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: 'M' | 'F';
  classe: string;
  nom_tuteur: string;
  telephone_tuteur: string;
  email_tuteur?: string;
  adresse_tuteur: string;
  lien_parente: LienParente;
  actif: boolean;
  total_due: number;
  total_paid: number;
  remaining: number;
  statut: StatutEcheance;
  derniere_echeance_date: string;
  prochaine_echeance_date?: string;
  prochaine_echeance_montant?: number;
  nb_absences: number;
  timeline_paiements: PaymentTimelineItem[];
}

export interface HistoriqueRelance {
  id: string;
  eleve_id: string;
  eleve_nom: string;
  classe: string;
  canal: 'SMS' | 'WhatsApp';
  telephone: string;
  date: string;
  statut: 'Delivré' | 'En cours' | 'Échoué';
  message_snippet: string;
}
