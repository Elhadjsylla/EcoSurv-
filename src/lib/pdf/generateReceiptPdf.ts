import { jsPDF } from 'jspdf';
import { formatMRU } from '../utils';
import { downloadFile } from '../downloadFile';
import { CLAIMS_CONFIG } from '../../config/claims';

export interface ReceiptData {
  recuRef: string;
  datePaiement: string;
  eleveNom: string;
  elevePrenom: string;
  matricule: string;
  classe: string;
  libelleEcheance: string;
  montant: number;
  methodePaiement: string;
  referenceTransaction?: string | null;
  referenceOperateur?: string | null;
  caissierNom?: string;
  ecoleNom?: string;
  ecoleVille?: string;
  statut?: 'confirme' | 'en_attente' | string;
  nouveauSoldeRestant?: number | null;
  montantEnAttente?: number | null;
}

/**
 * Génère un reçu d'encaissement au format ticket de caisse (80mm)
 * et déclenche son téléchargement direct ou son impression propre.
 */
export function generateReceiptPdf(data: ReceiptData, action: 'download' | 'print' = 'download'): jsPDF {
  // Format ticket : largeur 80mm, hauteur 170mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 170],
  });

  const pageWidth = 80;
  let y = 10;

  // En-tête de l'établissement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.ecoleNom || 'Établissement Privé EcoSurv', pageWidth / 2, y, { align: 'center' });

  // Ligne établissement secondaire (ville si présente, sinon omise)
  if (data.ecoleVille) {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(data.ecoleVille, pageWidth / 2, y, { align: 'center' });
  }

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, pageWidth - 6, y);
  doc.setLineDashPattern([], 0);

  y += 6;
  doc.setFont('helvetica', 'bold');
  if (data.statut === 'en_attente') {
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // ambre
    doc.text('REÇU PROVISOIRE DE PAIEMENT', pageWidth / 2, y, { align: 'center' });
    y += 3.5;
    doc.setFontSize(7);
    const attenteLines = doc.splitTextToSize('EN ATTENTE DE CONFIRMATION', pageWidth - 12);
    doc.text(attenteLines, pageWidth / 2, y, { align: 'center' });
    y += (attenteLines.length - 1) * 3;
  } else {
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('REÇU D\'ENCAISSEMENT', pageWidth / 2, y, { align: 'center' });
  }

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`N° Quittance : ${data.recuRef}`, pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7);
  doc.text(`Date & Heure : ${data.datePaiement}`, pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.line(6, y, pageWidth - 6, y);

  // Informations de l'élève
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('ÉLÈVE CONCERNÉ', 6, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  const nomLines = doc.splitTextToSize(`Nom : ${data.elevePrenom} ${data.eleveNom}`, pageWidth - 12);
  doc.text(nomLines, 6, y);
  y += nomLines.length * 4;

  doc.text(`Matricule : ${data.matricule}`, 6, y);
  y += 4;

  const classeLines = doc.splitTextToSize(`Classe : ${data.classe}`, pageWidth - 12);
  doc.text(classeLines, 6, y);
  y += classeLines.length * 4;

  y += 1;
  doc.line(6, y, pageWidth - 6, y);

  // Détail du règlement
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DÉTAIL DU RÈGLEMENT', 6, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const motifLines = doc.splitTextToSize(`Motif : ${data.libelleEcheance}`, pageWidth - 12);
  doc.text(motifLines, 6, y);
  y += motifLines.length * 3.5 + 1;

  const methodeLabels: Record<string, string> = {
    especes: 'Espèces (Caisse Guichet)',
    bankily: 'Bankily (Paiement Mobile)',
    masrvi: 'Masrvi (Paiement Mobile)',
    sedad: 'Sedad (Paiement Mobile)',
    cheque: 'Chèque Bancaire',
    virement: 'Virement Bancaire',
  };
  doc.text(`Mode : ${methodeLabels[data.methodePaiement] || data.methodePaiement}`, 6, y);

  const refTx = (data.referenceTransaction || data.referenceOperateur || '').trim();
  if (refTx) {
    y += 4;
    const refLines = doc.splitTextToSize(`Réf. transaction : ${refTx}`, pageWidth - 12);
    doc.text(refLines, 6, y);
    y += (refLines.length - 1) * 3.5;
  }

  // Encadré Montant réglé
  y += 6;
  const isEnAttente = data.statut === 'en_attente';
  doc.setFillColor(isEnAttente ? 254 : 245, isEnAttente ? 243 : 247, isEnAttente ? 199 : 250); // amber-50 ou slate-50
  doc.roundedRect(6, y, pageWidth - 12, 14, 2, 2, 'F');
  doc.setDrawColor(isEnAttente ? 245 : 210, isEnAttente ? 158 : 220, isEnAttente ? 11 : 230); // amber-500 ou slate-300
  doc.roundedRect(6, y, pageWidth - 12, 14, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(isEnAttente ? 146 : 30, isEnAttente ? 64 : 41, isEnAttente ? 14 : 59);
  doc.text(isEnAttente ? 'MONTANT DÉCLARÉ (EN ATTENTE)' : 'MONTANT ENCAISSÉ', pageWidth / 2, y + 4.5, { align: 'center' });

  doc.setFontSize(11);
  if (isEnAttente) {
    doc.setTextColor(180, 83, 9); // ambre
  } else {
    doc.setTextColor(16, 120, 60); // vert sérieux
  }
  doc.text(formatMRU(data.montant), pageWidth / 2, y + 10.5, { align: 'center' });

  y += 18;

  // Ligne de solde restant ou montant en attente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  if (!isEnAttente && data.nouveauSoldeRestant !== undefined && data.nouveauSoldeRestant !== null) {
    doc.setTextColor(70, 70, 70);
    doc.text(`Reste à payer sur cette échéance : ${formatMRU(data.nouveauSoldeRestant)}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
  } else if (isEnAttente && data.montantEnAttente !== undefined && data.montantEnAttente !== null) {
    doc.setTextColor(180, 83, 9);
    doc.text(`Montant en attente cumulé : ${formatMRU(data.montantEnAttente)}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Pied de page ticket
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Opérateur de caisse : ${data.caissierNom || 'Guichet Central'}`, pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  const mentionRecu = isEnAttente
    ? 'Reçu provisoire — En attente de rapprochement bancaire'
    : (CLAIMS_CONFIG.documentOfficiel
      ? 'Quittance informatisée - Document officiel'
      : 'Quittance de versement informatisée');
  const mentionLines = doc.splitTextToSize(mentionRecu, pageWidth - 12);
  doc.text(mentionLines, pageWidth / 2, y, { align: 'center' });
  y += mentionLines.length * 3.5;

  doc.text(
    isEnAttente
      ? 'Conservez ce reçu jusqu’à la confirmation de votre règlement'
      : 'Conservez ce ticket comme justificatif de paiement',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  const cleanRef = data.recuRef.replace(/[^a-zA-Z0-9_-]/g, '_');
  const eleveSlug = `${data.elevePrenom || ''}_${data.eleveNom || ''}`.trim().replace(/\s+/g, '_');
  const filename = `Recu_${cleanRef}${eleveSlug ? '_' + eleveSlug : ''}.pdf`;
  const blob = doc.output('blob');

  if (action === 'print') {
    doc.autoPrint();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } else {
    downloadFile({
      filename,
      blobOrData: blob,
      mimeType: 'application/pdf',
    });
  }

  return doc;
}
