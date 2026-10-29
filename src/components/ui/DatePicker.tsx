import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from './Tooltip';

export interface DatePickerProps {
  value?: string; // Format ISO: 'YYYY-MM-DD'
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'outline';
  align?: 'left' | 'right';
  id?: string;
  /** Active le mode date de naissance (pas de lien Aujourd'hui, blocage futur, alerte âge hors 2-25 ans). */
  isBirthDate?: boolean;
  /** Message d'erreur externe (ex: validation de formulaire parent). */
  error?: string;
  /** Callback informatif sur l'erreur de saisie courante (null si valide ou vide). */
  onValidationChange?: (error: string | null) => void;
}

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const DAYS_SHORT = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function isoToDisplay(isoStr?: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return isoStr;
}

function getTodayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formate la saisie clavier en JJ/MM/AAAA avec insertion automatique des '/'
 * et chiffres uniquement, tout en permettant l'effacement fluide au Backspace.
 */
function formatMaskJJMMAAAA(rawInput: string, prevDisplay: string): string {
  const isDeleting = rawInput.length < prevDisplay.length;
  const digits = rawInput.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 0) return '';
  if (digits.length < 2) return digits;
  if (digits.length === 2) {
    return isDeleting ? digits : `${digits}/`;
  }
  if (digits.length < 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length === 4) {
    return isDeleting
      ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
      : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

interface DateValidationResult {
  valid: boolean;
  iso?: string;
  year?: number;
  monthIndex?: number;
  day?: number;
  error: string | null;
  warning: string | null;
}

function validateDigitsDate(
  digits: string,
  options: { isBirthDate: boolean; min?: string; max?: string }
): DateValidationResult {
  if (digits.length === 0) {
    return { valid: true, iso: '', error: null, warning: null };
  }

  if (digits.length < 8) {
    return {
      valid: false,
      error: 'Format de date incomplet (attendu : JJ/MM/AAAA).',
      warning: null,
    };
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  const candidate = new Date(year, month - 1, day);
  const isRealDate =
    year >= 1900 &&
    year <= 2100 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31 &&
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  if (!isRealDate) {
    return {
      valid: false,
      year: year >= 1900 && year <= 2100 ? year : undefined,
      monthIndex: month >= 1 && month <= 12 ? month - 1 : undefined,
      error: "Cette date n'existe pas (vérifiez le jour et le mois).",
      warning: null,
    };
  }

  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (options.isBirthDate && candidate.getTime() > todayStart.getTime()) {
    return {
      valid: false,
      year,
      monthIndex: month - 1,
      day,
      error: 'La date de naissance ne peut pas être dans le futur.',
      warning: null,
    };
  }

  if (options.max && iso > options.max) {
    return {
      valid: false,
      year,
      monthIndex: month - 1,
      day,
      error: options.isBirthDate
        ? 'La date de naissance ne peut pas être dans le futur.'
        : 'La date dépasse la limite maximale autorisée.',
      warning: null,
    };
  }

  if (options.min && iso < options.min) {
    return {
      valid: false,
      year,
      monthIndex: month - 1,
      day,
      error: 'La date est antérieure à la limite minimale autorisée.',
      warning: null,
    };
  }

  let warning: string | null = null;
  if (options.isBirthDate) {
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age -= 1;
    }
    if (age < 2 || age > 25) {
      warning = `Âge inhabituel : ${age} ans. Vérifiez la date.`;
    }
  }

  return {
    valid: true,
    iso,
    year,
    monthIndex: month - 1,
    day,
    error: null,
    warning,
  };
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'JJ/MM/AAAA',
  label,
  min,
  max,
  disabled = false,
  className,
  triggerClassName,
  size = 'md',
  variant = 'default',
  align = 'left',
  id,
  isBirthDate = false,
  error: externalError,
  onValidationChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const datePickerId = id || generatedId;

  const currentYear = new Date().getFullYear();
  const effectiveMax = isBirthDate ? max || getTodayIso() : max;

  const parseInitialView = (iso?: string) => {
    if (iso) {
      const parts = iso.split('-');
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 0 && m <= 11) {
          return { year: y, month: m };
        }
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const initialView = parseInitialView(value);
  const [viewYear, setViewYear] = useState<number>(initialView.year);
  const [viewMonth, setViewMonth] = useState<number>(initialView.month);

  const [inputText, setInputText] = useState<string>(() => isoToDisplay(value));
  const [internalError, setInternalError] = useState<string | null>(null);
  const [ageWarning, setAgeWarning] = useState<string | null>(null);
  const lastEmittedIsoRef = useRef<string | undefined>(value);

  const emitChange = (nextIso: string) => {
    lastEmittedIsoRef.current = nextIso;
    onChange(nextIso);
  };

  // Synchroniser l'affichage et l'avertissement lorsque la prop `value` change depuis l'extérieur
  useEffect(() => {
    if (value === lastEmittedIsoRef.current) {
      return;
    }
    lastEmittedIsoRef.current = value;
    const formatted = isoToDisplay(value);
    setInputText(formatted);
    setInternalError(null);

    if (value) {
      const digits = formatted.replace(/\D/g, '');
      if (digits.length === 8) {
        const check = validateDigitsDate(digits, {
          isBirthDate,
          min,
          max: effectiveMax,
        });
        setAgeWarning(check.warning);
        if (typeof check.year === 'number' && typeof check.monthIndex === 'number') {
          setViewYear(check.year);
          setViewMonth(check.monthIndex);
        }
      } else {
        setAgeWarning(null);
      }
    } else {
      setAgeWarning(null);
    }
  }, [value, isBirthDate, min, effectiveMax]);

  // Fermer le calendrier au clic extérieur ou touche Échap
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Liste des années du menu déroulant : de l'année en cours jusqu'à 30 ans en arrière
  const yearOptions = useMemo(() => {
    const baseYears = Array.from({ length: 31 }, (_, idx) => currentYear - idx);
    if (!baseYears.includes(viewYear)) {
      return [...baseYears, viewYear].sort((a, b) => b - a);
    }
    return baseYears;
  }, [currentYear, viewYear]);

  const updateValidationError = (err: string | null) => {
    setInternalError(err);
    if (onValidationChange) {
      onValidationChange(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatMaskJJMMAAAA(e.target.value, inputText);
    setInputText(masked);

    const digits = masked.replace(/\D/g, '');

    if (digits.length === 0) {
      updateValidationError(null);
      setAgeWarning(null);
      emitChange('');
      return;
    }

    // Si l'utilisateur a déjà saisi un mois et une année (8 chiffres), valider immédiatement
    if (digits.length === 8) {
      const check = validateDigitsDate(digits, {
        isBirthDate,
        min,
        max: effectiveMax,
      });

      if (typeof check.year === 'number' && typeof check.monthIndex === 'number') {
        setViewYear(check.year);
        setViewMonth(check.monthIndex);
      }

      if (!check.valid) {
        updateValidationError(check.error);
        setAgeWarning(null);
        emitChange('');
        return;
      }

      updateValidationError(null);
      setAgeWarning(check.warning);
      if (check.iso) {
        emitChange(check.iso);
      }
      return;
    }

    // Pendant la frappe (< 8 chiffres), effacer l'erreur précédente en attendant la fin de saisie
    updateValidationError(null);
    setAgeWarning(null);
    if (value) {
      emitChange('');
    }
  };

  const handleInputBlur = () => {
    const digits = inputText.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 8) {
      updateValidationError('Format de date incomplet (attendu : JJ/MM/AAAA).');
      setAgeWarning(null);
      emitChange('');
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Lundi, 6 = Dimanche
  };

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth);
  const daysInPrevMonth = getDaysInMonth(viewYear, viewMonth - 1);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const digits = `${dd}${mm}${String(viewYear).padStart(4, '0')}`;
    const check = validateDigitsDate(digits, {
      isBirthDate,
      min,
      max: effectiveMax,
    });

    const display = `${dd}/${mm}/${viewYear}`;
    setInputText(display);

    if (!check.valid) {
      updateValidationError(check.error);
      setAgeWarning(null);
      emitChange('');
      return;
    }

    updateValidationError(null);
    setAgeWarning(check.warning);
    emitChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    setInputText(`${dd}/${mm}/${yyyy}`);
    updateValidationError(null);
    setAgeWarning(null);
    emitChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputText('');
    updateValidationError(null);
    setAgeWarning(null);
    emitChange('');
  };

  const handleToggleCalendar = () => {
    if (disabled) return;
    if (!isOpen) {
      const digits = inputText.replace(/\D/g, '');
      if (digits.length === 8) {
        const d = Number(digits.slice(0, 2));
        const m = Number(digits.slice(2, 4));
        const y = Number(digits.slice(4, 8));
        const candidate = new Date(y, m - 1, d);
        if (
          y >= 1900 &&
          y <= 2100 &&
          m >= 1 &&
          m <= 12 &&
          candidate.getFullYear() === y &&
          candidate.getMonth() === m - 1
        ) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
    }
    setIsOpen((prev) => !prev);
  };

  const sizeStyles = {
    sm: 'min-h-[40px] sm:h-9 px-2.5 text-xs gap-1.5 rounded-lg',
    md: 'min-h-[44px] sm:h-10 px-3 text-xs sm:text-sm gap-2 rounded-md',
    lg: 'min-h-[48px] h-12 px-3.5 text-sm sm:text-base gap-2.5 rounded-md',
  };

  const variantStyles = {
    default:
      'bg-surface-input border border-strong text-main shadow-2xs focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600',
    subtle:
      'bg-surface-subtle border border-default text-main shadow-2xs focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600',
    outline:
      'bg-surface border border-default text-secondary focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600',
  };

  const isFullWidth =
    className?.includes('w-full') || triggerClassName?.includes('w-full');

  const displayedError = internalError || externalError || null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative text-left',
        isFullWidth ? 'w-full flex flex-col' : 'inline-flex flex-col',
        className
      )}
    >
      {label && (
        <label
          htmlFor={datePickerId}
          className="mb-1.5 block text-xs font-bold text-main"
        >
          {label}
        </label>
      )}

      {/* Champ de saisie directe JJ/MM/AAAA + bouton calendrier */}
      <div
        className={cn(
          'flex items-center justify-between font-medium transition-colors duration-150',
          sizeStyles[size],
          variantStyles[variant],
          disabled &&
            'opacity-50 cursor-not-allowed pointer-events-none bg-surface-subtle text-muted border-subtle',
          isOpen && 'border-primary ring-2 ring-primary/20',
          displayedError && 'border-red-500 dark:border-red-500',
          triggerClassName
        )}
      >
        <input
          ref={inputRef}
          id={datePickerId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          disabled={disabled}
          value={inputText}
          placeholder={placeholder}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !isOpen) {
              e.preventDefault();
              handleToggleCalendar();
            }
          }}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={
            displayedError
              ? `${datePickerId}-error`
              : ageWarning
              ? `${datePickerId}-warning`
              : undefined
          }
          className="w-full min-w-0 bg-transparent text-main placeholder:text-muted font-semibold tabular-nums focus:outline-none text-xs sm:text-inherit"
        />

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {inputText && !disabled && (
            <Tooltip content="Effacer la date">
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-muted hover:text-main rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
                aria-label="Effacer la date"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={handleToggleCalendar}
            aria-label="Ouvrir le calendrier"
            aria-expanded={isOpen}
            className="p-1 text-muted hover:text-main rounded-sm hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <CalendarIcon
              className={cn(
                'h-4 w-4 transition-colors',
                isOpen ? 'text-primary' : 'text-muted'
              )}
            />
          </button>
        </div>
      </div>

      {/* Message d'erreur clair sous le champ */}
      {displayedError && (
        <p
          id={`${datePickerId}-error`}
          role="alert"
          className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1 font-medium"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{displayedError}</span>
        </p>
      )}

      {/* Avertissement non bloquant pour un âge hors de 2 à 25 ans */}
      {!displayedError && ageWarning && (
        <p
          id={`${datePickerId}-warning`}
          className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium"
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>{ageWarning}</span>
        </p>
      )}

      {/* Panneau Calendrier */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 w-[min(19rem,calc(100vw-2rem))] rounded-md border border-subtle bg-surface-elevated p-3.5 sm:p-4 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-100 select-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* En-tête : flèches + menus déroulants Mois et Année */}
          <div className="flex items-center justify-between gap-1 pb-3 border-b border-subtle mb-3">
            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip content="Année précédente">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="min-h-[36px] min-w-[28px] sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-muted hover:text-main text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Année précédente"
                >
                  «
                </button>
              </Tooltip>
              <Tooltip content="Mois précédent">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="min-h-[36px] min-w-[28px] sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-secondary hover:text-main transition-colors cursor-pointer"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1 min-w-0 flex-1 justify-center">
              <select
                aria-label="Mois"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="h-8 px-1.5 rounded border border-subtle bg-surface-subtle text-main text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer max-w-[105px] truncate"
              >
                {MONTHS_FR.map((monthName, idx) => (
                  <option key={monthName} value={idx}>
                    {monthName}
                  </option>
                ))}
              </select>

              <select
                aria-label="Année"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="h-8 px-1.5 rounded border border-subtle bg-surface-subtle text-primary-text text-xs font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip content="Mois suivant">
                <button
                  type="button"
                  onClick={nextMonth}
                  className="min-h-[36px] min-w-[28px] sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-secondary hover:text-main transition-colors cursor-pointer"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content="Année suivante">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="min-h-[36px] min-w-[28px] sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-muted hover:text-main text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Année suivante"
                >
                  »
                </button>
              </Tooltip>
            </div>
          </div>

          {/* En-têtes des jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_SHORT.map((day) => (
              <span
                key={day}
                className="text-xs font-bold uppercase tracking-wider text-muted py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayIndex + idx + 1;
              return (
                <span
                  key={`prev-${idx}`}
                  className="min-h-[36px] sm:min-h-0 py-1.5 flex items-center justify-center text-muted/40 text-xs font-normal"
                >
                  {dayNum}
                </span>
              );
            })}

            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const day = idx + 1;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dayIso = `${viewYear}-${mm}-${dd}`;
              const isSelected = value === dayIso;
              const isOutOfRange = Boolean(
                (min && dayIso < min) ||
                  (effectiveMax && dayIso > effectiveMax)
              );

              const today = new Date();
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day;

              return (
                <button
                  key={`curr-${day}`}
                  type="button"
                  disabled={isOutOfRange}
                  onClick={() => !isOutOfRange && handleSelectDay(day)}
                  className={cn(
                    'min-h-[36px] sm:min-h-0 py-1.5 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors select-none tabular-nums',
                    isOutOfRange
                      ? 'text-muted/40 cursor-not-allowed opacity-40'
                      : isSelected
                      ? 'bg-primary text-on-primary font-bold shadow-xs cursor-pointer'
                      : isToday
                      ? 'bg-surface-subtle text-primary-text font-bold border border-primary hover:bg-surface-subtle/80 cursor-pointer'
                      : 'text-secondary hover:bg-surface-subtle hover:text-main cursor-pointer'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Pied de calendrier (sans "Aujourd'hui" pour la date de naissance) */}
          {(!isBirthDate || Boolean(inputText)) && (
            <div className="mt-3 pt-2.5 border-t border-subtle flex items-center justify-between text-xs">
              {!isBirthDate ? (
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="text-xs font-bold text-primary-text hover:text-primary-hover transition-colors cursor-pointer"
                >
                  Aujourd'hui
                </button>
              ) : (
                <span />
              )}
              {inputText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-muted hover:text-main transition-colors cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
