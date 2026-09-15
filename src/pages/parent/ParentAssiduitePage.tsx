import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { formatDate } from '../../lib/format';
import { useEnfantSelectionne } from './useEnfantSelectionne';
import { CalendarCheck, CheckCircle2, AlertCircle, Clock, Plus, FileCheck, Calendar } from 'lucide-react';

interface ParentAssiduitePageProps {
  selectedChildId: string;
}

export const ParentAssiduitePage: React.FC<ParentAssiduitePageProps> = ({ selectedChildId }) => {
  const { enfant, isLoading, error, refetch } = useEnfantSelectionne(selectedChildId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!enfant) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto">
        <EmptyState title="Aucun enfant rattaché à votre compte" />
      </div>
    );
  }

  const absences = enfant.absences.filter((a) => a.type === 'absence');
  const retards = enfant.absences.filter((a) => a.type === 'retard');
  const aJustifier = enfant.absences.filter((a) => !a.justifiee).length;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Assiduité & Absences — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Absences et retards saisis par l'établissement.
          </p>
        </div>

        <ComingSoon detail="déclaration d'absence par les familles">
          <Button className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white font-bold text-xs gap-2 shadow-sm py-2.5 px-4 rounded-xl shrink-0" disabled>
            <Plus className="h-4 w-4" />
            Déclarer une absence
          </Button>
        </ComingSoon>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Absences" amount={absences.length} unit="count" subtitle="Depuis la rentrée" icon={<CalendarCheck className="w-5 h-5" />} variant="purple" />
        <KpiCard title="Retards" amount={retards.length} unit="count" subtitle="Arrivées tardives" icon={<Clock className="w-5 h-5" />} variant="warning" />
        <KpiCard
          title="À justifier"
          amount={aJustifier}
          unit="count"
          subtitle={aJustifier > 0 ? "Justificatif attendu par l'établissement" : 'Dossier en règle'}
          icon={aJustifier > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          variant={aJustifier > 0 ? 'danger' : 'success'}
        />
      </div>

      <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Registre des absences et retards</h3>
          </div>
        </div>

        {enfant.absences.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune absence ni retard enregistré.</p>
        ) : (
          <div className="space-y-3.5">
            {enfant.absences.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.justifiee
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                        : 'bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60'
                    }`}
                  >
                    {item.justifiee ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{item.type === 'absence' ? 'Absence' : 'Retard'}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{formatDate(item.date_absence)}</span>
                    </div>
                    {item.motif && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic bg-slate-50 dark:bg-slate-800/60 py-1 px-2.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                        Motif : « {item.motif} »
                      </div>
                    )}
                  </div>
                </div>

                {item.justifiee ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 self-start sm:self-center">
                    <FileCheck className="h-3.5 w-3.5" /> Justifiée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 self-start sm:self-center">
                    <AlertCircle className="h-3.5 w-3.5" /> Non justifiée
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
