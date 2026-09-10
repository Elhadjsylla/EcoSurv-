import React, { ReactNode } from 'react';
import { cn, formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import { ArrowUpRight } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface KpiCardProps {
  title: string;
  amount?: number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  progress?: number;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  staggerIndex?: number;
  compact?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  amount,
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
  };

  const iconTextColors = {
    default: 'text-slate-600 dark:text-slate-300',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
  };

  const borderHoverGlow = {
    default: 'hover:border-slate-300 dark:hover:border-slate-700',
    primary: 'hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-blue-500/5',
    success: 'hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-emerald-500/5',
    danger: 'hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-rose-500/5',
    warning: 'hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-amber-500/5',
  };

  const fullAmountText = amount !== undefined ? formatMRU(amount) : undefined;
  const displayAmount =
    amount !== undefined
      ? compact
        ? formatCompactMRU(animatedAmount)
        : formatMRU(animatedAmount)
      : null;

  return (
    <div
      onClick={onClick}
      style={staggerIndex !== undefined ? { animationDelay: `${staggerIndex * 75}ms` } : undefined}
      className={cn(
        'rounded-2xl border p-5 sm:p-6 shadow-2xs transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-w-0',
        pastelStyles[variant],
        staggerIndex !== undefined && 'animate-stagger-rise',
        active
          ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 dark:ring-blue-500/20 shadow-sm'
          : `hover:-translate-y-0.5 hover:shadow-md ${borderHoverGlow[variant]}`,
        onClick && 'cursor-pointer group active:scale-[0.99]',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              title={title}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug break-words"
            >
              {title}
            </span>
            {onClick && (
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
            )}
          </div>
          {icon && (
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs',
                iconTextColors[variant]
              )}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 sm:mt-4 min-w-0">
          {displayAmount !== null ? (
            <div
              title={fullAmountText}
              className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono transition-colors truncate cursor-help"
            >
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
          <p
            title={subtitle}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2 min-w-0"
          >
            <span className="truncate min-w-0">{subtitle}</span>
            {onClick && (
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Filtrer →
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};
