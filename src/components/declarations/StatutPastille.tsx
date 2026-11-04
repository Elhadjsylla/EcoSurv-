import React from 'react';
import { cn } from '../../lib/utils';
import { STATUT_LABEL, type StatutDeclaration } from '../../lib/declarationsAbsence';

/** Les couleurs de statut ne servent qu'ici : En attente ambre, Acceptée vert, Refusée rouge. */
const STYLE: Record<StatutDeclaration, string> = {
  en_attente: 'border-warning-border bg-warning-surface text-warning-text',
  acceptee: 'border-success-border bg-success-surface text-success-text',
  refusee: 'border-danger-border bg-danger-surface text-danger-text',
};

export const StatutPastille: React.FC<{ statut: StatutDeclaration; className?: string }> = ({ statut, className }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      STYLE[statut],
      className
    )}
  >
    {STATUT_LABEL[statut] ?? statut}
  </span>
);
