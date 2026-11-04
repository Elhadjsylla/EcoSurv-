import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  MONTHS_FR_LOWER,
  clampDay,
  daysInMonth,
  parseIsoDate,
  toIsoDate,
  type DateParts,
} from '../../lib/dateParts';

/* -------------------------------------------------------------------------- */
/* Menu déroulant dessiné à la main (aucun <select> natif)                     */
/* -------------------------------------------------------------------------- */

interface MenuOption {
  value: number;
  label: string;
}

interface MenuSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: MenuOption[];
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Largeur minimale du menu (les noms de mois sont plus larges que le déclencheur). */
  menuMinWidth?: string;
  alignRight?: boolean;
}

const MenuSelect: React.FC<MenuSelectProps> = ({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  invalid,
  menuMinWidth,
  alignRight,
}) => {
  const reduceMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const listId = `${id}-listbox`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openMenu = useCallback(() => {
    if (disabled) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < 270 && rect.top > below);
    }
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, selectedIndex]);

  const closeMenu = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const choose = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    closeMenu(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  // Le menu prend le focus à l'ouverture pour que les flèches fonctionnent, et l'élément actif reste visible.
  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu();
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeMenu(true);
        break;
      case 'Tab':
        // Tab quitte le menu sans choisir et laisse le focus suivre son cours.
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={selected ? `${label} : ${selected.label}` : label}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-1 rounded-lg border bg-white dark:bg-slate-800 px-3 text-xs',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors cursor-pointer',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid ? 'border-red-400 dark:border-red-700' : 'border-slate-300 dark:border-slate-700',
          open && 'ring-2 ring-blue-600'
        )}
      >
        <span
          className={cn(
            'truncate',
            selected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
            reduceMotion ? 'duration-0' : 'duration-150',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-opt-${activeIndex}`}
            onKeyDown={handleListKeyDown}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: dropUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: dropUp ? 4 : -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' }}
            style={{ minWidth: menuMinWidth }}
            className={cn(
              'absolute z-50 max-h-60 w-full max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain scroll-smooth',
              'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg focus:outline-none',
              alignRight ? 'right-0' : 'left-0',
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
            )}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(i)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    // 44 px de haut au toucher, plus compact avec une souris.
                    'mx-1 flex min-h-[44px] sm:min-h-[34px] cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-xs',
                    isSelected
                      ? 'bg-[#1D4ED8] font-semibold text-white'
                      : isActive
                        ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* DateField : jour / mois / année                                            */
/* -------------------------------------------------------------------------- */

export interface DateFieldProps {
  /** Valeur au format AAAA-MM-JJ, ou chaîne vide. */
  value: string;
  /** Appelée avec AAAA-MM-JJ quand les trois parties sont choisies, sinon avec une chaîne vide. */
  onChange: (iso: string) => void;
  id?: string;
  disabled?: boolean;
  /** Message d'erreur du formulaire. */
  error?: string;
  /** Information sur l'état de saisie : message si la date est incomplète, null sinon. */
  onValidationChange?: (error: string | null) => void;
  /** Nombre d'années à retrancher à l'année en cours pour l'année la plus récente proposée. */
  minAgeYears?: number;
  /** Nombre d'années à retrancher à l'année en cours pour l'année la plus ancienne proposée. */
  maxAgeYears?: number;
  /** Date minimale autorisée (AAAA-MM-JJ). Facultatif : sans elle, la plage d'années par défaut s'applique. */
  minDate?: string;
  /** Date maximale autorisée (AAAA-MM-JJ). Facultatif. */
  maxDate?: string;
  /** Libellé accessible du groupe (par défaut « Date de naissance »). */
  groupLabel?: string;
  className?: string;
}

/** Compose AAAA-MM-JJ ; les comparaisons de bornes se font par ordre alphabétique (aucun objet Date). */
const mkIso = (y: number, m: number, d: number) =>
  `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  id,
  disabled = false,
  error,
  onValidationChange,
  minAgeYears = 3,
  maxAgeYears = 25,
  minDate,
  maxDate,
  groupLabel = 'Date de naissance',
  className,
}) => {
  const generatedId = useId();
  const baseId = id || generatedId;

  const [parts, setParts] = useState<DateParts>(() => parseIsoDate(value));

  // Resynchronise si le formulaire change la valeur (ouverture d'une autre fiche, réinitialisation).
  // Une sélection partielle (valeur du formulaire encore vide) est conservée.
  useEffect(() => {
    setParts((current) => (value === toIsoDate(current) ? current : parseIsoDate(value)));
  }, [value]);

  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo<MenuOption[]>(() => {
    const minB = minDate ? parseIsoDate(minDate) : null;
    const maxB = maxDate ? parseIsoDate(maxDate) : null;
    const newest = maxB?.year ?? currentYear - minAgeYears;
    const oldest = minB?.year ?? currentYear - maxAgeYears;
    const years: number[] = [];
    for (let y = newest; y >= oldest; y--) years.push(y);
    // Une fiche existante hors plage reste affichable et modifiable.
    if (parts.year !== null && !years.includes(parts.year)) {
      years.push(parts.year);
      years.sort((a, b) => b - a);
    }
    return years.map((y) => ({ value: y, label: String(y) }));
  }, [currentYear, minAgeYears, maxAgeYears, minDate, maxDate, parts.year]);

  // Avec des bornes, seuls les mois et les jours situés dans la période sont proposés.
  // Sans bornes (formulaire élève), toutes les options restent disponibles, comme avant.
  const bounded = Boolean(minDate || maxDate);
  const inRange = (isoValue: string) =>
    (!minDate || isoValue >= minDate) && (!maxDate || isoValue <= maxDate);

  const monthOptions = useMemo<MenuOption[]>(() => {
    const all = MONTHS_FR_LOWER.map((label, i) => ({ value: i + 1, label }));
    if (!bounded) return all;
    const kept = all.filter((o) => {
      const years = parts.year !== null ? [parts.year] : yearOptions.map((y) => y.value);
      // Le mois est proposé si au moins un de ses jours est dans la période.
      return years.some(
        (y) =>
          mkIso(y, o.value, 1) <= (maxDate ?? '9999-12-31') &&
          mkIso(y, o.value, daysInMonth(y, o.value)) >= (minDate ?? '0000-01-01')
      );
    });
    if (parts.month !== null && !kept.some((o) => o.value === parts.month)) {
      kept.push(all[parts.month - 1]);
      kept.sort((a, b) => a.value - b.value);
    }
    return kept;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounded, minDate, maxDate, parts.year, parts.month, yearOptions]);

  const dayCount = daysInMonth(parts.year, parts.month);
  const dayOptions = useMemo<MenuOption[]>(() => {
    const all = Array.from({ length: dayCount }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
    if (!bounded || parts.year === null || parts.month === null) return all;
    const kept = all.filter((o) => inRange(mkIso(parts.year as number, parts.month as number, o.value)));
    if (parts.day !== null && !kept.some((o) => o.value === parts.day) && parts.day <= dayCount) {
      kept.push(all[parts.day - 1]);
      kept.sort((a, b) => a.value - b.value);
    }
    return kept;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounded, minDate, maxDate, dayCount, parts.year, parts.month, parts.day]);

  const update = (next: DateParts) => {
    // Si le jour choisi n'existe plus dans le nouveau mois, il est ramené au dernier jour valide.
    const fixed: DateParts = { ...next, day: clampDay(next.day, next.year, next.month) };
    setParts(fixed);
    const iso = toIsoDate(fixed);
    const partial = !iso && (fixed.day !== null || fixed.month !== null || fixed.year !== null);
    onValidationChange?.(partial ? 'Date incomplète : choisissez le jour, le mois et l’année.' : null);
    onChange(iso);
  };

  return (
    <div className={className}>
      <div
        role="group"
        aria-label={groupLabel}
        className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-2"
      >
        <MenuSelect
          id={`${baseId}-jour`}
          label="Jour"
          placeholder="Jour"
          options={dayOptions}
          value={parts.day}
          onChange={(d) => update({ ...parts, day: d })}
          disabled={disabled}
          invalid={Boolean(error)}
          menuMinWidth="4.5rem"
        />
        <MenuSelect
          id={`${baseId}-mois`}
          label="Mois"
          placeholder="Mois"
          options={monthOptions}
          value={parts.month}
          onChange={(m) => update({ ...parts, month: m })}
          disabled={disabled}
          invalid={Boolean(error)}
          menuMinWidth="9rem"
        />
        <MenuSelect
          id={`${baseId}-annee`}
          label="Année"
          placeholder="Année"
          options={yearOptions}
          value={parts.year}
          onChange={(y) => update({ ...parts, year: y })}
          disabled={disabled}
          invalid={Boolean(error)}
          menuMinWidth="5.5rem"
          alignRight
        />
      </div>
      {error && (
        <p className="mt-1 flex items-start gap-1 text-[11px] text-red-600 dark:text-red-400">
          <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" /> <span>{error}</span>
        </p>
      )}
    </div>
  );
};
