import * as XLSX from 'xlsx';
import { EleveWithStats } from '../mockData';
import { downloadFile } from '../downloadFile';

export function exportElevesToExcel(
  eleves: EleveWithStats[],
  ecoleNom?: string,
  filename?: string
): void {
  const headers = [
    'Matricule',
    'Nom',
    'Prénom',
    'Classe',
    'Statut Frais',
    'Total Dû (MRU)',
    'Total Réglé (MRU)',
    'Reste à Payer (MRU)',
    'Tuteur Légal',
    'Téléphone Tuteur',
  ];

  const rows = eleves.map((e) => [
    e.matricule,
    e.nom,
    e.prenom,
    e.classe,
    e.statut === 'paye'
      ? 'À jour (Payé)'
      : e.statut === 'partiel'
      ? 'Acompte versé'
      : e.statut === 'en_retard'
      ? 'En retard'
      : 'Non réglé',
    e.total_due,
    e.total_paid,
    e.remaining,
    e.nom_tuteur || '',
    e.telephone_tuteur || '',
  ]);

  const sheetData = [
    [`LISTE DES ÉLÈVES & SITUATION DE SCOLARITÉ — ${ecoleNom || 'Établissement'}`],
    [`Date d'export : ${new Date().toLocaleDateString('fr-FR')} | Effectif : ${eleves.length} élève(s)`],
    [],
    headers,
    ...rows,
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 16 }, // Matricule
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 14 }, // Classe
    { wch: 18 }, // Statut
    { wch: 16 }, // Dû
    { wch: 16 }, // Réglé
    { wch: 16 }, // Reste
    { wch: 25 }, // Tuteur
    { wch: 18 }, // Téléphone
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Eleves');

  const now = new Date().toISOString().split('T')[0];
  const finalFilename =
    filename ||
    `Export_Eleves_${ecoleNom ? ecoleNom.replace(/\s+/g, '_') + '_' : ''}${now}.xlsx`;

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadFile({
    filename: finalFilename,
    blobOrData: excelBuffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
