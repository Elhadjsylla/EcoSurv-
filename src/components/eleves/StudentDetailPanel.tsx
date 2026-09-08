import React from 'react';
import { EleveWithStats } from '../../lib/mockData';
import { StudentInitials } from '../ui/StudentInitials';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { formatMRU } from '../../lib/utils';
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-2xs space-y-3">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <User className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Aucun élève sélectionné</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-6 animate-stagger-rise transition-all duration-300"
    >
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="lg" />
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {eleve.prenom} {eleve.nom}
            </h3>
            <p className="text-xs text-blue-700 font-mono font-semibold">
              Matricule: {eleve.matricule}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {eleve.classe}
              </span>
              <span className="text-[11px] text-slate-500">
                • {eleve.sexe === 'M' ? 'Garçon' : 'Fille'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge statut={eleve.statut} />
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tuteur Légal & Coordonnées Box */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <span>Tuteur Légal & Responsable</span>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 font-bold">
            Principal
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-500" />
            {eleve.nom_tuteur} ({lienParenteLabels[eleve.lien_parente] || 'Tuteur'})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-700 font-mono flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            {eleve.telephone_tuteur}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            WhatsApp Actif
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 pt-0.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{eleve.adresse_tuteur}</span>
        </div>
      </div>

      {/* Bento Solde & Prochaine Échéance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Solde Actuel Dû
          </span>
          <div className="mt-1">
            <span
              className={`text-xl font-extrabold font-mono ${
                eleve.remaining > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {formatMRU(eleve.remaining)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            {eleve.remaining > 0 ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-600 animate-pulse-soft" />
                Impayé à régler
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">✓ Totalement acquitté</span>
            )}
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Prochaine Échéance
          </span>
          <div className="mt-1">
            <span className="text-xl font-extrabold font-mono text-slate-900">
              {formatMRU(eleve.prochaine_echeance_montant || 15000)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{eleve.prochaine_echeance_date || '05/03/2026'}</span>
          </span>
        </div>
      </div>

      {/* Timeline Chronologique des Encaissements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Historique des Encaissements
          </h4>
          <span className="text-[11px] font-semibold text-blue-600 cursor-pointer hover:underline">
            Reçus ({eleve.timeline_paiements.length})
          </span>
        </div>

        {eleve.timeline_paiements.length === 0 ? (
          <div className="p-4 text-center rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
            Aucun paiement enregistré pour l'instant.
          </div>
        ) : (
          <div className="relative pl-4 space-y-3">
            {/* Timeline vertical connector */}
            <div className="absolute left-1.5 top-2 bottom-2 w-[2px] bg-slate-200" />

            {eleve.timeline_paiements.map((item) => (
              <div key={item.id} className="relative flex items-start gap-3">
                <div className="absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{item.libelle}</span>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                      Réglé
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-extrabold text-emerald-700">
                      {formatMRU(item.montant)}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold uppercase text-slate-700">
                      {item.methode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
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
      <div className="space-y-2 pt-2 border-t border-slate-100">
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
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/60 p-3 text-[11px] text-slate-600">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Dossier académique sécurisé par policy RLS (École & Enseignant).</span>
      </div>
    </div>
  );
};
