import React from 'react';
import { AlertTriangle, Clock3, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { messageErreurDonnees } from '../../data/errors';
import { Button } from './Button';
import { Tooltip, type TooltipSide } from './Tooltip';

export const A_VENIR = 'Disponible prochainement';

/** Chargement d'un écran ou d'un bloc. */
export const LoadingState: React.FC<{ label?: string; className?: string }> = ({
  label = 'Chargement des données…',
  className,
}) => (
  <div
    role="status"
    aria-live="polite"
    className={cn('flex items-center justify-center gap-2 py-16 text-sm font-semibold text-slate-500 dark:text-slate-400', className)}
  >
    <Loader2 className="h-4 w-4 animate-spin" />
    {label}
  </div>
);

/** Erreur de lecture, avec relance. Le détail technique n'est jamais affiché. */
export const ErrorState: React.FC<{ error: unknown; onRetry?: () => void; className?: string }> = ({
  error,
  onRetry,
  className,
}) => (
  <div
    role="alert"
    className={cn(
      'mx-auto my-10 max-w-lg rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-6 text-center space-y-3',
      className
    )}
  >
    <AlertTriangle className="mx-auto h-6 w-6 text-rose-600 dark:text-rose-400" />
    <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{messageErreurDonnees(error)}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </Button>
    )}
  </div>
);

/** Absence de données, ou fonctionnalité pas encore branchée. */
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  comingSoon?: boolean;
  className?: string;
}> = ({ title, description, icon, comingSoon = false, className }) => (
  <div
    className={cn(
      'rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-8 text-center space-y-2',
      className
    )}
  >
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
      {icon ?? (comingSoon ? <Clock3 className="h-5 w-5" /> : <Inbox className="h-5 w-5" />)}
    </div>
    {comingSoon && (
      <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {A_VENIR}
      </span>
    )}
    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
    {description && <p className="mx-auto max-w-md text-xs text-slate-500 dark:text-slate-400">{description}</p>}
  </div>
);

/**
 * Enveloppe d'un contrôle désactivé faute de backend : la bulle explique
 * pourquoi l'action n'est pas encore possible, au lieu d'un faux succès.
 */
export const ComingSoon: React.FC<{ children: React.ReactNode; detail?: string; side?: TooltipSide; className?: string }> = ({
  children,
  detail,
  side = 'top',
  className,
}) => (
  <Tooltip content={detail ? `${A_VENIR} : ${detail}` : A_VENIR} side={side} className={className}>
    {children}
  </Tooltip>
);
