import { formatMRU } from './utils';

/**
 * Formate un montant en Ouguiya (MRU) de manière compacte et lisible pour les
 * espaces contraints et cartes KPI sans débordement.
 *
 * Spécifications :
 * - < 10 000 : affichage complet normal (ex: "5 000 MRU", "9 500 MRU")
 * - >= 10 000 et < 1 000 000 : milliers avec suffixe "k" (ex: 45 000 -> "45k MRU", 600 000 -> "600k MRU")
 * - >= 1 000 000 et < 1 000 000 000 : millions avec suffixe "M" (ex: 2 500 000 -> "2,5M MRU")
 * - >= 1 000 000 000 : milliards avec suffixe "Md" (ex: 1 200 000 000 -> "1,2Md MRU")
 * - Maximum une décimale significative, sans zéro inutile (ex: "45k" et non "45,0k").
 */
export function formatCompactMRU(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '0 MRU';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';

  if (absAmount < 10000) {
    const formattedNum = Math.round(absAmount).toLocaleString('fr-FR');
    formatted = `${formattedNum} MRU`;
  } else if (absAmount < 1000000) {
    const inK = absAmount / 1000;
    const rounded = Number(inK.toFixed(1));
    if (rounded >= 1000) {
      formatted = '1M MRU';
    } else {
      const numStr = rounded.toString().replace('.', ',');
      formatted = `${numStr}k MRU`;
    }
  } else if (absAmount < 1000000000) {
    const inM = absAmount / 1000000;
    const rounded = Number(inM.toFixed(1));
    if (rounded >= 1000) {
      formatted = '1Md MRU';
    } else {
      const numStr = rounded.toString().replace('.', ',');
      formatted = `${numStr}M MRU`;
    }
  } else {
    const inMd = absAmount / 1000000000;
    const rounded = Number(inMd.toFixed(1));
    const numStr = rounded.toString().replace('.', ',');
    formatted = `${numStr}Md MRU`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

export { formatMRU };
