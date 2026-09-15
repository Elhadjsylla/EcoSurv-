import React from 'react';
import { BookOpenCheck } from 'lucide-react';
import { EmptyState } from '../../components/ui/DataState';

/**
 * Aucune table de notes n'existe encore en base (BACKEND_AGENT.md §1 : notes
 * et bulletins en V2). L'écran l'indique au lieu d'afficher des évaluations
 * fictives.
 */
export const TeacherGradesPage: React.FC = () => (
  <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Saisie des Notes & Évaluations
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
        Carnet de notes de vos classes.
      </p>
    </div>

    <EmptyState
      comingSoon
      icon={<BookOpenCheck className="h-5 w-5" />}
      title="Saisie des notes"
      description="Les évaluations et les bulletins arriveront avec les tables de notes, protégées comme le reste par la RLS (vos classes uniquement)."
    />
  </div>
);
