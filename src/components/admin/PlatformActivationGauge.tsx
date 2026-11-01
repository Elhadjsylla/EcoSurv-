import React from 'react';
import { ArrowRight, Rocket } from 'lucide-react';
import { AdminEcoleItem } from '../../pages/admin/AdminEcolesPage';
import {
  AdminCard,
  AnimatedNumber,
  CardTitle,
  FOCUS_RING,
  SegmentedBar,
} from './adminUi';

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

  const legend = [
    { label: 'Actives', value: activeCount, dot: 'bg-emerald-500' },
    { label: 'En attente', value: pendingCount, dot: 'bg-amber-400' },
    { label: 'Suspendues', value: suspendedCount, dot: 'bg-rose-500' },
  ];

  return (
    <AdminCard testId="gauge-card" className="flex flex-col">
      <CardTitle
        icon={<Rocket className="h-4 w-4" />}
        title="Déploiement des écoles"
        subtitle="Part des écoles dont l'accès est activé"
      />

      <div className="flex-1 space-y-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={activationRate} />
            <span className="text-2xl"> %</span>
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            des écoles sont actives ({activeCount} sur {total})
          </span>
        </div>

        <SegmentedBar
          total={total}
          segments={[
            { id: 'active', value: activeCount, className: 'bg-emerald-500', label: 'Actives' },
            { id: 'en_attente', value: pendingCount, className: 'bg-amber-400', label: 'En attente' },
            { id: 'suspendue', value: suspendedCount, className: 'bg-rose-500', label: 'Suspendues' },
          ]}
        />

        <dl className="grid grid-cols-3 gap-3">
          {legend.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                {row.label}
              </dt>
              <dd className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedNumber value={row.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <span className="text-slate-500 dark:text-slate-400">
          {pendingCount > 0
            ? `${pendingCount} établissement${pendingCount > 1 ? 's' : ''} en attente d'activation`
            : "Aucun établissement en attente d'activation"}
        </span>
        <button
          type="button"
          onClick={() => onNavigateTab('ecoles')}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded font-bold text-[#1D4ED8] hover:underline cursor-pointer dark:text-blue-300 ${FOCUS_RING}`}
        >
          <span>Examiner les écoles</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </AdminCard>
  );
};
