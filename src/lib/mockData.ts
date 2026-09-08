// Données de démonstration conformes à 100% au schéma backend Supabase (BACKEND_AGENT.md)

export type RoleUtilisateur = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';
export type StatutEcheance = 'a_jour' | 'en_retard' | 'partiel' | 'paye';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse' | 'annule';
export type MethodePaiement = 'especes' | 'bankily' | 'masrvi' | 'sedad' | 'virement' | 'cheque';
export type LienParente = 'pere' | 'mere' | 'tuteur' | 'autre';
export type FrequenceEcheance = 'mensuel' | 'trimestriel' | 'annuel';

export interface EcoleMock {
  id: string;
  nom: string;
  code_ecole: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  annee_scolaire: string;
  statut_abonnement: 'essai' | 'actif' | 'suspendu' | 'expire' | 'annule';
}

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

export interface MonthlyFinancialReport {
  mois: string;
  attendu: number;
  encaisse: number;
  impayes: number;
  taux: number;
}

export const CURRENT_ECOLE: EcoleMock = {
  id: 'ecole-demo-001',
  nom: 'Lycée Privé Al-Amel Nouakchott',
  code_ecole: 'AMEL-NKTT',
  ville: 'Nouakchott (Tevragh-Zeina)',
  adresse: 'Avenue Moktar Ould Daddah',
  telephone: '+222 45 25 12 34',
  email: 'contact@alamel.edu.mr',
  annee_scolaire: '2025-2026',
  statut_abonnement: 'actif',
};

export const CURRENT_DIRECTEUR = {
  id: 'user-dir-001',
  ecole_id: 'ecole-demo-001',
  nom: 'SYLLA',
  prenom: 'Elhadj',
  email: 'directeur.demo@ecosurv.test',
  telephone: '+222 36 10 20 30',
  role: 'directeur' as RoleUtilisateur,
  actif: true,
};

export const MOCK_ELEVES: EleveWithStats[] = [
  {
    id: 'el-001',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-001',
    nom: 'DIALLO',
    prenom: 'Mamadou Oury',
    date_naissance: '2007-03-14',
    lieu_naissance: 'Nouakchott',
    sexe: 'M',
    classe: 'Terminales C',
    nom_tuteur: 'Amadou Diallo',
    telephone_tuteur: '+222 22 11 33 44',
    email_tuteur: 'a.diallo@gmail.com',
    adresse_tuteur: 'Ilot C 412, Tevragh-Zeina, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 45000,
    total_paid: 45000,
    remaining: 0,
    statut: 'paye',
    derniere_echeance_date: '2026-02-05',
    prochaine_echeance_date: '2026-03-05',
    prochaine_echeance_montant: 15000,
    nb_absences: 1,
    timeline_paiements: [
      {
        id: 'pay-001',
        libelle: 'Mensualité Février 2026',
        montant: 15000,
        date: '05/02/2026',
        methode: 'bankily',
        statut: 'regle',
        recu_ref: 'BKY-9012',
      },
      {
        id: 'pay-002',
        libelle: 'Mensualité Janvier 2026',
        montant: 15000,
        date: '04/01/2026',
        methode: 'especes',
        statut: 'regle',
        recu_ref: 'ESP-1045',
      },
      {
        id: 'pay-003',
        libelle: 'Frais d\'inscription & fournitures',
        montant: 15000,
        date: '15/09/2025',
        methode: 'masrvi',
        statut: 'regle',
        recu_ref: 'MSR-0089',
      },
    ],
  },
  {
    id: 'el-002',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-002',
    nom: 'BA',
    prenom: 'Aïssata',
    date_naissance: '2007-08-22',
    lieu_naissance: 'Nouadhibou',
    sexe: 'F',
    classe: 'Terminales C',
    nom_tuteur: 'Ibrahima Ba',
    telephone_tuteur: '+222 33 44 55 66',
    email_tuteur: 'i.ba@yahoo.fr',
    adresse_tuteur: 'Ksar Ouest, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 45000,
    total_paid: 15000,
    remaining: 30000,
    statut: 'en_retard',
    derniere_echeance_date: '2026-01-10',
    prochaine_echeance_date: '2026-01-10',
    prochaine_echeance_montant: 15000,
    nb_absences: 4,
    timeline_paiements: [
      {
        id: 'pay-004',
        libelle: 'Inscription Trimestre 1',
        montant: 15000,
        date: '20/09/2025',
        methode: 'especes',
        statut: 'regle',
        recu_ref: 'ESP-0891',
      },
    ],
  },
  {
    id: 'el-003',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-003',
    nom: 'SOW',
    prenom: 'Cheikh Tidiane',
    date_naissance: '2012-05-11',
    lieu_naissance: 'Rosso',
    sexe: 'M',
    classe: '6ème A',
    nom_tuteur: 'Ousmane Sow',
    telephone_tuteur: '+222 44 55 66 77',
    adresse_tuteur: 'Arafat Poteau 11, Nouakchott',
    lien_parente: 'tuteur',
    actif: true,
    total_due: 35000,
    total_paid: 20000,
    remaining: 15000,
    statut: 'partiel',
    derniere_echeance_date: '2026-02-01',
    prochaine_echeance_date: '2026-03-01',
    prochaine_echeance_montant: 15000,
    nb_absences: 0,
    timeline_paiements: [
      {
        id: 'pay-005',
        libelle: 'Mensualité Janvier 2026 (Acompte)',
        montant: 10000,
        date: '02/02/2026',
        methode: 'sedad',
        statut: 'regle',
        recu_ref: 'SDD-4412',
      },
      {
        id: 'pay-006',
        libelle: 'Inscription',
        montant: 10000,
        date: '18/09/2025',
        methode: 'especes',
        statut: 'regle',
        recu_ref: 'ESP-0512',
      },
    ],
  },
  {
    id: 'el-004',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-004',
    nom: 'MBOUP',
    prenom: 'Fatou Binetou',
    date_naissance: '2013-11-04',
    lieu_naissance: 'Kaédi',
    sexe: 'F',
    classe: 'CM2 A',
    nom_tuteur: 'Abdoulaye Mboup',
    telephone_tuteur: '+222 26 99 88 77',
    email_tuteur: 'amboup@dounia.mr',
    adresse_tuteur: 'Sebkha Secteur 4, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 30000,
    total_paid: 30000,
    remaining: 0,
    statut: 'paye',
    derniere_echeance_date: '2026-02-10',
    prochaine_echeance_date: '2026-03-10',
    prochaine_echeance_montant: 10000,
    nb_absences: 2,
    timeline_paiements: [
      {
        id: 'pay-007',
        libelle: 'Trimestre 2 complet',
        montant: 20000,
        date: '10/02/2026',
        methode: 'virement',
        statut: 'regle',
        recu_ref: 'VIR-9981',
      },
      {
        id: 'pay-008',
        libelle: 'Inscription',
        montant: 10000,
        date: '10/09/2025',
        methode: 'bankily',
        statut: 'regle',
        recu_ref: 'BKY-3310',
      },
    ],
  },
  {
    id: 'el-005',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-005',
    nom: 'OULD MOHAMED',
    prenom: 'Sidi Ely',
    date_naissance: '2006-09-30',
    lieu_naissance: 'Atar',
    sexe: 'M',
    classe: 'Terminales C',
    nom_tuteur: 'Mohamed Lemine',
    telephone_tuteur: '+222 46 88 11 22',
    adresse_tuteur: 'Tevragh-Zeina Ilot K, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 45000,
    total_paid: 0,
    remaining: 45000,
    statut: 'en_retard',
    derniere_echeance_date: '2026-01-15',
    prochaine_echeance_date: '2026-01-15',
    prochaine_echeance_montant: 15000,
    nb_absences: 6,
    timeline_paiements: [],
  },
  {
    id: 'el-006',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-006',
    nom: 'MINT AHMED',
    prenom: 'Maryam',
    date_naissance: '2009-12-18',
    lieu_naissance: 'Nouakchott',
    sexe: 'F',
    classe: '3ème B',
    nom_tuteur: 'Ahmed Vall',
    telephone_tuteur: '+222 36 77 00 11',
    adresse_tuteur: 'TVZ Centre, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 40000,
    total_paid: 40000,
    remaining: 0,
    statut: 'paye',
    derniere_echeance_date: '2026-02-12',
    prochaine_echeance_date: '2026-03-12',
    prochaine_echeance_montant: 12000,
    nb_absences: 0,
    timeline_paiements: [
      {
        id: 'pay-009',
        libelle: 'Mensualité Février 2026',
        montant: 12000,
        date: '12/02/2026',
        methode: 'bankily',
        statut: 'regle',
        recu_ref: 'BKY-7721',
      },
    ],
  },
  {
    id: 'el-007',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-007',
    nom: 'CAMARA',
    prenom: 'Boubacar',
    date_naissance: '2012-01-25',
    lieu_naissance: 'Sélibaby',
    sexe: 'M',
    classe: '6ème A',
    nom_tuteur: 'Moussa Camara',
    telephone_tuteur: '+222 22 55 88 00',
    adresse_tuteur: 'El Mina Secteur 2, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 35000,
    total_paid: 10000,
    remaining: 25000,
    statut: 'partiel',
    derniere_echeance_date: '2026-02-15',
    prochaine_echeance_date: '2026-02-15',
    prochaine_echeance_montant: 12500,
    nb_absences: 1,
    timeline_paiements: [
      {
        id: 'pay-010',
        libelle: 'Frais Inscription',
        montant: 10000,
        date: '15/09/2025',
        methode: 'especes',
        statut: 'regle',
        recu_ref: 'ESP-1102',
      },
    ],
  },
  {
    id: 'el-008',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-008',
    nom: 'KANE',
    prenom: 'Oumar',
    date_naissance: '2014-04-19',
    lieu_naissance: 'Nouakchott',
    sexe: 'M',
    classe: 'CM2 A',
    nom_tuteur: 'Demba Kane',
    telephone_tuteur: '+222 47 33 22 11',
    adresse_tuteur: 'Dar Naim, Nouakchott',
    lien_parente: 'pere',
    actif: true,
    total_due: 30000,
    total_paid: 30000,
    remaining: 0,
    statut: 'a_jour',
    derniere_echeance_date: '2026-03-01',
    prochaine_echeance_date: '2026-03-01',
    prochaine_echeance_montant: 10000,
    nb_absences: 0,
    timeline_paiements: [
      {
        id: 'pay-011',
        libelle: 'Mensualité Février 2026',
        montant: 10000,
        date: '28/01/2026',
        methode: 'bankily',
        statut: 'regle',
        recu_ref: 'BKY-4488',
      },
    ],
  },
];

export const MOCK_ECHEANCIERS: EcheancierConfig[] = [
  {
    id: 'ech-001',
    libelle: 'Tarif Lycée (Terminales C & D)',
    classe: 'Terminales C',
    montant_total: 45000,
    frequence: 'mensuel',
    nombre_tranches: 3,
    montant_par_tranche: 15000,
    date_limite_prochaine: '2026-03-05',
    nb_eleves_concernes: 45,
  },
  {
    id: 'ech-002',
    libelle: 'Tarif Collège (3ème & 6ème)',
    classe: '6ème A',
    montant_total: 35000,
    frequence: 'mensuel',
    nombre_tranches: 3,
    montant_par_tranche: 11666,
    date_limite_prochaine: '2026-03-01',
    nb_eleves_concernes: 38,
  },
  {
    id: 'ech-003',
    libelle: 'Tarif Primaire (CM2)',
    classe: 'CM2 A',
    montant_total: 30000,
    frequence: 'trimestriel',
    nombre_tranches: 3,
    montant_par_tranche: 10000,
    date_limite_prochaine: '2026-03-10',
    nb_eleves_concernes: 28,
  },
  {
    id: 'ech-004',
    libelle: 'Tarif Annuel Optionnel (Spécialité)',
    classe: 'Terminales C',
    montant_total: 60000,
    frequence: 'annuel',
    nombre_tranches: 1,
    montant_par_tranche: 60000,
    date_limite_prochaine: '2026-04-01',
    nb_eleves_concernes: 12,
  },
];

export const MOCK_HISTORIQUE_RELANCES: HistoriqueRelance[] = [
  {
    id: 'rel-101',
    eleve_id: 'el-002',
    eleve_nom: 'BA Aïssata',
    classe: 'Terminales C',
    canal: 'WhatsApp',
    telephone: '+222 33 44 55 66',
    date: '2026-02-28 14:30',
    statut: 'Delivré',
    message_snippet: 'Rappel EcoSurv: Échéance de 15 000 MRU en retard pour BA Aïssata. Merci de régler via Bankily.',
  },
  {
    id: 'rel-102',
    eleve_id: 'el-005',
    eleve_nom: 'OULD MOHAMED Sidi Ely',
    classe: 'Terminales C',
    canal: 'SMS',
    telephone: '+222 46 88 11 22',
    date: '2026-02-28 14:31',
    statut: 'Delivré',
    message_snippet: 'Rappel EcoSurv: Échéance de 45 000 MRU en retard pour OULD MOHAMED Sidi. Contactez la caisse.',
  },
  {
    id: 'rel-103',
    eleve_id: 'el-003',
    eleve_nom: 'SOW Cheikh Tidiane',
    classe: '6ème A',
    canal: 'WhatsApp',
    telephone: '+222 44 55 66 77',
    date: '2026-02-15 09:15',
    statut: 'Delivré',
    message_snippet: 'Rappel EcoSurv: Solde partiel restant de 15 000 MRU pour Cheikh Tidiane SOW.',
  },
  {
    id: 'rel-104',
    eleve_id: 'el-007',
    eleve_nom: 'CAMARA Boubacar',
    classe: '6ème A',
    canal: 'SMS',
    telephone: '+222 22 55 88 00',
    date: '2026-02-10 11:20',
    statut: 'Delivré',
    message_snippet: 'Rappel EcoSurv: Solde de 25 000 MRU en attente pour Boubacar CAMARA.',
  },
];

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 'st-001',
    nom: 'SYLLA',
    prenom: 'Elhadj',
    email: 'directeur.demo@ecosurv.test',
    telephone: '+222 36 10 20 30',
    role: 'directeur',
    actif: true,
    date_ajout: '2025-09-01',
  },
  {
    id: 'st-002',
    nom: 'FALL',
    prenom: 'Amadou',
    email: 'caissier.demo@ecosurv.test',
    telephone: '+222 22 99 88 11',
    role: 'caissier',
    actif: true,
    date_ajout: '2025-09-01',
  },
  {
    id: 'st-003',
    nom: 'KANE',
    prenom: 'Mamadou',
    email: 'enseignant.demo@ecosurv.test',
    telephone: '+222 45 66 77 88',
    role: 'enseignant',
    classe_assignee: 'Terminales C',
    actif: true,
    date_ajout: '2025-09-15',
  },
  {
    id: 'st-004',
    nom: 'MINT SIDI',
    prenom: 'Fatimata',
    email: 'fatimata.sidi@ecosurv.test',
    telephone: '+222 33 11 22 44',
    role: 'enseignant',
    classe_assignee: '6ème A',
    actif: true,
    date_ajout: '2025-10-01',
  },
];

export const MOCK_MONTHLY_REPORTS: MonthlyFinancialReport[] = [
  { mois: 'Septembre 2025', attendu: 90000, encaisse: 85000, impayes: 5000, taux: 94 },
  { mois: 'Octobre 2025', attendu: 85000, encaisse: 80000, impayes: 5000, taux: 94 },
  { mois: 'Novembre 2025', attendu: 85000, encaisse: 78000, impayes: 7000, taux: 91 },
  { mois: 'Décembre 2025', attendu: 85000, encaisse: 72000, impayes: 13000, taux: 84 },
  { mois: 'Janvier 2026', attendu: 85000, encaisse: 69000, impayes: 16000, taux: 81 },
  { mois: 'Février 2026', attendu: 85000, encaisse: 64000, impayes: 21000, taux: 75 },
  { mois: 'Mars 2026 (En cours)', attendu: 85000, encaisse: 42000, impayes: 43000, taux: 49 },
];

export function getDashboardKpis(eleves: EleveWithStats[]) {
  const totalAttendu = eleves.reduce((sum, e) => sum + e.total_due, 0);
  const totalEncaisse = eleves.reduce((sum, e) => sum + e.total_paid, 0);
  const totalImpayes = eleves.reduce((sum, e) => sum + e.remaining, 0);
  const tauxRecouvrement = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;

  const nombreEleves = eleves.length;
  const nombreEnRetard = eleves.filter((e) => e.statut === 'en_retard').length;
  const nombrePaye = eleves.filter((e) => e.statut === 'paye').length;
  const nombrePartiel = eleves.filter((e) => e.statut === 'partiel').length;
  const nombreAJour = eleves.filter((e) => e.statut === 'a_jour').length;

  return {
    totalAttendu,
    totalEncaisse,
    totalImpayes,
    tauxRecouvrement,
    nombreEleves,
    nombreEnRetard,
    nombrePaye,
    nombrePartiel,
    nombreAJour,
  };
}
