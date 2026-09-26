import { jsPDF } from 'jspdf';
import { EleveWithStats } from '../mockData';
import { formatMRU } from '../utils';
import { downloadFile } from '../downloadFile';

export function generateStudentSheetPdf(eleve: EleveWithStats, action: 'download' | 'print' = 'download'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  let y = 18;

  // En-tête national & scolaire officiel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('RÉPUBLIQUE ISLAMIQUE DE MAURITANIE', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MINISTÈRE DE L\'ÉDUCATION NATIONALE ET DE LA RÉFORME DU SYSTÈME ÉDUCATIF', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(8);
  doc.text('Direction de l\'Enseignement Privé • Pôle de Nouakchott', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y, pageWidth - 20, y);

  // Titre du Document
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('FICHE INDIVIDUELLE DE SCOLARITÉ & RECOUVREMENT', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Année scolaire 2025-2026 • Document généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });

  // Cadre État Civil
  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, pageWidth - 40, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('1. ÉTAT CIVIL & DOSSIER ACADÉMIQUE', 25, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const col1X = 25;
  const col2X = 110;
  let rowY = y + 14;

  doc.text(`Nom : `, col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eleve.nom.toUpperCase()}`, col1X + 14, rowY);
  doc.setFont('helvetica', 'normal');

  doc.text(`Prénom(s) : `, col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eleve.prenom}`, col2X + 22, rowY);
  doc.setFont('helvetica', 'normal');

  rowY += 6;
  doc.text(`Matricule : `, col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eleve.matricule}`, col1X + 20, rowY);
  doc.setFont('helvetica', 'normal');

  doc.text(`Classe assignée : `, col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eleve.classe}`, col2X + 30, rowY);
  doc.setFont('helvetica', 'normal');

  rowY += 6;
  doc.text(`Date de naissance : `, col1X, rowY);
  doc.text(`${eleve.date_naissance || '14/06/2008'}`, col1X + 34, rowY);

  doc.text(`Sexe : `, col2X, rowY);
  doc.text(`${eleve.sexe === 'F' ? 'Féminin' : 'Masculin'}`, col2X + 12, rowY);

  rowY += 6;
  doc.text(`Régime de scolarité : `, col1X, rowY);
  doc.text(`Externe standard`, col1X + 36, rowY);

  doc.text(`Lieu de naissance : `, col2X, rowY);
  doc.text(`${eleve.lieu_naissance || 'Nouakchott'}`, col2X + 33, rowY);

  // Cadre Responsable Légal
  y += 45;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 26, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, pageWidth - 40, 26, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('2. RESPONSABLE LÉGAL & CONTACT', 25, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  rowY = y + 14;
  doc.text(`Nom du tuteur : `, col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eleve.nom_tuteur}`, col1X + 27, rowY);
  doc.setFont('helvetica', 'normal');

  doc.text(`Téléphone joignable : `, col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${eleve.telephone_tuteur}`, col2X + 37, rowY);
  doc.setFont('helvetica', 'normal');

  rowY += 6;
  doc.text(`Lien de parenté : `, col1X, rowY);
  doc.text(`${eleve.lien_parente === 'pere' ? 'Père' : eleve.lien_parente === 'mere' ? 'Mère' : 'Tuteur légal'}`, col1X + 30, rowY);

  doc.text(`Adresse de résidence : `, col2X, rowY);
  doc.text(`${eleve.adresse_tuteur || 'Nouakchott, Mauritanie'}`, col2X + 39, rowY);

  // Cadre Synthèse Financière
  y += 33;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 28, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, pageWidth - 40, 28, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('3. SITUATION DU RECOUVREMENT DE SCOLARITÉ', 25, y + 7);

  // 3 boîtes financières
  const boxWidth = 52;
  const boxY = y + 11;

  // Attendu
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(25, boxY, boxWidth, 13, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(25, boxY, boxWidth, 13, 2, 2, 'S');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ATTENDU', 25 + boxWidth / 2, boxY + 4.5, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatMRU(eleve.total_due), 25 + boxWidth / 2, boxY + 10, { align: 'center' });

  // Encaissé
  const box2X = 25 + boxWidth + 7;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(box2X, boxY, boxWidth, 13, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(box2X, boxY, boxWidth, 13, 2, 2, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL ENCAISSÉ', box2X + boxWidth / 2, boxY + 4.5, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMRU(eleve.total_paid), box2X + boxWidth / 2, boxY + 10, { align: 'center' });

  // Reste
  const box3X = box2X + boxWidth + 7;
  doc.setFillColor(eleve.remaining > 0 ? 255 : 240, eleve.remaining > 0 ? 241 : 253, eleve.remaining > 0 ? 242 : 244);
  doc.roundedRect(box3X, boxY, boxWidth, 13, 2, 2, 'F');
  doc.setDrawColor(eleve.remaining > 0 ? 254 : 187, eleve.remaining > 0 ? 205 : 247, eleve.remaining > 0 ? 211 : 208);
  doc.roundedRect(box3X, boxY, boxWidth, 13, 2, 2, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(eleve.remaining > 0 ? 159 : 22, eleve.remaining > 0 ? 18 : 101, eleve.remaining > 0 ? 57 : 52);
  doc.text('SOLDE RESTANT', box3X + boxWidth / 2, boxY + 4.5, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMRU(eleve.remaining), box3X + boxWidth / 2, boxY + 10, { align: 'center' });

  // Section 4 : Tableau des versements
  y += 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('4. HISTORIQUE DES VERSEMENTS & QUITTANCES', 20, y);

  y += 4;
  // En-tête de tableau
  doc.setFillColor(241, 245, 249);
  doc.rect(20, y, pageWidth - 40, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(20, y, pageWidth - 40, 7, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DATE', 24, y + 4.5);
  doc.text('RÉFÉRENCE QUITTANCE', 50, y + 4.5);
  doc.text('LIBELLÉ ÉCHÉANCE', 95, y + 4.5);
  doc.text('MODE', 145, y + 4.5);
  doc.text('MONTANT', pageWidth - 24, y + 4.5, { align: 'right' });

  y += 7;
  const versements = eleve.timeline_paiements || [];
  if (versements.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Aucun versement enregistré à ce jour pour cet élève.', pageWidth / 2, y + 8, { align: 'center' });
    y += 15;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    versements.forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y, pageWidth - 40, 6.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(20, y + 6.5, pageWidth - 20, y + 6.5);

      doc.text(p.date || '—', 24, y + 4.5);
      doc.text(p.recu_ref || `REC-${idx + 1}`, 50, y + 4.5);
      doc.text(p.libelle || 'Mensualité scolarité', 95, y + 4.5);
      doc.text(p.methode?.toUpperCase() || 'ESPÈCES', 145, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(formatMRU(p.montant), pageWidth - 24, y + 4.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += 6.5;
    });
  }

  // Cadre Visa & Signature
  y = Math.max(y + 12, 235);
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y, pageWidth - 20, y);

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Pour faire valoir ce que de droit.', 20, y);
  doc.text('Fait à Nouakchott, le ' + new Date().toLocaleDateString('fr-FR'), pageWidth - 20, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Le Tuteur / Responsable', 40, y, { align: 'center' });
  doc.text('Le Directeur de l\'Établissement', pageWidth - 45, y, { align: 'center' });

  y += 18;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('(Signature précédée de la mention lu et approuvé)', 40, y, { align: 'center' });
  doc.text('(Cachet officiel et signature de la direction)', pageWidth - 45, y, { align: 'center' });

  const cleanMatricule = eleve.matricule && !eleve.matricule.toUpperCase().startsWith('DEMO')
    ? `_${eleve.matricule}`
    : '';
  const filename = `Fiche_Eleve${cleanMatricule}_${eleve.prenom}_${eleve.nom}.pdf`;
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
