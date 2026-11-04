import { useId } from 'react';
import { motion } from 'framer-motion';
import { SPRING_SHORT, useMotionPrefs } from '../../lib/motion';

export interface SegmentOption<T extends string> {
  value: T;
  /** Libellé affiché dès 640 px. */
  label: string;
  /** Libellé court sous 640 px. */
  shortLabel?: string;
  /** Libellé complet pour les lecteurs d'écran. */
  ariaLabel?: string;
  /** Pastille « en cours » (point à côté du libellé court). */
  marker?: boolean;
  /** Texte additionnel visible dès 640 px uniquement. */
  suffix?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  /** Nom du groupe pour les lecteurs d'écran. */
  label: string;
  className?: string;
}

/**
 * Contrôle segmenté à indicateur glissant (animation de transform par framer-motion,
 * layoutId). Segments de même largeur, 44 px de haut sous 640 px. Sous
 * prefers-reduced-motion l'indicateur se déplace sans transition.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: SegmentedControlProps<T>) {
  const { transition } = useMotionPrefs();
  const groupId = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid w-full grid-cols-3 sm:flex sm:w-auto rounded-xl border border-slate-200 bg-slate-100 p-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 ${className ?? ''}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-label={o.ariaLabel ?? o.label}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`relative min-h-[44px] sm:min-h-0 rounded-lg px-3 py-1.5 transition-colors focus-halo ${
              active
                ? 'text-on-primary'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${groupId}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-lg bg-primary shadow-xs"
                transition={transition(SPRING_SHORT)}
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
              <span className="sm:hidden">{o.shortLabel ?? o.label}</span>
              <span className="hidden sm:inline">
                {o.label}
                {o.suffix ? ` ${o.suffix}` : ''}
              </span>
              {o.marker && (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-80 sm:hidden" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
