import { jsPDF } from 'jspdf';
import { ParentMatiereNote } from '../mockData';

export interface BulletinData {
  enfantNom: string;
  enfantPrenom: string;
  matricule: string;
  classe: string;
  trimestre: string;
  anneeScolaire?: string;
  rang: number | string;
  effectif?: number;
  moyenneGenerale: number;
  moyenneClasse?: number;
  matieres: ParentMatiereNote[];
  ecoleNom?: string;
}

export function generateBulletinPdf(data: BulletinData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  let y = 16;

  // En-tête national & scolaire
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('RÉPUBLIQUE ISLAMIQUE DE MAURITANIE', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MINISTÈRE DE L\'ÉDUCATION NATIONALE ET DE LA RÉFORME DU SYSTÈME ÉDUCATIF', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(8);
  doc.text(`${data.ecoleNom || 'Lycée Privé d\'Excellence EcoSurv'} • Direction des Études`, pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  doc.setDrawColor(203, 213, 225);
  doc.line(18, y, pageWidth - 18, y);

  // Titre du Bulletin
  y += 8;
  const trimestreLibelle =
    data.trimestre === 'T1'
      ? '1er TRIMESTRE'
      : data.trimestre === 'T2'
      ? '2ème TRIMESTRE'
      : '3ème TRIMESTRE';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(88, 28, 135); // violet institutionnel
  doc.text(`BULLETIN SCOLAIRE OFFICIEL — ${trimestreLibelle}`, pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Année Scolaire ${data.anneeScolaire || '2025-2026'} • Session Trimestrielle`, pageWidth / 2, y, { align: 'center' });

  // Cadre Identification de l'élève
  y += 7;
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(18, y, pageWidth - 36, 26, 2.5, 2.5, 'F');
  doc.setDrawColor(233, 213, 255);
  doc.roundedRect(18, y, pageWidth - 36, 26, 2.5, 2.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 33, 168);
  doc.text('IDENTIFICATION DE L\'ÉLÈVE', 23, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  let infoY = y + 12.5;
  doc.text('Élève : ', 23, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.enfantPrenom} ${data.enfantNom.toUpperCase()}`, 35, infoY);
  doc.setFont('helvetica', 'normal');

  doc.text('Classe : ', 110, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.classe}`, 123, infoY);
  doc.setFont('helvetica', 'normal');

  infoY += 6;
  doc.text('Matricule : ', 23, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.matricule}`, 39, infoY);
  doc.setFont('helvetica', 'normal');

  doc.text('Rang trimestriel : ', 110, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 33, 168);
  const rangLabel = typeof data.rang === 'number' ? `${data.rang}e` : data.rang;
  doc.text(`${rangLabel} sur ${data.effectif || 32} élèves`, 137, infoY);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');

  // Tableau des Notes et Matières
  y += 32;

  // Header tableau
  const tableX = 18;
  const tableW = pageWidth - 36;
  doc.setFillColor(243, 232, 255);
  doc.rect(tableX, y, tableW, 7, 'F');
  doc.setDrawColor(216, 180, 254);
  doc.rect(tableX, y, tableW, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(88, 28, 135);
  doc.text('DISCIPLINE / MATIÈRE', tableX + 3, y + 4.8);
  doc.text('COEF', tableX + 58, y + 4.8, { align: 'center' });
  doc.text('DEVOIR /20', tableX + 76, y + 4.8, { align: 'center' });
  doc.text('COMPOSITION /20', tableX + 104, y + 4.8, { align: 'center' });
  doc.text('MOY /20', tableX + 130, y + 4.8, { align: 'center' });
  doc.text('APPRÉCIATIONS DES PROFESSEURS', tableX + 144, y + 4.8);

  y += 7;

  let totalPoints = 0;
  let totalCoef = 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  data.matieres.forEach((m, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(250, 245, 255); // très léger violet zébré
    }
    doc.rect(tableX, y, tableW, 7, 'F');
    doc.setDrawColor(243, 232, 255);
    doc.line(tableX, y + 7, tableX + tableW, y + 7);

    // Nom matière
    doc.setTextColor(15, 23, 42);
    doc.text(m.matiere, tableX + 3, y + 4.8);

    // Coef
    doc.setTextColor(100, 116, 139);
    doc.text(m.coefficient.toString(), tableX + 58, y + 4.8, { align: 'center' });

    // Devoir
    const noteDevoir = (m as any).devoir ?? m.moyenne;
    doc.setTextColor(51, 65, 85);
    doc.text(typeof noteDevoir === 'number' ? noteDevoir.toFixed(1) : String(noteDevoir), tableX + 76, y + 4.8, { align: 'center' });

    // Composition
    const noteExamen = (m as any).examen ?? m.moyenne;
    doc.text(typeof noteExamen === 'number' ? noteExamen.toFixed(1) : String(noteExamen), tableX + 104, y + 4.8, { align: 'center' });

    // Moyenne
    doc.setFont('helvetica', 'bold');
    if (m.moyenne >= 14) {
      doc.setTextColor(22, 101, 52); // vert
    } else if (m.moyenne >= 10) {
      doc.setTextColor(30, 41, 59); // neutre
    } else {
      doc.setTextColor(185, 28, 28); // rouge
    }
    doc.text(m.moyenne.toFixed(2), tableX + 130, y + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    // Appréciation
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    const appreciation = m.appreciation || 'Travail régulier et satisfaisant';
    doc.text(appreciation.length > 34 ? appreciation.slice(0, 32) + '...' : appreciation, tableX + 144, y + 4.8);
    doc.setFontSize(8);

    totalPoints += m.moyenne * m.coefficient;
    totalCoef += m.coefficient;
    y += 7;
  });

  // Ligne Bilan / Totaux
  doc.setFillColor(243, 232, 255);
  doc.rect(tableX, y, tableW, 8.5, 'F');
  doc.setDrawColor(216, 180, 254);
  doc.rect(tableX, y, tableW, 8.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(88, 28, 135);
  doc.text('TOTAL DES POINTS & COEFFICIENTS', tableX + 3, y + 5.5);
  doc.text(totalCoef.toString(), tableX + 58, y + 5.5, { align: 'center' });
  doc.text(totalPoints.toFixed(1) + ' pts', tableX + 104, y + 5.5, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`MOY : ${data.moyenneGenerale.toFixed(2)} / 20`, tableX + 130, y + 5.5, { align: 'center' });

  // Cadre Synthèse du Conseil de Classe
  y += 15;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(tableX, y, tableW, 26, 2.5, 2.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(tableX, y, tableW, 26, 2.5, 2.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SYNTHÈSE DU CONSEIL DE CLASSE & DISTINCTIONS', tableX + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const mention =
    data.moyenneGenerale >= 16
      ? 'Très Bien — Félicitations du Conseil de Classe'
      : data.moyenneGenerale >= 14
      ? 'Bien — Tableau d\'Honneur avec Encouragements'
      : data.moyenneGenerale >= 12
      ? 'Assez Bien — Tableau d\'Honneur'
      : data.moyenneGenerale >= 10
      ? 'Passable — Travail à consolider'
      : 'Insuffisant — Redoublement d\'efforts nécessaire';

  doc.text(`Moyenne Générale de l'élève : `, tableX + 5, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 33, 168);
  doc.text(`${data.moyenneGenerale.toFixed(2)} / 20`, tableX + 48, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Moyenne de la classe : ${data.moyenneClasse ? data.moyenneClasse.toFixed(1) : '12.4'} / 20`, tableX + 85, y + 13);
  doc.text(`Rang : ${data.rang}e sur ${data.effectif || 32}`, tableX + 135, y + 13);

  doc.text(`Distinction & Mention accordée : `, tableX + 5, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(mention, tableX + 50, y + 20);

  // Signatures et Sceaux officiels
  y += 33;
  doc.setDrawColor(203, 213, 225);
  doc.line(tableX, y, tableX + tableW, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Fait à Nouakchott, le ' + new Date().toLocaleDateString('fr-FR'), tableX + tableW, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Le Professeur Principal', tableX + 25, y, { align: 'center' });
  doc.text('Le Directeur des Études & Cachet de l\'Établissement', tableX + tableW - 35, y, { align: 'center' });

  y += 16;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('(Signature de visa)', tableX + 25, y, { align: 'center' });
  doc.text('(Sceau officiel certifiant conforme)', tableX + tableW - 35, y, { align: 'center' });

  doc.save(`Bulletin_${data.trimestre}_${data.matricule}_${data.enfantNom}.pdf`);

  return doc;
}
