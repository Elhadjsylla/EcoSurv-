import { FrequenceEcheance } from './common';

export interface EcheancierConfig {
  id: string;
  libelle: string;
  classe: string;
  montant_total: number;
  frequence: FrequenceEcheance;
  nombre_tranches: number;
  montant_par_tranche: number;
  date_limite_prochaine: string;
  nb_eleves_concernes: number;
}

export interface MonthlyFinancialReport {
  mois: string;
  attendu: number;
  encaisse: number;
  impayes: number;
  taux: number;
}
