import React, { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { formatDate } from '../../lib/format';
import { nomComplet, todayISO } from '../../data/aggregations';
import { useElevesEnseignant } from '../../data/enseignant';
import { useEcole } from '../../data/ecole';
import { useSession } from '../../data/useSession';
import { Users, CalendarCheck, BookOpen, Clock, AlertCircle, BookmarkCheck } from 'lucide-react';

interface TeacherDashboardProps {
  onNavigateToTab?: (tab: 'teacher_classes' | 'teacher_absences' | 'teacher_grades') => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateToTab }) => {
  const { profile } = useSession();
  const { data: ecole } = useEcole();
  const { classes, data, isLoading, error, refetch } = useElevesEnseignant();

  const eleves = useMemo(() => data?.eleves ?? [], [data]);
  const absences = useMemo(() => data?.absences ?? [], [data]);
  const moisCourant = todayISO().slice(0, 7);
  const duMois = absences.filter((a) => a.date_absence.startsWith(moisCourant));
  const absencesMois = duMois.filter((a) => a.type === 'absence').length;
  const retardsMois = duMois.filter((a) => a.type === 'retard').length;
  const aJustifier = absences.filter((a) => !a.justifiee).length;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const mesClasses = classes ?? [];

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Espace Pédagogique
            </span>
            {ecole?.annee_scolaire && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Année {ecole.annee_scolaire}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bonjour, {nomComplet(profile)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Classes assignées :{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {mesClasses.length > 0 ? mesClasses.join(', ') : 'aucune pour le moment'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ComingSoon detail="saisie des notes (V2)">
            <Button variant="outline" size="sm" className="gap-2 border-slate-300 dark:border-slate-700" disabled>
              <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              Saisir une note
            </Button>
          </ComingSoon>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-xs"
            onClick={() => onNavigateToTab?.('teacher_absences')}
            disabled={mesClasses.length === 0}
          >
            <CalendarCheck className="h-4 w-4" />
            Faire l'appel du jour
          </Button>
        </div>
      </div>

      {mesClasses.length === 0 ? (
        <EmptyState
          title="Aucune classe ne vous est affectée"
          description="La direction de l'établissement doit vous affecter vos classes pour que vos élèves apparaissent ici."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard
              title="Élèves assignés"
              amount={eleves.length}
              unit="count"
              subtitle={`Répartis sur ${mesClasses.length} classe(s)`}
              icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              variant="success"
              onClick={() => onNavigateToTab?.('teacher_classes')}
            />
            <KpiCard
              title="Absences ce mois"
              amount={absencesMois}
              unit="count"
              subtitle="Journées d'absence saisies"
              icon={<CalendarCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              variant="danger"
              onClick={() => onNavigateToTab?.('teacher_absences')}
            />
            <KpiCard
              title="Retards ce mois"
              amount={retardsMois}
              unit="count"
              subtitle="Arrivées tardives saisies"
              icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              variant="warning"
              onClick={() => onNavigateToTab?.('teacher_absences')}
            />
            <KpiCard
              title="À justifier"
              amount={aJustifier}
              unit="count"
              subtitle="Absences et retards sans justificatif"
              icon={<AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
              variant="default"
              onClick={() => onNavigateToTab?.('teacher_absences')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Séances du jour
              </h2>
              <EmptyState
                comingSoon
                title="Emploi du temps"
                description="L'emploi du temps n'est pas encore géré dans EcoSurv : vos séances apparaîtront ici lorsqu'il le sera."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Derniers signalements
                </h2>
                <button
                  onClick={() => onNavigateToTab?.('teacher_absences')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Voir tout
                </button>
              </div>

              {absences.length === 0 ? (
                <EmptyState title="Aucune absence saisie" />
              ) : (
                <div className="space-y-3">
                  {absences.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-2xs text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {a.eleve_prenom} {a.eleve_nom}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                            a.type === 'retard'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {a.type === 'retard' ? 'Retard' : 'Absent'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{a.classe ?? '—'}</span>
                        <span>{formatDate(a.date_absence)}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                        {a.motif ? ` • ${a.motif}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
