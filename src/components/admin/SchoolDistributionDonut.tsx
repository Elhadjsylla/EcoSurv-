import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import { AdminEcoleItem } from '../../pages/admin/AdminEcolesPage';
import { ADMIN_EASE, AdminCard, AnimatedNumber, CardTitle, FOCUS_RING } from './adminUi';

interface SchoolDistributionDonutProps {
  ecoles: AdminEcoleItem[];
  onNavigateTab?: (tab: 'ecoles' | 'abonnements') => void;
}

type ViewMode = 'activation' | 'abonnement';

export const SchoolDistributionDonut: React.FC<SchoolDistributionDonutProps> = ({
  ecoles,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('activation');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reduce = Boolean(useReducedMotion());

  const total = ecoles.length;

  // Calculs réels à partir des écoles chargées. Vert, ambre et rouge : couleurs de sens
  // (actif, en attente, suspendu) ; le bleu #1D4ED8 est la couleur de la marque.
  const activationSegments = [
    {
      id: 'active',
      label: 'Écoles actives',
      count: ecoles.filter((e) => e.statut_activation === 'active').length,
      color: '#10b981',
    },
    {
      id: 'en_attente',
      label: "En attente d'activation",
      count: ecoles.filter((e) => e.statut_activation === 'en_attente').length,
      color: '#f59e0b',
    },
    {
      id: 'suspendue',
      label: 'Écoles suspendues',
      count: ecoles.filter((e) => e.statut_activation === 'suspendue').length,
      color: '#ef4444',
    },
  ];

  const abonnementSegments = [
    {
      id: 'actif',
      label: 'Abonnements actifs',
      count: ecoles.filter((e) => e.statut_abonnement === 'actif').length,
      color: '#1D4ED8',
    },
    {
      id: 'essai',
      label: 'En essai',
      count: ecoles.filter((e) => e.statut_abonnement === 'essai').length,
      color: '#f59e0b',
    },
    {
      id: 'expire',
      label: 'Abonnements expirés',
      count: ecoles.filter((e) => e.statut_abonnement === 'expire').length,
      color: '#94a3b8',
    },
  ];

  const activeSegments = viewMode === 'activation' ? activationSegments : abonnementSegments;

  // Géométrie du donut SVG
  const radius = 68;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const renderedSegments = activeSegments.map((seg, idx) => {
    const percent = total > 0 ? seg.count / total : 0;
    // Petit intervalle de 2 px entre les segments pour les séparer visuellement
    const gap = seg.count > 0 && activeSegments.filter((s) => s.count > 0).length > 1 ? 2 : 0;
    const length = Math.max(0, percent * circumference - gap);
    const offset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...seg,
      percent,
      dash: `${length} ${circumference}`,
      offset,
      index: idx,
    };
  });

  const activeHighlight = hoveredIndex !== null ? renderedSegments[hoveredIndex] : null;

  const modes: { id: ViewMode; label: string }[] = [
    { id: 'activation', label: 'Activation' },
    { id: 'abonnement', label: 'Abonnement' },
  ];

  return (
    <AdminCard testId="donut-card" className="flex flex-col">
      <CardTitle
        icon={<PieChart className="h-4 w-4" />}
        title="Répartition des établissements"
        subtitle={`${total} école${total > 1 ? 's' : ''} enregistrée${total > 1 ? 's' : ''}`}
        right={
          <div
            role="tablist"
            aria-label="Type de répartition"
            className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800"
          >
            {modes.map((m) => {
              const selected = viewMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setViewMode(m.id);
                    setHoveredIndex(null);
                  }}
                  className={`relative rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${FOCUS_RING} ${
                    selected
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="donut-mode-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="relative z-10">{m.label}</span>
                </button>
              );
            })}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
        {/* Donut : chaque segment se dessine à l'ouverture et à chaque changement de mode */}
        <div className="relative flex items-center justify-center">
          <svg className="w-52 h-52 -rotate-90" viewBox="0 0 180 180" role="img" aria-label="Répartition des écoles">
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800 fill-none"
            />
            {total > 0 &&
              renderedSegments.map((seg) => {
                if (seg.count === 0) return null;
                const isHovered = hoveredIndex === seg.index;
                return (
                  <motion.circle
                    key={`${viewMode}-${seg.id}`}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="butt"
                    className="cursor-pointer"
                    initial={reduce ? false : { strokeDasharray: `0 ${circumference}`, strokeWidth }}
                    animate={{
                      strokeDasharray: seg.dash,
                      strokeWidth: isHovered ? strokeWidth + 4 : strokeWidth,
                    }}
                    transition={{
                      strokeDasharray: { duration: 0.9, delay: 0.1 + seg.index * 0.12, ease: ADMIN_EASE },
                      strokeWidth: { duration: 0.2 },
                    }}
                    onMouseEnter={() => setHoveredIndex(seg.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {activeHighlight ? (
              <div>
                <span
                  className="text-3xl font-extrabold tracking-tight tabular-nums"
                  style={{ color: activeHighlight.color }}
                >
                  {activeHighlight.count}
                </span>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {Math.round(activeHighlight.percent * 100)} % du total
                </span>
              </div>
            ) : (
              <div>
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  <AnimatedNumber value={total} />
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  École{total > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Légende : survol relié au donut */}
        <ul className="space-y-2.5">
          {renderedSegments.map((seg, i) => {
            const pct = total > 0 ? Math.round(seg.percent * 100) : 0;
            const isHovered = hoveredIndex === seg.index;
            return (
              <motion.li
                key={`${viewMode}-${seg.id}`}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.07, ease: ADMIN_EASE }}
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                  isHovered
                    ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                      {seg.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{pct} % des écoles</span>
                  </div>
                </div>
                <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {seg.count}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {onNavigateTab && (
        <div className="mt-2 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onNavigateTab(viewMode === 'activation' ? 'ecoles' : 'abonnements')}
            className={`rounded text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer dark:text-blue-300 ${FOCUS_RING}`}
          >
            {viewMode === 'activation' ? 'Voir la liste des écoles' : 'Voir les abonnements'}
          </button>
        </div>
      )}
    </AdminCard>
  );
};
