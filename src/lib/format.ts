import type { LienParente, MethodePaiement, StatutPaiement } from '../types/domain';

/** 2026-03-14 -> « 14 mars 2026 ». Les dates `date` sont lues sans décalage de fuseau. */
export function formatDate(iso: string | null | undefined, options: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return '—';
  const [annee, mois, jour] = iso.slice(0, 10).split('-').map(Number);
  if (!annee || !mois || !jour) return '—';
  return new Date(annee, mois - 1, jour).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

/** Horodatage `timestamptz` -> « 14/03/2026 à 11:32 ». */
export function formatDateHeure(iso: string | null | undefined): { date: string; heure: string } {
  if (!iso) return { date: '—', heure: '—' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('fr-FR'),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const METHODES: Record<string, string> = {
  especes: 'Espèces',
  bankily: 'Bankily (BPM)',
  masrvi: 'Masrvi (BMCI)',
  cheque: 'Chèque',
};

/** Libellé d'un mode de paiement ; les valeurs retirées de l'enum restent lisibles. */
export function libelleMethode(methode: MethodePaiement | string): string {
  return METHODES[methode] ?? methode;
}

const STATUTS_PAIEMENT: Record<StatutPaiement, string> = {
  en_attente: 'En attente de confirmation',
  confirme: 'Confirmé',
  echoue: 'Échoué',
  rembourse: 'Remboursé',
  annule: 'Annulé',
};

export function libelleStatutPaiement(statut: StatutPaiement): string {
  return STATUTS_PAIEMENT[statut];
}

const LIENS: Record<LienParente, string> = {
  pere: 'Père',
  mere: 'Mère',
  tuteur: 'Tuteur légal',
  autre: 'Autre',
};

export function libelleLien(lien: LienParente): string {
  return LIENS[lien];
}

/** Référence de reçu affichée : la référence opérateur si elle existe, sinon l'identifiant du paiement. */
export function referenceRecu(paiement: { id: string; reference_transaction: string | null }): string {
  return paiement.reference_transaction ?? `REC-${paiement.id.slice(0, 8).toUpperCase()}`;
}
