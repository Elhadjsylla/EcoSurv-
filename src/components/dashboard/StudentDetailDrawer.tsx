import React, { useEffect } from 'react';
import type { EleveSituation } from '../../types/domain';
import { StudentInitials } from '../ui/StudentInitials';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { ComingSoon } from '../ui/DataState';
import { formatMRU } from '../../lib/utils';
import { formatDate, libelleLien } from '../../lib/format';
import { X, Phone, Mail, CheckCircle2, User, Zap, Send, CalendarDays } from 'lucide-react';

interface StudentDetailDrawerProps {
  eleve: EleveSituation | null;
  onClose: () => void;
  /** Ouvre la saisie d'un paiement ; absent = pas d'action d'encaissement. */
  onEncaisser?: (eleve: EleveSituation) => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({ eleve, onClose, onEncaisser }) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!eleve) return null;

  const sexe = eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche de ${eleve.prenom} ${eleve.nom}`}
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250"
      >
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Fiche Individuelle Élève
            </span>
            <button
              onClick={onClose}
              aria-label="Fermer la fiche"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Student Profile Centered Hero (Nexoov Style) */}
          <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="relative inline-block mb-3">
              <StudentInitials
                nom={eleve.nom}
                prenom={eleve.prenom}
                size="lg"
                className="ring-4 ring-white dark:ring-slate-800 shadow-md text-base"
              />
              <div className="absolute -bottom-1 -right-1">
                <StatusBadge statut={eleve.statut} showDot={false} className="shadow-xs text-[10px] py-0 px-2" />
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {eleve.prenom} {eleve.nom}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Classe : <span className="font-bold text-slate-800 dark:text-slate-200">{eleve.classe ?? '—'}</span> • Matr :{' '}
              <span className="font-mono text-slate-600 dark:text-slate-400">{eleve.matricule ?? '—'}</span>
            </p>

            {eleve.tuteur?.telephone && (
              <div className="flex items-center justify-center gap-2.5 mt-4">
                <Tooltip content="Appeler le tuteur">
                  <a
                    href={`tel:${eleve.tuteur.telephone}`}
                    className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-all shadow-2xs"
                    aria-label="Appeler le tuteur"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Financial Summary Cards */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Attendu
                </span>
                <span className="text-xs font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {formatMRU(eleve.total_due)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Encaissé
                </span>
                <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-300 mt-1 block">
                  {formatMRU(eleve.total_paid)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                  Reste
                </span>
                <span className="text-xs font-black font-mono text-rose-800 dark:text-rose-300 mt-1 block">
                  {formatMRU(eleve.remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Échéancier */}
          <div className="p-5 space-y-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Échéancier ({eleve.echeances.length})
            </h4>
            {eleve.echeances.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">Aucune échéance établie pour cet élève.</p>
            ) : (
              <ul className="space-y-2">
                {eleve.echeances.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{e.libelle}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {formatDate(e.date_echeance)} • {formatMRU(e.montant)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <StatusBadge statut={e.statut} />
                      {e.reste > 0 && (
                        <div className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                          reste {formatMRU(e.reste)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section "À propos de l'élève" */}
          <div className="p-5 space-y-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              À propos de l'élève
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Date de naissance</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(eleve.date_naissance)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Lieu de naissance</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{eleve.lieu_naissance ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Sexe</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{sexe}</span>
              </div>
              {eleve.nb_absences !== null && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Absences</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{eleve.nb_absences}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Statut recouvrement</span>
                <StatusBadge statut={eleve.statut} />
              </div>
            </div>
          </div>

          {/* Section "Contact Responsable Légal" */}
          <div className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Responsable Légal & Contact
            </h4>
            {eleve.tuteur ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white">{eleve.tuteur.nom}</span>
                  <span className="text-[11px] text-slate-400">({libelleLien(eleve.tuteur.lien)})</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{eleve.tuteur.telephone ?? 'Non renseigné'}</span>
                </div>
                {eleve.tuteur.email && (
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{eleve.tuteur.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Aucun responsable légal rattaché à cet élève.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex items-center gap-2.5">
          {eleve.remaining > 0 ? (
            <>
              {onEncaisser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 h-10 text-xs font-bold text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  onClick={() => onEncaisser(eleve)}
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                  Enregistrer un paiement
                </Button>
              )}

              <ComingSoon detail="envoi SMS / WhatsApp" className="flex flex-1">
                <Button variant="danger" size="sm" className="w-full gap-1.5 h-10 text-xs font-bold" disabled>
                  <Send className="h-3.5 w-3.5" />
                  Relancer SMS
                </Button>
              </ComingSoon>
            </>
          ) : (
            <div className="w-full text-center py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {eleve.echeances.length > 0 ? 'Toutes les échéances sont soldées' : 'Aucune échéance établie'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
