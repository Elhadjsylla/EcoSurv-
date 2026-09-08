// Données de démonstration conformes à 100% au schéma backend Supabase (BACKEND_AGENT.md)

export type RoleUtilisateur = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';
export type StatutEcheance = 'a_jour' | 'en_retard' | 'partiel' | 'paye';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse' | 'annule';
export type MethodePaiement = 'especes' | 'bankily' | 'masrvi' | 'sedad' | 'virement' | 'cheque';
export type LienParente = 'pere' | 'mere' | 'tuteur' | 'autre';

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
