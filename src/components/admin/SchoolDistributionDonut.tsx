import React, { useState } from 'react';
import { AdminEcoleItem } from '../../pages/admin/AdminEcolesPage';
import { PieChart } from 'lucide-react';

interface SchoolDistributionDonutProps {
  ecoles: AdminEcoleItem[];
  onNavigateTab?: (tab: 'ecoles' | 'abonnements') => void;
}

export const SchoolDistributionDonut: React.FC<SchoolDistributionDonutProps> = ({
  ecoles,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'activation' | 'abonnement'>('activation');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = ecoles.length;

  // Calculs 100% réels à partir des données Supabase
  const activationSegments = [
    {
      id: 'active',
      label: 'Écoles Actives',
      count: ecoles.filter((e) => e.statut_activation === 'active').length,
      color: '#10b981', // emerald-500
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'en_attente',
      label: "En attente d'activation",
      count: ecoles.filter((e) => e.statut_activation === 'en_attente').length,
      color: '#f59e0b', // amber-500
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'suspendue',
      label: 'Écoles Suspendues',
      count: ecoles.filter((e) => e.statut_activation === 'suspendue').length,
      color: '#ef4444', // red-500
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dotColor: 'bg-rose-500',
    },
  ];

  const abonnementSegments = [
    {
      id: 'actif',
      label: 'Abonnements Payants',
      count: ecoles.filter((e) => e.statut_abonnement === 'actif').length,
      color: '#3b82f6', // blue-500
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      dotColor: 'bg-blue-500',
    },
    {
      id: 'essai',
      label: 'Essais Gratuits (14j)',
      count: ecoles.filter((e) => e.statut_abonnement === 'essai').length,
      color: '#f59e0b', // amber-500
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'expire',
      label: 'Abonnements Expirés',
      count: ecoles.filter((e) => e.statut_abonnement === 'expire').length,
      color: '#94a3b8', // slate-400
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
    },
  ];

  const activeSegments = viewMode === 'activation' ? activationSegments : abonnementSegments;

  // Calcul géométrique SVG Donut
  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius; // ≈ 427.25

  let accumulatedPercent = 0;
  const renderedSegments = activeSegments.map((seg, idx) => {
    const percent = total > 0 ? seg.count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...seg,
      percent,
      strokeDasharray,
      strokeDashoffset,
      index: idx,
    };
  });

  const activeHighlight = hoveredIndex !== null ? renderedSegments[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Répartition des Établissements
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ventilation réelle des {total} école(s) enregistrées en base
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setViewMode('activation');
              setHoveredIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'activation'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Activation
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('abonnement');
              setHoveredIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'abonnement'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Abonnement
          </button>
        </div>
      </div>

      {/* Main Content : Donut SVG + Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-6">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 180 180">
            {/* Background Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800/60 fill-none"
            />

            {/* Segments */}
            {total > 0 &&
              renderedSegments.map((seg) => {
                if (seg.count === 0) return null;
                const isHovered = hoveredIndex === seg.index;
                return (
                  <circle
                    key={seg.id}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(seg.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
          </svg>

          {/* Center Info Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {activeHighlight ? (
              <div className="animate-in fade-in duration-200">
                <span
                  className="text-2xl font-black tracking-tight"
                  style={{ color: activeHighlight.color }}
                >
                  {activeHighlight.count}
                </span>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 max-w-[90px] leading-tight">
                  {Math.round(activeHighlight.percent * 100)}% du total
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {total}
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Écoles
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend & Breakdown */}
        <div className="space-y-3">
          {renderedSegments.map((seg) => {
            const pct = total > 0 ? Math.round(seg.percent * 100) : 0;
            const isHovered = hoveredIndex === seg.index;
            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: seg.color,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {seg.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {pct}% de la plateforme
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {seg.count}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {seg.count > 1 ? 'écoles' : 'école'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px]">
          Source : Table Supabase <code className="font-mono text-blue-600 dark:text-blue-400">public.ecoles</code>
        </span>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('ecoles')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Voir la liste détaillée →
          </button>
        )}
      </div>
    </div>
  );
};
