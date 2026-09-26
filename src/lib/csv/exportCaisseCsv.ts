import { CaisseTransaction } from '../mockData';
import { downloadFile } from '../downloadFile';

export function exportCaisseCsv(transactions: CaisseTransaction[], filename?: string) {
  const headers = [
    'Date',
    'Heure',
    'N° Quittance',
    'Matricule',
    'Élève (Nom & Prénom)',
    'Classe',
    'Échéance / Motif',
    'Mode de règlement',
    'Montant (MRU)',
    'Caissier',
    'Statut',
  ];

  const rows = transactions.map((tx) => [
    `"${tx.date}"`,
    `"${tx.heure}"`,
    `"${tx.recu_ref}"`,
    `"${tx.matricule}"`,
    `"${tx.eleve_prenom} ${tx.eleve_nom}"`,
    `"${tx.classe}"`,
    `"${tx.echeance_libelle.replace(/"/g, '""')}"`,
    `"${tx.methode.toUpperCase()}"`,
    tx.montant.toString(),
    `"${tx.encaisse_par}"`,
    `"${tx.statut}"`,
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM pour bon affichage des accents sous Excel
    [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

  const now = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `Journal_Caisse_${now}.csv`;

  downloadFile({
    filename: finalFilename,
    blobOrData: csvContent,
    mimeType: 'text/csv;charset=utf-8;',
  });
}
