import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine et fusionne des classes CSS Tailwind proprement.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Nettoie les caractères Unicode problématiques (espaces fines, insécables)
 * pour éviter les glyphes corrompus (comme le '/') dans jsPDF et les navigateurs.
 */
export function sanitizePdfText(str: string): string {
  return str.replace(/[\u202F\u00A0\u1680\u2000-\u200A\u205F\u3000]/g, ' ');
}

/**
 * Formate un montant en Ouguiya Mauritanienne (MRU) avec un séparateur de milliers
 * standard (espace ASCII) lisible par toutes les polices PDF et tous les navigateurs.
 */
export function formatMRU(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  // Remplacer systématiquement les espaces insécables / fines par un espace ASCII standard
  const cleanNumber = formatted.replace(/[\u202F\u00A0]/g, ' ');
  return `${cleanNumber} MRU`;
}

