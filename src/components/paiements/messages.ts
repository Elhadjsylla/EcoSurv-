import { formatMRU } from '../../lib/utils';
import { libelleMethode } from '../../lib/format';
import type { PaiementView } from '../../types/domain';

/** Confirmation affichée après un encaissement : jamais « payé » pour un paiement en attente. */
export function messagePaiementEnregistre(
  paiement: Pick<PaiementView, 'montant' | 'methode' | 'statut'>,
  eleve: { prenom: string; nom: string }
): { message: string; type: 'success' | 'info' } {
  const qui = `${eleve.prenom} ${eleve.nom}`;
  return paiement.statut === 'confirme'
    ? { message: `Paiement de ${formatMRU(paiement.montant)} encaissé et confirmé pour ${qui}.`, type: 'success' }
    : {
        message: `Paiement ${libelleMethode(paiement.methode)} de ${formatMRU(paiement.montant)} enregistré en attente de confirmation pour ${qui}.`,
        type: 'info',
      };
}
