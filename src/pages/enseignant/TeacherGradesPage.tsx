import React from 'react';
import { BookOpen } from 'lucide-react';

export const TeacherGradesPage: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-stagger-rise">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Carnet de Notes & Évaluations
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Module Pédagogique
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Suivi des devoirs, contrôles continus et moyennes trimestrielles des élèves.
          </p>
        </div>
      </div>

      {/* Carte sobre Bientôt disponible */}
      <div className="p-12 sm:p-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4 shadow-2xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 mx-auto">
          <BookOpen className="h-8 w-8" />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Saisie des notes : bientôt disponible
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le module de notation, de gestion des coefficients et d'édition des bulletins scolaires sera activé lors du déploiement de la mise à jour pédagogique.
          </p>
        </div>
      </div>
    </div>
  );
};
