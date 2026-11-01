import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotion, type Variants } from 'framer-motion';

export const ADMIN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Variantes d'entrée communes à toutes les pages de la console : le conteneur lance ses
 * enfants un par un (70 ms d'écart), chaque enfant monte de 16 px en fondu.
 * En mouvement réduit : simple fondu, sans décalage.
 */
export const useAdminMotion = () => {
  const reduce = Boolean(useReducedMotion());
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: 0.05 } },
  };
  const item: Variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: ADMIN_EASE } },
      };
  return { reduce, container, item };
};

/** Page de la console : se rejoue à chaque changement d'onglet (le composant est remonté). */
export const AdminPage: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const { container } = useAdminMotion();
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={`p-5 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, subtitle, actions }) => {
  const { item } = useAdminMotion();
  return (
    <motion.div
      variants={item}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
};

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  /** Carte cliquable : léger soulèvement et bordure bleue au survol. */
  interactive?: boolean;
  onClick?: () => void;
  testId?: string;
}

/** Carte sobre : bordure fine, aucune ombre colorée, aucun dégradé. */
export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  className = '',
  interactive = false,
  onClick,
  testId,
}) => {
  const { item } = useAdminMotion();
  const base =
    'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
  const hover = interactive
    ? ' cursor-pointer transition-[translate,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#1D4ED8]/50 dark:hover:border-blue-400/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]'
    : '';
  if (interactive && onClick) {
    return (
      <motion.div
        variants={item}
        data-testid={testId}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${base}${hover} ${className}`}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.section variants={item} data-testid={testId} className={`${base} ${className}`}>
      {children}
    </motion.section>
  );
};

/** Titre de carte : pastille d'icône bleue, titre, sous-titre. */
export const CardTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}> = ({ icon, title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
    <div className="flex items-start gap-3 min-w-0">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

/** Nombre qui monte de sa valeur précédente à la nouvelle (valeur directe en mouvement réduit). */
export const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({
  value,
  className,
}) => {
  const reduce = Boolean(useReducedMotion());
  const [display, setDisplay] = useState<number>(reduce ? value : 0);
  const previous = useRef<number>(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: ADMIN_EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => {
        previous.current = value;
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={`tabular-nums ${className ?? ''}`}>{display}</span>;
};

/** Barre de proportions : chaque segment pousse depuis la gauche, l'un après l'autre. */
export const SegmentedBar: React.FC<{
  segments: { id: string; value: number; className: string; label: string }[];
  total: number;
}> = ({ segments, total }) => {
  const reduce = Boolean(useReducedMotion());
  return (
    <div
      className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
      role="img"
      aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(', ')}
    >
      {segments.map((seg, i) => {
        const pct = total > 0 ? (seg.value / total) * 100 : 0;
        if (pct === 0) return null;
        return (
          <motion.div
            key={seg.id}
            title={`${seg.label} : ${seg.value}`}
            className={`h-full origin-left ${seg.className}`}
            style={{ width: `${pct}%` }}
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: ADMIN_EASE }}
          />
        );
      })}
    </div>
  );
};

/** Pastille de statut : seules les couleurs de sens (vert, ambre, rouge) sont utilisées. */
export const STATUS_PILL: Record<'ok' | 'wait' | 'bad' | 'neutral' | 'info', string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  wait: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  bad: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  neutral:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  info: 'bg-blue-50 text-[#1D4ED8] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
};

export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]';

/** Boîte grise qui respire, pour les chiffres en cours de chargement. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`block rounded-md bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse ${className}`}
  />
);
