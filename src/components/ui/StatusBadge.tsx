import React from 'react';
import { cn } from '../../lib/utils';
import { StatutEcheance } from '../../types';

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
      bg: 'bg-success-surface',
      text: 'text-success-text',
      border: 'border-success-border',
      dot: 'bg-success',
    },
    a_jour: {
      label: 'À jour',
      bg: 'bg-success-surface',
      text: 'text-success-text',
      border: 'border-success-border',
      dot: 'bg-success',
    },
    partiel: {
      label: 'Partiel',
      bg: 'bg-warning-surface',
      text: 'text-warning-text',
      border: 'border-warning-border',
      dot: 'bg-warning',
    },
    en_retard: {
      label: 'En retard',
      bg: 'bg-danger-surface',
      text: 'text-danger-text',
      border: 'border-danger-border',
      dot: 'bg-danger',
    },
  };

  const config = configs[statut] || configs.a_jour;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-xs font-bold tracking-wide transition-colors whitespace-nowrap shrink-0',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-sm shrink-0', config.dot)} />}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
