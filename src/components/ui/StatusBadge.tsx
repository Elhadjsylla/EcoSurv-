import React from 'react';
import { cn } from '../../lib/utils';
import { StatutEcheance } from '../../lib/mockData';

interface StatusBadgeProps {
  statut: StatutEcheance;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statut, className }) => {
  const configs: Record<
    StatutEcheance,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    paye: {
      label: 'Payé intégralement',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    en_retard: {
      label: 'En retard',
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    partiel: {
      label: 'Payé partiellement',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    a_jour: {
      label: 'À jour',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
  };

  const config = configs[statut] || configs.a_jour;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  );
};
