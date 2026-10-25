import React from 'react';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useTeacherData } from '../../hooks/useTeacherData';
import { ANNEE_SCOLAIRE_ACTIVE } from '../../lib/constants/scolaire';
import {
  Users,
  CalendarCheck,
  BookOpen,
  Clock,
  BookmarkCheck,
  GraduationCap,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigateToTab?: (tab: 'teacher_classes' | 'teacher_absences' | 'teacher_grades') => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateToTab }) => {
  const authProfile = useAuthStore((s) => s.profile);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const { classes: teacherClasses, eleves: teacherStudents, isLoading: isTeacherDataLoading } = useTeacherData();

  if (isAuthLoading || isTeacherDataLoading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-pulse">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const teacherName = authProfile
    ? `${authProfile.prenom} ${authProfile.nom}`.trim()
    : 'Enseignant';

  const totalEleves = teacherStudents.length;
  const totalClasses = teacherClasses.length;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Espace Pédagogique
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Année {ANNEE_SCOLAIRE_ACTIVE}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bonjour, {teacherName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Classes assignées :{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {totalClasses > 0 ? teacherClasses.join(', ') : 'Aucune classe pour le moment'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
          >
            <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            Carnet de Notes
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-xs"
            onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
          >
            <CalendarCheck className="h-4 w-4" />
            Faire l'Appel du Jour
          </Button>
        </div>
      </div>

      {/* Pedagogical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Élèves Assignés"
          amount={totalEleves}
          unit="count"
          subtitle={totalClasses > 0 ? `${totalClasses} classe${totalClasses > 1 ? 's' : ''} affectée${totalClasses > 1 ? 's' : ''}` : '0 classe'}
          icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_classes')}
        />

        <KpiCard
          title="Classes Affectées"
          amount={totalClasses}
          unit="count"
          subtitle={totalClasses > 0 ? teacherClasses.join(', ') : 'Aucune affectation'}
          icon={<GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="default"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_classes')}
        />

        <KpiCard
          title="Feuille d'Appel"
          customValue={totalClasses > 0 ? "Faire l'appel" : "Inactif"}
          subtitle={totalClasses > 0 ? "Saisie des présences du jour" : "Aucune classe affectée"}
          icon={<CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant={totalClasses > 0 ? "success" : "default"}
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
        />

        <KpiCard
          title="Carnet d'Évaluations"
          customValue="Bientôt disponible"
          subtitle="Module de notation en préparation"
          icon={<BookmarkCheck className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
          variant="default"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
        />
      </div>

      {/* Schedule & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule for Today */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Séances & Emploi du Temps
            </h2>
          </div>

          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2 shadow-2xs">
            <Clock className="h-8 w-8 mx-auto text-emerald-500/70 mb-1" />
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Emploi du temps : bientôt disponible
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Le planning hebdomadaire des cours et la répartition des salles seront directement affichés dès leur configuration par la direction.
            </p>
          </div>
        </div>

        {/* Right Col: Recent Evaluations & Quick Notices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Dernières Évaluations
            </h2>
          </div>

          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2 shadow-2xs">
            <BookmarkCheck className="h-8 w-8 mx-auto text-emerald-500/70 mb-1" />
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Carnet de notes : bientôt disponible
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              La création d'évaluations et la saisie des notes seront activées lors de la prochaine étape.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
