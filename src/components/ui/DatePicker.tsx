import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
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

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const datePickerId = id || generatedId;

  // Initial Calendar View (Month & Year)
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calendar logic helpers
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
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const formatDisplay = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoStr;
    } catch {
      return isoStr;
    }
  };

  // Sizes avec cible tactile mobile garantie >= 44px
  const sizeStyles = {
    sm: 'min-h-[44px] sm:min-h-0 sm:h-8 px-3 text-xs gap-1.5 rounded-sm',
    md: 'min-h-[44px] sm:h-10 px-3.5 text-xs sm:text-sm gap-2 rounded-md',
    lg: 'min-h-[48px] h-12 px-4 text-sm sm:text-base gap-2.5 rounded-md',
  };

  // Variants alignées sur les tokens sémantiques EcoSurv
  const variantStyles = {
    default:
      'bg-surface-input border border-strong text-main shadow-2xs focus-halo',
    subtle:
      'bg-surface-subtle border border-default text-main shadow-2xs focus-halo',
    outline:
      'bg-surface border border-default text-secondary focus-halo',
  };

  const isFullWidth =
    className?.includes('w-full') || triggerClassName?.includes('w-full');

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

      {/* Trigger Button */}
      <button
        id={datePickerId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between font-medium transition-colors duration-150 select-none cursor-pointer',
          sizeStyles[size],
          variantStyles[variant],
          disabled &&
            'opacity-50 cursor-not-allowed pointer-events-none bg-surface-subtle text-muted border-subtle',
          isOpen && 'border-primary ring-2 ring-primary/20',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          <CalendarIcon className="h-4 w-4 text-muted shrink-0" />
          {value ? (
            <span className="font-semibold text-main truncate tabular-nums">
              {formatDisplay(value)}
            </span>
          ) : (
            <span className="text-muted truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <Tooltip content="Effacer la date">
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClear(e as any);
                  }
                }}
                className="p-0.5 text-muted hover:text-main rounded-sm hover:bg-surface-subtle transition-colors focus-halo cursor-pointer"
                aria-label="Effacer la date"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </Tooltip>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted transition-transform duration-150 ease-out',
              isOpen && 'rotate-180 text-primary'
            )}
          />
        </div>
      </button>

      {/* Dropdown Calendar Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 w-72 rounded-md border border-subtle bg-surface-elevated p-4 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-100 select-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Dropdown Calendar Panel */}
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-subtle mb-3">
            <div className="flex items-center gap-0.5">
              <Tooltip content="Année précédente">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-muted hover:text-main text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Année précédente"
                >
                  «
                </button>
              </Tooltip>
              <Tooltip content="Mois précédent">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-secondary hover:text-main transition-colors cursor-pointer"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-main">
                {MONTHS_FR[viewMonth]}
              </span>
              <span className="text-xs font-bold text-primary-text bg-surface-subtle border border-subtle px-2 py-0.5 rounded-sm tabular-nums">
                {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              <Tooltip content="Mois suivant">
                <button
                  type="button"
                  onClick={nextMonth}
                  className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-secondary hover:text-main transition-colors cursor-pointer"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content="Année suivante">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center rounded-sm hover:bg-surface-subtle text-muted hover:text-main text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Année suivante"
                >
                  »
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Days of Week Headers */}
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayIndex + idx + 1;
              return (
                <span
                  key={`prev-${idx}`}
                  className="min-h-[40px] sm:min-h-0 py-1.5 flex items-center justify-center text-muted/40 text-xs font-normal"
                >
                  {dayNum}
                </span>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const day = idx + 1;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dayIso = `${viewYear}-${mm}-${dd}`;
              const isSelected = value === dayIso;
              const isOutOfRange = Boolean((min && dayIso < min) || (max && dayIso > max));

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
                    'min-h-[40px] sm:min-h-0 py-1.5 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors select-none tabular-nums',
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

          {/* Footer Shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-subtle flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-bold text-primary-text hover:text-primary-hover transition-colors cursor-pointer"
            >
              Aujourd'hui
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-muted hover:text-main transition-colors cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
