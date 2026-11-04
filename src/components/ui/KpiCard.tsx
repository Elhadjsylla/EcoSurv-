import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../admin/adminUi';
import { useMotionPrefs } from '../../lib/motion';
import { ArrowUpRight } from 'lucide-react';
import { cn, formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import { useCountUp } from '../../hooks/useCountUp';
import { Tooltip } from './Tooltip';

/**
 * Unité d'une valeur chiffrée :
 * - 'MRU' : montant en Ouguiya, formaté en devise (compacté par défaut) ;
 * - 'count' : nombre (élèves, absences, quittances…), sans devise.
 */
export type KpiUnit = 'MRU' | 'count';

type KpiValueProps =
  | { amount: number; unit: KpiUnit; customValue?: never }
  | { customValue: ReactNode; amount?: never; unit?: never }
  | { amount?: never; unit?: never; customValue?: never };

type KpiCardProps = KpiValueProps & {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'purple';
  progress?: number;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  staggerIndex?: number;
  /** Montants MRU uniquement : format abrégé (ex. 57,5k MRU). */
  compact?: boolean;
  /**
   * true tant que la valeur n'est pas réellement chargée : un squelette remplace le chiffre
   * (aucune valeur n'est affichée ni animée). Quand la prop est fournie, le chiffre ne compte
   * de 0 à sa vraie valeur qu'une seule fois, à la première apparition.
   */
  loading?: boolean;
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  amount,
  unit,
  customValue,
  subtitle,
  icon,
  variant = 'default',
  progress,
  className,
  onClick,
  active = false,
  staggerIndex,
  compact = true,
  loading,
}) => {
  const { reduce } = useMotionPrefs();
  const isLoading = loading === true;
  // Pendant le chargement la cible reste à 0 : le compteur ne part vers la vraie valeur
  // qu'une fois celle-ci chargée.
  const animatedAmount = useCountUp(isLoading ? 0 : amount ?? 0, 850);
  const animatedProgress = useCountUp(isLoading ? 0 : progress ?? 0, 850);

  // « Une seule fois » (uniquement si la prop loading est fournie) : après la première
  // animation, les changements de valeur s'affichent directement.
  const [countDone, setCountDone] = useState(false);
  useEffect(() => {
    if (loading === undefined || loading) return;
    const t = window.setTimeout(() => setCountDone(true), 900);
    return () => window.clearTimeout(t);
  }, [loading]);
  const showDirect = loading !== undefined && countDone;

  // Styles de carte basés sur les tokens sémantiques (surfaces & bordures)
  const cardVariantStyles = {
    default: 'bg-surface border-subtle',
    primary: 'bg-surface border-subtle',
    success: 'bg-surface border-subtle',
    danger: 'bg-surface border-subtle',
    warning: 'bg-surface border-subtle',
    purple: 'bg-surface border-subtle',
  };

  const iconTextColors = {
    default: 'text-secondary',
    primary: 'text-primary-text',
    success: 'text-success-text',
    danger: 'text-danger-text',
    warning: 'text-warning-text',
    purple: 'text-primary-text',
  };

  const borderHoverStyles = {
    default: 'hover:border-default',
    primary: 'hover:border-primary/60',
    success: 'hover:border-success-border/60',
    danger: 'hover:border-danger-border/60',
    warning: 'hover:border-warning-border/60',
    purple: 'hover:border-primary/60',
  };

  const formatValue = (value: number, abbreviated: boolean) =>
    unit === 'count'
      ? value.toLocaleString('fr-FR')
      : abbreviated
      ? formatCompactMRU(value)
      : formatMRU(value);

  const fullAmountText = amount !== undefined ? formatValue(amount, false) : undefined;
  const displayAmount =
    amount !== undefined ? formatValue(showDirect ? amount : animatedAmount, compact) : null;

  // Infobulle de l'icône : le titre, et le montant complet quand la carte l'affiche abrégé.
  const tooltipContent = (
    <>
      <span className="block">{title}</span>
      {amount !== undefined && fullAmountText !== formatValue(amount, compact) && (
        <span className="block tabular-nums font-medium text-muted">{fullAmountText}</span>
      )}
    </>
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduce ? 0 : 0.25,
        delay: reduce ? 0 : staggerIndex !== undefined ? staggerIndex * 0.05 : 0,
      }}
      whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.15 } }}
      whileTap={onClick && !reduce ? { scale: 0.98 } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-md border p-5 sm:p-6 shadow-xs transition-colors duration-150 relative overflow-hidden flex flex-col justify-between min-w-0',
        cardVariantStyles[variant],
        active
          ? 'border-primary ring-2 ring-primary/20 shadow-xs'
          : borderHoverStyles[variant],
        onClick && 'cursor-pointer group focus-halo',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted leading-snug break-words">
              {title}
            </span>
            {onClick && (
              <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-primary-text transition-colors shrink-0" />
            )}
          </div>
          {icon && (
            <Tooltip content={tooltipContent} className="shrink-0">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-md bg-surface-subtle border border-subtle shrink-0 transition-transform duration-150 group-hover:scale-105',
                  iconTextColors[variant]
                )}
              >
                {icon}
              </div>
            </Tooltip>
          )}
        </div>

        <div className="mt-3 sm:mt-4 min-w-0">
          {isLoading ? (
            <Skeleton className="h-7 w-24 sm:h-8 sm:w-28" />
          ) : customValue !== undefined ? (
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-main tabular-nums transition-colors truncate">
              {customValue}
            </div>
          ) : displayAmount !== null ? (
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-main tabular-nums transition-colors truncate">
              {displayAmount}
            </div>
          ) : (
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-main tabular-nums transition-colors truncate">
              {progress !== undefined ? `${animatedProgress}%` : '--'}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 min-w-0">
        {progress !== undefined && (
          <div className="space-y-1.5 mb-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface-subtle border border-subtle">
              {/* transform seulement (scaleX), jamais width : aucun recalcul de mise en page */}
              <div
                className={cn(
                  'h-full w-full origin-left rounded-sm',
                  progress >= 80
                    ? 'bg-success'
                    : progress >= 50
                    ? 'bg-primary'
                    : 'bg-warning'
                )}
                style={{ transform: `scaleX(${Math.min(100, Math.max(0, animatedProgress)) / 100})` }}
              />
            </div>
          </div>
        )}

        {isLoading && subtitle && <Skeleton className="h-4 w-32" />}
        {!isLoading && subtitle && (
          <p className="text-xs font-medium text-muted flex items-center justify-between gap-2 min-w-0">
            <Tooltip content={subtitle} side="bottom" className="flex min-w-0">
              <span className="truncate min-w-0">{subtitle}</span>
            </Tooltip>
            {onClick && (
              <span className="text-xs font-bold text-primary-text opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Filtrer →
              </span>
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
};
