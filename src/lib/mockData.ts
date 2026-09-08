// Données de démonstration conformes à 100% au schéma backend Supabase (BACKEND_AGENT.md)

export type RoleUtilisateur = 'super_admin' | 'directeur' | 'enseignant' | 'parent' | 'caissier';
export type StatutEcheance = 'a_jour' | 'en_retard' | 'partiel' | 'paye';
export type StatutPaiement = 'en_attente' | 'confirme' | 'echoue' | 'rembourse' | 'annule';
export type MethodePaiement = 'especes' | 'bankily' | 'masrvi' | 'sedad' | 'virement' | 'cheque';

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

export interface EleveWithStats {
  id: string;
  ecole_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  classe: string;
  nom_tuteur: string;
  telephone_tuteur: string;
  email_tuteur?: string;
  actif: boolean;
  total_due: number;
  total_paid: number;
  remaining: number;
  statut: StatutEcheance;
  derniere_echeance_date: string;
  nb_absences: number;
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
    sexe: 'M',
    classe: 'Terminales C',
    nom_tuteur: 'Amadou Diallo',
    telephone_tuteur: '+222 22 11 33 44',
    email_tuteur: 'a.diallo@gmail.com',
    actif: true,
    total_due: 45000,
    total_paid: 45000,
    remaining: 0,
    statut: 'paye',
    derniere_echeance_date: '2026-02-05',
    nb_absences: 1,
  },
  {
    id: 'el-002',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-002',
    nom: 'BA',
    prenom: 'Aïssata',
    sexe: 'F',
    classe: 'Terminales C',
    nom_tuteur: 'Ibrahima Ba',
    telephone_tuteur: '+222 33 44 55 66',
    email_tuteur: 'i.ba@yahoo.fr',
    actif: true,
    total_due: 45000,
    total_paid: 15000,
    remaining: 30000,
    statut: 'en_retard',
    derniere_echeance_date: '2026-01-10',
    nb_absences: 4,
  },
  {
    id: 'el-003',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-003',
    nom: 'SOW',
    prenom: 'Cheikh Tidiane',
    sexe: 'M',
    classe: '6ème A',
    nom_tuteur: 'Ousmane Sow',
    telephone_tuteur: '+222 44 55 66 77',
    actif: true,
    total_due: 35000,
    total_paid: 20000,
    remaining: 15000,
    statut: 'partiel',
    derniere_echeance_date: '2026-02-01',
    nb_absences: 0,
  },
  {
    id: 'el-004',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-004',
    nom: 'MBOUP',
    prenom: 'Fatou Binetou',
    sexe: 'F',
    classe: 'CM2 A',
    nom_tuteur: 'Abdoulaye Mboup',
    telephone_tuteur: '+222 26 99 88 77',
    email_tuteur: 'amboup@dounia.mr',
    actif: true,
    total_due: 30000,
    total_paid: 30000,
    remaining: 0,
    statut: 'paye',
    derniere_echeance_date: '2026-02-10',
    nb_absences: 2,
  },
  {
    id: 'el-005',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-005',
    nom: 'OULD MOHAMED',
    prenom: 'Sidi Ely',
    sexe: 'M',
    classe: 'Terminales C',
    nom_tuteur: 'Mohamed Lemine',
    telephone_tuteur: '+222 46 88 11 22',
    actif: true,
    total_due: 45000,
    total_paid: 0,
    remaining: 45000,
    statut: 'en_retard',
    derniere_echeance_date: '2026-01-15',
    nb_absences: 6,
  },
  {
    id: 'el-006',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-006',
    nom: 'MINT AHMED',
    prenom: 'Maryam',
    sexe: 'F',
    classe: '3ème B',
    nom_tuteur: 'Ahmed Vall',
    telephone_tuteur: '+222 36 77 00 11',
    actif: true,
    total_due: 40000,
    total_paid: 40000,
    remaining: 0,
    statut: 'paye',
    derniere_echeance_date: '2026-02-12',
    nb_absences: 0,
  },
  {
    id: 'el-007',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-007',
    nom: 'CAMARA',
    prenom: 'Boubacar',
    sexe: 'M',
    classe: '6ème A',
    nom_tuteur: 'Moussa Camara',
    telephone_tuteur: '+222 22 55 88 00',
    actif: true,
    total_due: 35000,
    total_paid: 10000,
    remaining: 25000,
    statut: 'partiel',
    derniere_echeance_date: '2026-02-15',
    nb_absences: 1,
  },
  {
    id: 'el-008',
    ecole_id: 'ecole-demo-001',
    matricule: 'DEMO-2025-008',
    nom: 'KANE',
    prenom: 'Oumar',
    sexe: 'M',
    classe: 'CM2 A',
    nom_tuteur: 'Demba Kane',
    telephone_tuteur: '+222 47 33 22 11',
    actif: true,
    total_due: 30000,
    total_paid: 30000,
    remaining: 0,
    statut: 'a_jour',
    derniere_echeance_date: '2026-03-01',
    nb_absences: 0,
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
