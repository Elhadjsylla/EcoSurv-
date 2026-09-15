import React, { useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { formatMRU } from '../../lib/utils';
import type { EleveSituation, PaiementView } from '../../types/domain';
import { PaiementForm } from './PaiementForm';

interface EncaissementModalProps {
  eleve: EleveSituation | null;
  onClose: () => void;
  onSaved?: (paiement: PaiementView, eleve: EleveSituation) => void;
}

export const EncaissementModal: React.FC<EncaissementModalProps> = ({ eleve, onClose, onSaved }) => {
  useEffect(() => {
    if (!eleve) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [eleve, onClose]);

  if (!eleve) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="encaissement-titre"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 id="encaissement-titre" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Enregistrer un paiement
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
          <p className="font-bold text-slate-900 dark:text-white">
            {eleve.prenom} {eleve.nom}
            {eleve.classe ? ` • ${eleve.classe}` : ''}
          </p>
          <p className="text-slate-500 dark:text-slate-400 font-mono">Reste à payer : {formatMRU(eleve.remaining)}</p>
        </div>

        <PaiementForm
          eleve={eleve}
          onCancel={onClose}
          onSaved={(paiement) => {
            onSaved?.(paiement, eleve);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
