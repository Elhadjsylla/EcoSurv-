import React from 'react';
import { cn } from '../../lib/utils';
import type { StatutEcheance } from '../../types/domain';

interface StatusBadgeProps {
  statut: StatutEcheance;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  statut,
  className,
  showDot = true,
}) => {
  const configs: Record<
    StatutEcheance,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    paye: {
      label: 'Payé',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    a_jour: {
      label: 'À jour',
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/70 dark:border-emerald-800/50',
      dot: 'bg-emerald-500',
    },
    partiel: {
      label: 'Partiel',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    },
    en_retard: {
      label: 'En retard',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800/60',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[statut] || configs.a_jour;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0 animate-pulse-soft', config.dot)} />}
      <span>{config.label}</span>
    </span>
  );
};
