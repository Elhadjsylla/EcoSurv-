import React from 'react';
import { EleveWithStats } from '../../lib/mockData';
import { StudentInitials } from '../ui/StudentInitials';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Send,
  PlusCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

interface StudentDetailPanelProps {
  eleve: EleveWithStats | null;
  onClose?: () => void;
  onPaymentTrigger?: (eleve: EleveWithStats) => void;
  onRelanceTrigger?: (eleve: EleveWithStats) => void;
}

export const StudentDetailPanel: React.FC<StudentDetailPanelProps> = ({
  eleve,
  onClose,
  onPaymentTrigger,
  onRelanceTrigger,
}) => {
  if (!eleve) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-2xs space-y-3">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
          <User className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aucun élève sélectionné</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Cliquez sur une ligne du registre académique pour afficher le dossier complet de l'élève.
        </p>
      </div>
    );
  }

  const lienParenteLabels: Record<string, string> = {
    pere: 'Père',
    mere: 'Mère',
    tuteur: 'Tuteur Légal',
    autre: 'Tuteur',
  };

  return (
    <div
      key={eleve.id}
      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6 animate-stagger-rise transition-all duration-300 min-w-0"
    >
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5 min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="lg" />
          <div className="space-y-1 min-w-0">
            <h3
              title={`${eleve.prenom} ${eleve.nom}`}
              className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate"
            >
              {eleve.prenom} {eleve.nom}
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-mono font-semibold truncate">
              Matricule: {eleve.matricule}
            </p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                {eleve.classe}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                • {eleve.sexe === 'M' ? 'Garçon' : 'Fille'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge statut={eleve.statut} />
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tuteur Légal & Coordonnées Box */}
      <div className="rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-3 text-xs min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
          <span>Tuteur Légal & Responsable</span>
          <span className="rounded bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-400 font-bold">
            Principal
          </span>
        </div>

        <div className="flex items-center justify-between min-w-0">
          <span
            title={`${eleve.nom_tuteur} (${lienParenteLabels[eleve.lien_parente] || 'Tuteur'})`}
            className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 truncate min-w-0"
          >
            <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="truncate">{eleve.nom_tuteur} ({lienParenteLabels[eleve.lien_parente] || 'Tuteur'})</span>
          </span>
        </div>

        <div className="flex items-center justify-between min-w-0">
          <span className="text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2 font-medium truncate">
            <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            {eleve.telephone_tuteur}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
            WhatsApp Actif
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 pt-0.5 min-w-0">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span title={eleve.adresse_tuteur} className="truncate">{eleve.adresse_tuteur}</span>
        </div>
      </div>

      {/* Bento Solde & Prochaine Échéance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors min-w-0">
          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider truncate">
            Solde Actuel Dû
          </span>
          <div className="mt-1.5 min-w-0">
            <span
              title={formatMRU(eleve.remaining)}
              className={`text-xl font-extrabold font-mono truncate block cursor-help ${
                eleve.remaining > 0 ? 'text-red-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatCompactMRU(eleve.remaining)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 truncate">
            {eleve.remaining > 0 ? (
              <span className="text-red-600 dark:text-rose-400 font-semibold flex items-center gap-1 truncate">
                <span className="inline-block h-2 w-2 rounded-full bg-red-600 dark:bg-rose-500 animate-pulse-soft shrink-0" />
                Impayé à régler
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">✓ Totalement acquitté</span>
            )}
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors min-w-0">
          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider truncate">
            Prochaine Échéance
          </span>
          <div className="mt-1.5 min-w-0">
            <span
              title={formatMRU(eleve.prochaine_echeance_montant || 15000)}
              className="text-xl font-extrabold font-mono text-slate-900 dark:text-white truncate block cursor-help"
            >
              {formatCompactMRU(eleve.prochaine_echeance_montant || 15000)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{eleve.prochaine_echeance_date || '05/03/2026'}</span>
          </span>
        </div>
      </div>

      {/* Timeline Chronologique des Encaissements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Historique des Encaissements
          </h4>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
            Reçus ({eleve.timeline_paiements.length})
          </span>
        </div>

        {eleve.timeline_paiements.length === 0 ? (
          <div className="p-4 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Aucun paiement enregistré pour l'instant.
          </div>
        ) : (
          <div className="relative pl-4 space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {/* Timeline vertical connector */}
            <div className="absolute left-1.5 top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-slate-700" />

            {eleve.timeline_paiements.map((item) => (
              <div key={item.id} className="relative flex items-start gap-3">
                <div className="absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{item.libelle}</span>
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
                      Réglé
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formatMRU(item.montant)}
                    </span>
                    <span className="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-semibold uppercase text-slate-700 dark:text-slate-300">
                      {item.methode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Reçu #{item.recu_ref}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150"
          onClick={() => onPaymentTrigger && onPaymentTrigger(eleve)}
        >
          <PlusCircle className="h-4 w-4" />
          Encaisser un Paiement (Espèces / Bankily)
        </Button>

        {eleve.remaining > 0 && (
          <Button
            variant="danger"
            size="sm"
            className="w-full justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150"
            onClick={() => onRelanceTrigger && onRelanceTrigger(eleve)}
          >
            <Send className="h-4 w-4" />
            Envoyer Rappel WhatsApp / SMS
          </Button>
        )}
      </div>

      {/* Mini Audit Footer */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 p-3 text-[11px] text-slate-600 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Dossier académique sécurisé par policy RLS (École & Enseignant).</span>
      </div>
    </div>
  );
};
