import React, { useState, useEffect } from 'react';
import { EleveWithStats } from '../../lib/mockData';
import { StudentInitials } from '../ui/StudentInitials';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { formatMRU } from '../../lib/utils';
import {
  X,
  FolderOpen,
  Star,
  Printer,
  Phone,
  MapPin,
  CheckCircle2,
  User,
  Zap,
  Send,
} from 'lucide-react';

interface StudentDetailDrawerProps {
  eleve: EleveWithStats | null;
  onClose: () => void;
  onQuickPay?: (eleve: EleveWithStats) => void;
  onQuickRelance?: (eleve: EleveWithStats) => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  eleve,
  onClose,
  onQuickPay,
  onQuickRelance,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!eleve) return null;

  const showActionToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Fiche Individuelle Élève
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toast inside drawer */}
          {activeToast && (
            <div className="mx-4 mt-3 p-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{activeToast}</span>
            </div>
          )}

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
              Classe : <span className="font-bold text-slate-800 dark:text-slate-200">{eleve.classe}</span> • Matr :{' '}
              <span className="font-mono text-slate-600 dark:text-slate-400">{eleve.matricule}</span>
            </p>

            {/* Quick Action Icons Row */}
            <div className="flex items-center justify-center gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => showActionToast('Dossier scolaire ouvert')}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-2xs"
                title="Dossier scolaire"
              >
                <FolderOpen className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  showActionToast(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
                }}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all shadow-2xs ${
                  isFavorite
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 text-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500'
                }`}
                title="Favori"
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  showActionToast('Impression attestation / reçu');
                  window.print();
                }}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-2xs"
                title="Imprimer attestation"
              >
                <Printer className="h-4 w-4" />
              </button>

              <a
                href={`tel:${eleve.telephone_tuteur}`}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-all shadow-2xs"
                title="Appeler tuteur"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
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

          {/* Section "À propos de l'élève" */}
          <div className="p-5 space-y-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              À propos de l'élève
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Date de naissance</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">14 Juin 2008</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Sexe</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Masculin</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Régime de scolarité</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Externe standard</span>
              </div>
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
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">{eleve.nom_tuteur}</span>
                <span className="text-[11px] text-slate-400">(Tuteur légal)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-mono">{eleve.telephone_tuteur}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Tevragh-Zeina, Nouakchott</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex items-center gap-2.5">
          {eleve.remaining > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 h-10 text-xs font-bold text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                onClick={() => {
                  if (onQuickPay) onQuickPay(eleve);
                  onClose();
                }}
              >
                <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                Encaisser le solde
              </Button>

              <Button
                variant="danger"
                size="sm"
                className="flex-1 gap-1.5 h-10 text-xs font-bold"
                onClick={() => {
                  if (onQuickRelance) onQuickRelance(eleve);
                  onClose();
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Relancer SMS
              </Button>
            </>
          ) : (
            <div className="w-full text-center py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Scolarité soldée intégralement pour l'exercice en cours
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
