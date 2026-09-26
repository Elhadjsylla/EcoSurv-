import React from 'react';
import { AdminEcoleItem } from '../../pages/admin/AdminEcolesPage';
import {
  ArrowRight,
  Zap,
} from 'lucide-react';

interface PlatformActivationGaugeProps {
  ecoles: AdminEcoleItem[];
  onNavigateTab: (tab: 'ecoles') => void;
}

export const PlatformActivationGauge: React.FC<PlatformActivationGaugeProps> = ({
  ecoles,
  onNavigateTab,
}) => {
  const total = ecoles.length;
  const activeCount = ecoles.filter((e) => e.statut_activation === 'active').length;
  const pendingCount = ecoles.filter((e) => e.statut_activation === 'en_attente').length;
  const suspendedCount = ecoles.filter((e) => e.statut_activation === 'suspendue').length;

  const activationRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const paidAbonnements = ecoles.filter((e) => e.statut_abonnement === 'actif').length;
  const conversionRate = total > 0 ? Math.round((paidAbonnements / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Jauge d'Activation & Santé Plateforme
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Indicateur de déploiement et conformité des établissements sur EcoSurv
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {activationRate}% Actives
        </span>
      </div>

      {/* Progress Bar & Markers */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {activationRate}%
            </span>
            <span className="text-xs font-bold text-slate-400 ml-2">
              d'écoles opérationnelles ({activeCount}/{total})
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Objectif cible : 90%+
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {/* Actives segment */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${total > 0 ? (activeCount / total) * 100 : 0}%` }}
            title={`Actives : ${activeCount} (${total > 0 ? Math.round((activeCount / total) * 100) : 0}%)`}
          />
          {/* En attente segment */}
          <div
            className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-500"
            style={{ width: `${total > 0 ? (pendingCount / total) * 100 : 0}%` }}
            title={`En attente : ${pendingCount} (${total > 0 ? Math.round((pendingCount / total) * 100) : 0}%)`}
          />
          {/* Suspendues segment */}
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${total > 0 ? (suspendedCount / total) * 100 : 0}%` }}
            title={`Suspendues : ${suspendedCount} (${total > 0 ? Math.round((suspendedCount / total) * 100) : 0}%)`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Actives ({activeCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              En attente ({pendingCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Suspendues ({suspendedCount})
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row inside Gauge */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Conversion Payante
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {paidAbonnements} école(s) abonnées
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            À Traiter d'Urgence
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            en attente de validation
          </p>
        </div>
      </div>

      {/* Action Notice & Shortcut */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {pendingCount > 0
            ? `${pendingCount} établissement(s) requièrent votre validation`
            : "Tous les établissements sont traités et validés"}
        </span>

        <button
          type="button"
          onClick={() => onNavigateTab('ecoles')}
          className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <span>Examiner les établissements</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
