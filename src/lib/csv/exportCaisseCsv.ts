import { CaisseTransaction } from '../mockData';

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

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `journal_caisse_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
