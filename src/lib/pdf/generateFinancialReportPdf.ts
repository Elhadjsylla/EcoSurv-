import { jsPDF } from 'jspdf';
import { MonthlyFinancialReport } from '../mockData';
import { formatMRU } from '../utils';
import { downloadFile } from '../downloadFile';
import { CLAIMS_CONFIG } from '../../config/claims';
import { ATTACHMENT_RULE_DESCRIPTION } from '../financialReportsHelper';

export function generateFinancialReportPdf(
  reports: MonthlyFinancialReport[],
  ecoleNom?: string,
  filename?: string
): jsPDF | null {
  if (!reports || reports.length === 0) {
    console.warn('[generateFinancialReportPdf] Aucun rapport à exporter.');
    return null;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  let y = 18;

  // En-tête national & ministériel (conditionné aux autorisations légales via CLAIMS_CONFIG)
  if (CLAIMS_CONFIG.republiqueIslamiqueMauritanie) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('RÉPUBLIQUE ISLAMIQUE DE MAURITANIE', pageWidth / 2, y, { align: 'center' });
    y += 4.5;
  }

  if (CLAIMS_CONFIG.deviseNationale) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Honneur - Fraternité - Justice', pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  if (CLAIMS_CONFIG.ministereEducationNationale) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("MINISTÈRE DE L'ÉDUCATION NATIONALE • DIRECTION DE L'ENSEIGNEMENT PRIVÉ", pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Établissement scolaire
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${ecoleNom || 'Établissement Scolaire'} • Direction Financière & Comptable`, pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(18, y, pageWidth - 18, y);

  // Titre du Rapport
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // bleu institutionnel
  doc.text('RAPPORT FINANCIER & ÉTAT DE RECOUVREMENT', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Exercice Scolaire 2025–2026 • Arrêté au ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });

  // Règle de rattachement comptable affichée explicitement
  y += 4.5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(ATTACHMENT_RULE_DESCRIPTION, pageWidth / 2, y, { align: 'center' });

  // Tableau récapitulatif
  y += 8;
  const tableX = 18;
  const colWidths = [45, 32, 32, 32, 33]; // total = 174mm (pageWidth 210 - 2*18)

  // En-tête du tableau
  doc.setFillColor(30, 41, 59);
  doc.rect(tableX, y, 174, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let currentX = tableX + 3;
  doc.text("Mois d'échéance", currentX, y + 5.5);
  currentX += colWidths[0];
  doc.text('Attendu', currentX + colWidths[1] - 6, y + 5.5, { align: 'right' });
  currentX += colWidths[1];
  doc.text('Encaissé', currentX + colWidths[2] - 6, y + 5.5, { align: 'right' });
  currentX += colWidths[2];
  doc.text('Impayés', currentX + colWidths[3] - 6, y + 5.5, { align: 'right' });
  currentX += colWidths[3];
  doc.text('Taux Recouvr.', currentX + colWidths[4] - 6, y + 5.5, { align: 'right' });

  y += 8;

  // Lignes de données
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);

  let totalAttendu = 0;
  let totalEncaisse = 0;
  let totalImpayes = 0;

  reports.forEach((r, idx) => {
    totalAttendu += r.attendu;
    totalEncaisse += r.encaisse;
    totalImpayes += r.impayes;

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(tableX, y, 174, 7, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(tableX, y + 7, tableX + 174, y + 7);

    doc.setTextColor(30, 41, 59);
    currentX = tableX + 3;
    doc.text(r.mois, currentX, y + 5);

    currentX += colWidths[0];
    doc.text(formatMRU(r.attendu), currentX + colWidths[1] - 6, y + 5, { align: 'right' });

    currentX += colWidths[1];
    doc.setTextColor(16, 120, 60);
    doc.text(formatMRU(r.encaisse), currentX + colWidths[2] - 6, y + 5, { align: 'right' });

    currentX += colWidths[2];
    doc.setTextColor(r.impayes > 0 ? 185 : 100, r.impayes > 0 ? 28 : 116, r.impayes > 0 ? 28 : 139);
    doc.text(formatMRU(r.impayes), currentX + colWidths[3] - 6, y + 5, { align: 'right' });

    // Taux : Affichage pur du pourcentage sans libellés subjectifs (Performant/Moyen/Critique)
    currentX += colWidths[3];
    doc.setTextColor(30, 41, 59);
    doc.text(`${r.taux}%`, currentX + colWidths[4] - 6, y + 5, { align: 'right' });

    y += 7;
  });

  // Ligne de totalisation générale
  y += 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, y, 174, 9, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.line(tableX, y, tableX + 174, y);
  doc.line(tableX, y + 9, tableX + 174, y + 9);

  const tauxGlobal = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  currentX = tableX + 3;
  doc.text('TOTAL CUMULÉ', currentX, y + 6);

  currentX += colWidths[0];
  doc.text(formatMRU(totalAttendu), currentX + colWidths[1] - 6, y + 6, { align: 'right' });

  currentX += colWidths[1];
  doc.setTextColor(16, 120, 60);
  doc.text(formatMRU(totalEncaisse), currentX + colWidths[2] - 6, y + 6, { align: 'right' });

  currentX += colWidths[2];
  doc.setTextColor(185, 28, 28);
  doc.text(formatMRU(totalImpayes), currentX + colWidths[3] - 6, y + 6, { align: 'right' });

  currentX += colWidths[3];
  doc.setTextColor(30, 58, 138);
  doc.text(`${tauxGlobal}%`, currentX + colWidths[4] - 6, y + 6, { align: 'right' });

  // Signatures et validation de l'établissement
  y += 25;
  doc.setDrawColor(203, 213, 225);
  doc.line(tableX, y, tableX + 174, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const mentionBas = CLAIMS_CONFIG.documentCertifie
    ? `Document financier certifié généré par EcoSurv le ${new Date().toLocaleDateString('fr-FR')}`
    : `Document financier de synthèse généré par EcoSurv le ${new Date().toLocaleDateString('fr-FR')}`;
  doc.text(mentionBas, tableX, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Le Responsable Administratif & Financier', tableX + 30, y, { align: 'center' });
  doc.text("Le Directeur de l'Établissement", tableX + 140, y, { align: 'center' });

  y += 18;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('(Signature et visa comptable)', tableX + 30, y, { align: 'center' });
  doc.text("(Cachet de l'établissement)", tableX + 140, y, { align: 'center' });

  // Téléchargement sécurisé
  const finalFilename = filename || `Rapport_Financier_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfBlob = doc.output('blob');

  downloadFile({
    filename: finalFilename,
    blobOrData: pdfBlob,
    mimeType: 'application/pdf',
  });

  return doc;
}
