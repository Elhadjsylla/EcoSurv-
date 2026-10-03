import * as XLSX from 'xlsx';
import { MonthlyFinancialReport } from '../mockData';
import { downloadFile } from '../downloadFile';
import { ATTACHMENT_RULE_DESCRIPTION } from '../financialReportsHelper';

export function exportFinancialReportsToExcel(
  reports: MonthlyFinancialReport[],
  filename?: string
) {
  if (!reports || reports.length === 0) {
    console.warn('[exportFinancialReportsToExcel] Aucun rapport à exporter.');
    return;
  }

  // Calculs annuels
  const totalAttendu = reports.reduce((sum, r) => sum + r.attendu, 0);
  const totalEncaisse = reports.reduce((sum, r) => sum + r.encaisse, 0);
  const totalImpayes = reports.reduce((sum, r) => sum + r.impayes, 0);
  const tauxGlobal = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;

  // Données de la feuille sous forme de tableau 2D
  const sheetData: (string | number)[][] = [
    ['ECOSURV — SYSTÈME DE GESTION DE SCOLARITÉ DES ÉCOLES PRIVÉES'],
    ['RAPPORT FINANCIER & ÉTAT DE RECOUVREMENT DE SCOLARITÉ'],
    [`Exercice Scolaire : 2025-2026 | Date d'exportation : ${new Date().toLocaleDateString('fr-FR')}`],
    [ATTACHMENT_RULE_DESCRIPTION],
    [], // ligne vide
    [
      "Mois d'échéance",
      'Attendu (MRU)',
      'Encaissé (MRU)',
      'Impayés (MRU)',
      'Taux de recouvrement',
    ],
  ];

  // Lignes mensuelles (pourcentages purs sans étiquettes subjectives)
  reports.forEach((r) => {
    sheetData.push([
      r.mois,
      r.attendu,
      r.encaisse,
      r.impayes,
      `${r.taux}%`,
    ]);
  });

  // Ligne de totalisation
  sheetData.push([]);
  sheetData.push([
    'TOTAL GÉNÉRAL',
    totalAttendu,
    totalEncaisse,
    totalImpayes,
    `${tauxGlobal}%`,
  ]);

  // Création du workbook et worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Définition des largeurs de colonnes
  ws['!cols'] = [
    { wch: 24 }, // Mois d'échéance
    { wch: 20 }, // Attendu
    { wch: 20 }, // Encaissé
    { wch: 20 }, // Impayés
    { wch: 24 }, // Taux
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rapport_Financier');

  // Déclencher le téléchargement du fichier binaire .xlsx
  const finalFilename = filename || `Rapport_Financier_${new Date().toISOString().split('T')[0]}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadFile({
    filename: finalFilename,
    blobOrData: blob,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
