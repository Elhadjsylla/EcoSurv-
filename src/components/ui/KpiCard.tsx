import React, { ReactNode } from 'react';
import { cn, formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';
import { Tooltip } from './Tooltip';

/**
 * Unité d'une valeur chiffrée :
 * - 'MRU' : montant en Ouguiya, formaté en devise (compacté par défaut) ;
 * - 'count' : nombre (élèves, absences, quittances…), sans devise.
 */
export type KpiUnit = 'MRU' | 'count';

// `unit` est obligatoire dès qu'un `amount` est fourni : aucune unité par défaut,
// pour qu'un comptage ne puisse plus s'afficher en MRU par oubli.
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
}) => {
  const animatedAmount = useCountUp(amount ?? 0, 850);
  const animatedProgress = useCountUp(progress ?? 0, 850);

  // Nexoov-inspired pastel color palettes for card background & border
  const pastelStyles = {
    default: 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800',
    primary: 'bg-blue-50/75 dark:bg-blue-950/35 border-blue-200/70 dark:border-blue-900/50',
    success: 'bg-emerald-50/75 dark:bg-emerald-950/35 border-emerald-200/70 dark:border-emerald-900/50',
    danger: 'bg-rose-50/75 dark:bg-rose-950/35 border-rose-200/70 dark:border-rose-900/50',
    warning: 'bg-amber-50/75 dark:bg-amber-950/35 border-amber-200/70 dark:border-amber-900/50',
    purple: 'bg-purple-50/75 dark:bg-purple-950/35 border-purple-200/70 dark:border-purple-900/50',
  };

  const iconTextColors = {
    default: 'text-slate-600 dark:text-slate-300',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  const borderHoverGlow = {
    default: 'hover:border-slate-300 dark:hover:border-slate-700',
    primary: 'hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-blue-500/5',
    success: 'hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-emerald-500/5',
    danger: 'hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-rose-500/5',
    warning: 'hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-amber-500/5',
    purple: 'hover:border-purple-400 dark:hover:border-purple-700 hover:shadow-purple-500/5',
  };

  const formatValue = (value: number, abbreviated: boolean) =>
    unit === 'count'
      ? value.toLocaleString('fr-FR')
      : abbreviated
      ? formatCompactMRU(value)
      : formatMRU(value);

  const fullAmountText = amount !== undefined ? formatValue(amount, false) : undefined;
  const displayAmount = amount !== undefined ? formatValue(animatedAmount, compact) : null;

  // Infobulle de l'icône : le titre, et le montant complet quand la carte l'affiche abrégé.
  const tooltipContent = (
    <>
      <span className="block">{title}</span>
      {amount !== undefined && fullAmountText !== formatValue(amount, compact) && (
        <span className="block font-mono font-medium text-slate-300">{fullAmountText}</span>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 70,
        damping: 15,
        delay: staggerIndex !== undefined ? staggerIndex * 0.08 : 0,
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-5 sm:p-6 shadow-2xs transition-colors duration-200 relative overflow-hidden flex flex-col justify-between min-w-0',
        pastelStyles[variant],
        active
          ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 dark:ring-blue-500/20 shadow-sm'
          : borderHoverGlow[variant],
        onClick && 'cursor-pointer group',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug break-words">
              {title}
            </span>
            {onClick && (
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
            )}
          </div>
          {icon && (
            <Tooltip content={tooltipContent} className="shrink-0">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs',
                  iconTextColors[variant]
                )}
              >
                {icon}
              </div>
            </Tooltip>
          )}
        </div>

        <div className="mt-3 sm:mt-4 min-w-0">
          {customValue !== undefined ? (
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono transition-colors truncate">
              {customValue}
            </div>
          ) : displayAmount !== null ? (
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono transition-colors truncate">
              {displayAmount}
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono transition-colors truncate">
              {progress !== undefined ? `${animatedProgress}%` : '--'}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 min-w-0">
        {progress !== undefined && (
          <div className="space-y-1.5 mb-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/60">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  progress >= 80
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : progress >= 50
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-amber-500 dark:bg-amber-400'
                )}
                style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
              />
            </div>
          </div>
        )}

        {subtitle && (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2 min-w-0">
            {/* Sous le texte : l'infobulle ne recouvre jamais le chiffre de la carte */}
            <Tooltip content={subtitle} side="bottom" className="flex min-w-0">
              <span className="truncate min-w-0">{subtitle}</span>
            </Tooltip>
            {onClick && (
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Filtrer →
              </span>
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
};
