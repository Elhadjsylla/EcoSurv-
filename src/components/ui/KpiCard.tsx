import React, { ReactNode } from 'react';
import { cn, formatMRU } from '../../lib/utils';
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
}) => {
  const animatedAmount = useCountUp(amount ?? 0, 850);
  const animatedProgress = useCountUp(progress ?? 0, 850);

  const iconContainerStyles = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-50 text-blue-700',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  const borderHoverGlow = {
    default: 'hover:border-slate-300',
    primary: 'hover:border-blue-400 hover:shadow-blue-500/5',
    success: 'hover:border-emerald-400 hover:shadow-emerald-500/5',
    danger: 'hover:border-red-400 hover:shadow-red-500/5',
    warning: 'hover:border-amber-400 hover:shadow-amber-500/5',
  };

  return (
    <div
      onClick={onClick}
      style={staggerIndex !== undefined ? { animationDelay: `${staggerIndex * 75}ms` } : undefined}
      className={cn(
        'rounded-xl border p-5 shadow-2xs transition-all duration-200 relative overflow-hidden',
        staggerIndex !== undefined && 'animate-stagger-rise',
        active
          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-sm'
          : `border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md ${borderHoverGlow[variant]}`,
        onClick && 'cursor-pointer group active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          {title}
          {onClick && (
            <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
          )}
        </span>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/60 shrink-0 transition-transform duration-200 group-hover:scale-110',
              iconContainerStyles[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        {amount !== undefined ? (
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono transition-colors">
            {formatMRU(animatedAmount)}
          </div>
        ) : (
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono transition-colors">
            {progress !== undefined ? `${animatedProgress}%` : '--'}
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                progress >= 80
                  ? 'bg-emerald-600'
                  : progress >= 50
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
            />
          </div>
        </div>
      )}

      {subtitle && (
        <p className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
          {onClick && (
            <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Filtrer →
            </span>
          )}
        </p>
      )}
    </div>
  );
};
