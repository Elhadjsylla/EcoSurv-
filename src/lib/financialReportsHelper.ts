import { MonthlyFinancialReport } from './mockData';

export const ATTACHMENT_RULE_DESCRIPTION =
  "Règle de rattachement comptable : par date d'échéance (les montants attendus et perçus sont rattachés au mois d'exigibilité scolaire).";

export interface EcheanceRaw {
  id: string;
  ecole_id: string;
  eleve_id?: string;
  libelle: string;
  montant: number;
  montant_paye?: number;
  date_echeance: string;
  statut?: string;
}

export interface PaiementRaw {
  id: string;
  ecole_id: string;
  echeance_id: string;
  montant: number;
  statut: string;
  paye_le?: string;
  created_at?: string;
}

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

/**
 * Calcule dynamiquement les rapports financiers mensuels à partir des échéances
 * réelles enregistrées dans Supabase pour l'établissement.
 * 
 * Règle de rattachement : par mois d'échéance (date d'exigibilité).
 * - Aucun mock ou donnée préremplie.
 * - Si aucune échéance n'existe, retourne un tableau vide [].
 */
export function computeMonthlyFinancialReports(
  echeances: EcheanceRaw[],
  paiements?: PaiementRaw[]
): MonthlyFinancialReport[] {
  if (!echeances || echeances.length === 0) {
    return [];
  }

  // Si des paiements sont fournis, calculer les montants encaissés confirmés par échéance
  const paiementsParEcheance = new Map<string, number>();
  if (paiements && paiements.length > 0) {
    for (const p of paiements) {
      if (p.statut === 'confirme' || !p.statut) {
        const current = paiementsParEcheance.get(p.echeance_id) || 0;
        paiementsParEcheance.set(p.echeance_id, current + Number(p.montant || 0));
      }
    }
  }

  // Regrouper par clé "YYYY-MM"
  const groups = new Map<
    string,
    {
      year: number;
      monthIndex: number;
      attendu: number;
      encaisse: number;
    }
  >();

  for (const ech of echeances) {
    const rawDate = ech.date_echeance;
    if (!rawDate) continue;

    // Normaliser la date YYYY-MM
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) continue;

    const year = dateObj.getFullYear();
    const monthIndex = dateObj.getMonth(); // 0 à 11
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    const montantAttendu = Number(ech.montant || 0);

    // Encaissé : priorité aux paiements réels liés, sinon champ montant_paye dénormalisé
    const montantPaye = paiements && paiements.length > 0
      ? (paiementsParEcheance.get(ech.id) ?? Number(ech.montant_paye || 0))
      : Number(ech.montant_paye || 0);

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        year,
        monthIndex,
        attendu: montantAttendu,
        encaisse: montantPaye,
      });
    } else {
      existing.attendu += montantAttendu;
      existing.encaisse += montantPaye;
    }
  }

  // Trier les mois par ordre chronologique croissant
  const sortedKeys = Array.from(groups.keys()).sort();

  return sortedKeys.map((key) => {
    const data = groups.get(key)!;
    const nomMois = `${MONTH_NAMES_FR[data.monthIndex]} ${data.year}`;
    const impayes = Math.max(0, data.attendu - data.encaisse);
    const taux = data.attendu > 0 ? Math.round((data.encaisse / data.attendu) * 100) : 0;

    return {
      mois: nomMois,
      attendu: Math.round(data.attendu * 100) / 100,
      encaisse: Math.round(data.encaisse * 100) / 100,
      impayes: Math.round(impayes * 100) / 100,
      taux,
    };
  });
}
