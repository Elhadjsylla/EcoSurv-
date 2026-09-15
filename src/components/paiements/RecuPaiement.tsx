import React, { useEffect } from 'react';
import { Building, Clock3, Printer, Receipt, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatMRU } from '../../lib/utils';
import { formatDateHeure, libelleMethode, libelleStatutPaiement, referenceRecu } from '../../lib/format';
import type { PaiementView } from '../../types/domain';

interface RecuPaiementProps {
  paiement: PaiementView | null;
  ecoleNom: string;
  /** Nom de la personne ayant encaissé, quand le rôle peut le connaître. */
  encaissePar: string | null;
  onClose: () => void;
}

/**
 * Reçu imprimable d'un paiement réel. Un paiement en attente n'est jamais
 * présenté comme payé : le reçu l'indique explicitement.
 */
export const RecuPaiement: React.FC<RecuPaiementProps> = ({ paiement, ecoleNom, encaissePar, onClose }) => {
  useEffect(() => {
    if (!paiement) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paiement, onClose]);

  if (!paiement) return null;

  const confirme = paiement.statut === 'confirme';
  const { date, heure } = formatDateHeure(paiement.paye_le ?? paiement.created_at);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recu-titre"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in"
      >
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {confirme ? <Receipt className="h-5 w-5 text-amber-400" /> : <Clock3 className="h-5 w-5 text-blue-300" />}
            <span id="recu-titre" className="font-bold text-sm">
              {confirme ? "Reçu d'encaissement" : 'Paiement en attente de confirmation'}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-sans">
          <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-base">
              <Building className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              {ecoleNom}
            </div>
            <div className="mt-2 inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs rounded-lg border border-amber-200 dark:border-amber-800/60">
              {referenceRecu(paiement)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Élève</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {paiement.eleve ? `${paiement.eleve.prenom} ${paiement.eleve.nom}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Matricule / Classe</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {paiement.eleve ? `${paiement.eleve.matricule ?? '—'} • ${paiement.eleve.classe ?? '—'}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Date & heure</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {date} à {heure}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Statut</span>
              <span className={`font-bold ${confirme ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-300'}`}>
                {libelleStatutPaiement(paiement.statut)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex justify-between gap-3 text-slate-700 dark:text-slate-300">
              <span>Objet :</span>
              <span className="font-semibold text-right">{paiement.echeance_libelle ?? '—'}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Mode de versement :</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{libelleMethode(paiement.methode)}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white text-xs">MONTANT :</span>
              <span className="font-extrabold text-base text-amber-700 dark:text-amber-400 font-mono">{formatMRU(paiement.montant)}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center border-t border-slate-100 dark:border-slate-800 pt-2">
            {encaissePar ? `Encaissé par ${encaissePar}` : 'Enregistré dans EcoSurv'}
            <br />
            {confirme
              ? "Ce document atteste l'encaissement du montant indiqué."
              : "Ce paiement ne sera imputé qu'après confirmation par l'opérateur : ce document n'est pas une quittance."}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button size="sm" onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-700 border-amber-600 text-white gap-1.5">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>
    </div>
  );
};
