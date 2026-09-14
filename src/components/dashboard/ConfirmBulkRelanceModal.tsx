import React from 'react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import {
  Send,
  AlertTriangle,
  X,
  MessageSquare,
  Phone,
} from 'lucide-react';

interface ConfirmBulkRelanceModalProps {
  isOpen: boolean;
  count: number;
  totalAmount: number;
  isSending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmBulkRelanceModal: React.FC<ConfirmBulkRelanceModalProps> = ({
  isOpen,
  count,
  totalAmount,
  isSending = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirmer la Campagne de Relance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Notification officielle par WhatsApp et SMS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning & Summary Card */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 space-y-3 text-xs text-amber-950">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">
              Vous êtes sur le point d'envoyer un rappel de paiement aux responsables légaux des{' '}
              <span className="font-bold font-mono text-amber-900">{count} élèves</span> ayant des
              échéances de scolarité en retard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 font-mono">
            <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block font-sans">
                Élèves Ciblés
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {count} famille(s)
              </span>
            </div>
            <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block font-sans">
                Volume d'Impayés
              </span>
              <Tooltip content={formatMRU(totalAmount)}>
                <span className="text-base font-extrabold text-red-700 cursor-help">
                  {formatCompactMRU(totalAmount)}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Channels Information */}
        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
          <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
            Canaux d'acheminement activés :
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <Phone className="h-3.5 w-3.5" /> WhatsApp Direct (96% délivrance)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-blue-700">
              <MessageSquare className="h-3.5 w-3.5" /> SMS Passerelle
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSending}
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={isSending}
            loadingText="Envoi en cours..."
            className="gap-2 px-5"
            onClick={onConfirm}
          >
            <Send className="h-4 w-4" />
            Confirmer l'envoi ({count})
          </Button>
        </div>
      </div>
    </div>
  );
};
