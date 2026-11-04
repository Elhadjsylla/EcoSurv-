import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { normalizeForSearch } from '../../lib/constants/wilayas';

export interface PlaceFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Suggestions proposées (par exemple les wilayas). Tout texte libre reste accepté. */
  suggestions: readonly string[];
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Champ texte avec suggestions : filtre pendant la frappe sans tenir compte des accents ni de la casse.
 * La valeur est le texte du champ ; une suggestion choisie le remplace simplement.
 */
export const PlaceField: React.FC<PlaceFieldProps> = ({
  value,
  onChange,
  suggestions,
  id,
  placeholder,
  disabled = false,
  className,
}) => {
  const reduceMotion = Boolean(useReducedMotion());
  const generatedId = useId();
  const inputId = id || generatedId;
  const listId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropUp, setDropUp] = useState(false);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(value);
    if (!q) return [...suggestions];
    return suggestions.filter((s) => normalizeForSearch(s).includes(q));
  }, [value, suggestions]);

  // Une valeur déjà égale à une suggestion n'a pas besoin d'être reproposée seule.
  const exactOnly =
    filtered.length === 1 && normalizeForSearch(filtered[0]) === normalizeForSearch(value);
  const visible = open && filtered.length > 0 && !exactOnly;

  const openList = () => {
    if (disabled) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < 240 && rect.top > below);
    }
    setOpen(true);
  };

  const select = (item: string) => {
    onChange(item);
    setOpen(false);
    setActiveIndex(-1);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!visible || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, visible]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!visible) {
        openList();
        setActiveIndex(0);
      } else {
        setActiveIndex((i) => (i + 1) % filtered.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visible) {
        openList();
        setActiveIndex(filtered.length - 1);
      } else {
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
      }
    } else if (e.key === 'Enter') {
      // Entrée choisit la suggestion en surbrillance ; sans suggestion active, elle valide le formulaire comme d'habitude.
      if (visible && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        select(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      if (visible) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Tab') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && activeIndex >= 0 ? `${inputId}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(-1);
          if (!open) openList();
        }}
        onFocus={openList}
        onClick={openList}
        onKeyDown={handleKeyDown}
        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
      />
      <AnimatePresence>
        {visible && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: dropUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: dropUp ? 4 : -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 right-0 z-50 max-h-56 overflow-y-auto overscroll-contain scroll-smooth rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg',
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
            )}
          >
            {filtered.map((item, i) => {
              const selected = normalizeForSearch(item) === normalizeForSearch(value);
              return (
                <li
                  key={item}
                  id={`${inputId}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  // mousedown : empêche le champ de perdre le focus avant le choix (souris et toucher).
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex min-h-[44px] sm:min-h-[36px] cursor-pointer items-center justify-between gap-2 px-3 text-xs',
                    i === activeIndex
                      ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-200',
                    selected && 'font-semibold text-[#1D4ED8] dark:text-blue-400'
                  )}
                >
                  <span className="truncate">{item}</span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-[#1D4ED8] dark:text-blue-400" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
