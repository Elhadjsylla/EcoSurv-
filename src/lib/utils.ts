import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine et fusionne des classes CSS Tailwind proprement.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en Ouguiya Mauritanienne (MRU)
 */
export function formatMRU(amount: number): string {
  return new Intl.NumberFormat('fr-MR', {
    style: 'currency',
    currency: 'MRU',
    maximumFractionDigits: 2,
  }).format(amount);
}
