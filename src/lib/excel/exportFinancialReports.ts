import * as XLSX from 'xlsx';
import { MonthlyFinancialReport } from '../mockData';

export function exportFinancialReportsToExcel(
  reports: MonthlyFinancialReport[],
  filename?: string
) {
  // Calculs annuels
  const totalAttendu = reports.reduce((sum, r) => sum + r.attendu, 0);
  const totalEncaisse = reports.reduce((sum, r) => sum + r.encaisse, 0);
  const totalImpayes = reports.reduce((sum, r) => sum + r.impayes, 0);
  const tauxGlobal = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;

  // Données de la feuille sous forme de tableau 2D
  const sheetData: (string | number)[][] = [
    ['ECOSURV — SYSTÈME DE GESTION DE SCOLARITÉ DES ÉCOLES PRIVÉES'],
    ['RAPPORT FINANCIER & ÉTAT DE RECOUVREMENT DE SCOLARITÉ'],
    [`Année Scolaire : 2025-2026 | Date d'exportation : ${new Date().toLocaleDateString('fr-FR')}`],
    [], // ligne vide
    [
      'Mois',
      'Attendu (MRU)',
      'Encaissé (MRU)',
      'Impayés (MRU)',
      'Taux de recouvrement',
      'Statut Mensuel',
    ],
  ];

  // Lignes mensuelles
  reports.forEach((r) => {
    sheetData.push([
      r.mois,
      r.attendu,
      r.encaisse,
      r.impayes,
      `${r.taux}%`,
      r.taux >= 85 ? 'Performant' : r.taux >= 70 ? 'Satisfaisant' : 'En retard',
    ]);
  });

  // Ligne de totalisation
  sheetData.push([]);
  sheetData.push([
    'TOTAL GÉNÉRAL ANNUEL',
    totalAttendu,
    totalEncaisse,
    totalImpayes,
    `${tauxGlobal}%`,
    tauxGlobal >= 80 ? 'Conforme aux objectifs' : 'Action de relance requise',
  ]);

  // Création du workbook et worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Définition des largeurs de colonnes
  ws['!cols'] = [
    { wch: 20 }, // Mois
    { wch: 18 }, // Attendu
    { wch: 18 }, // Encaissé
    { wch: 18 }, // Impayés
    { wch: 22 }, // Taux
    { wch: 28 }, // Statut
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rapport_Financier_2025_2026');

  // Déclencher le téléchargement du fichier binaire .xlsx
  const outputFileName =
    filename || `Rapport_Financier_EcoSurv_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, outputFileName);
}
