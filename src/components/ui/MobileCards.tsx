import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Liste de cartes pour les écrans de moins de 640 px : une carte par ligne d'un tableau,
 * libellés visibles, actions de 44 px. À associer au tableau d'origine, qui reste affiché dès 640 px :
 *   <MobileCardList> … </MobileCardList>            (visible sous 640 px)
 *   <div className="hidden sm:block"> <table/> </div>   (visible dès 640 px)
 */

export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]';

interface ListProps {
  children: React.ReactNode;
  className?: string;
  /** Texte lu par les lecteurs d'écran pour nommer la liste. */
  label?: string;
}

export const MobileCardList: React.FC<ListProps> = ({ children, className, label }) => (
  <ul aria-label={label} className={cn('space-y-3 p-3 sm:hidden', className)}>
    {/* Sorties de cartes (filtre, suppression) animées : opacité seulement, 120 ms */}
    <AnimatePresence initial={false}>{children}</AnimatePresence>
  </ul>
);

export interface CardFact {
  label: string;
  value: React.ReactNode;
  /** Occupe toute la largeur de la carte (texte long, numéro, référence). */
  wide?: boolean;
}

interface CardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  badge?: React.ReactNode;
  facts?: CardFact[];
  actions?: React.ReactNode;
  /** Rend toute la carte cliquable (ouvre la fiche, par exemple). */
  onClick?: () => void;
  selected?: boolean;
  /** Teinte de la barre latérale : indique un état (impayé, retard…). */
  accent?: 'none' | 'danger' | 'warning' | 'success' | 'primary';
  index?: number;
  className?: string;
}

const ACCENT: Record<NonNullable<CardProps['accent']>, string> = {
  none: 'border-l-slate-200 dark:border-l-slate-700',
  danger: 'border-l-rose-500',
  warning: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  primary: 'border-l-[#1D4ED8]',
};

export const MobileCard: React.FC<CardProps> = ({
  title,
  subtitle,
  leading,
  badge,
  facts,
  actions,
  onClick,
  selected = false,
  accent = 'none',
  index = 0,
  className,
}) => {
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
      layout={reduceMotion ? false : 'position'}
      transition={{ duration: reduceMotion ? 0 : 0.16, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.02 }}
      className={cn(
        'rounded-2xl border border-l-4 bg-white dark:bg-slate-900 p-4 shadow-2xs',
        selected
          ? 'border-slate-200 dark:border-slate-800 ring-2 ring-[#1D4ED8]/40'
          : 'border-slate-200 dark:border-slate-800',
        ACCENT[accent],
        className
      )}
    >
      <div
        {...(onClick
          ? {
              role: 'button' as const,
              tabIndex: 0,
              onClick,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              },
            }
          : {})}
        className={cn('flex items-start gap-3 rounded-lg', onClick && `cursor-pointer ${FOCUS_RING}`)}
      >
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="break-words text-sm font-bold leading-tight text-slate-900 dark:text-white">{title}</div>
          {subtitle && (
            <div className="mt-0.5 break-words text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</div>
          )}
        </div>
        {badge && <div className="max-w-[45%] shrink-0 text-right">{badge}</div>}
      </div>

      {facts && facts.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          {facts.map((f) => (
            <div key={f.label} className={cn('min-w-0', f.wide && 'col-span-2')}>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {f.label}
              </dt>
              <dd className="mt-0.5 break-words font-medium text-slate-800 dark:text-slate-200">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          {actions}
        </div>
      )}
    </motion.li>
  );
};

interface ActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'danger';
}

/** Bouton d'action de carte : 44 px de haut, même bleu que le reste du SaaS. */
export const CardAction: React.FC<ActionProps> = ({
  icon,
  variant = 'outline',
  className,
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={cn(
      'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      FOCUS_RING,
      variant === 'primary' && 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF]',
      variant === 'outline' &&
        'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700',
      variant === 'danger' &&
        'border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40',
      className
    )}
    {...rest}
  >
    {icon}
    {children}
  </button>
);
