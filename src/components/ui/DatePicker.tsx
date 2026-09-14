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
  value: string; // Format 'YYYY-MM-DD'
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'outline';
  align?: 'left' | 'right';
  className?: string;
  triggerClassName?: string;
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
  placeholder = 'JJ/MM/AAAA',
  label,
  disabled = false,
  min,
  max,
  size = 'md',
  variant = 'default',
  align = 'left',
  className,
  triggerClassName,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const datePickerId = id || generatedId;

  // Parse current value or default to current date
  const parsedDate = value ? new Date(value + 'T00:00:00') : null;
  const initialYear =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.getFullYear()
      : new Date().getFullYear();
  const initialMonth =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.getMonth()
      : new Date().getMonth();

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside & Escape listeners
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

  // Format date display (e.g., '14/02/2026' or '14 févr. 2026')
  const formatDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  // Calendar calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 is Sunday, 1 is Monday... Adjust to Monday = 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
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
    const iso = `${viewYear}-${mm}-${dd}`;
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Generate a list of years for quick selection (e.g. for birth dates)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear + 2; y >= currentYear - 80; y--) {
    yearOptions.push(y);
  }

  // Sizes
  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-11 px-3.5 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'h-12 px-4 text-sm sm:text-base gap-2.5 rounded-xl',
  };

  // Variants
  const variantStyles = {
    default:
      'bg-white border border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    subtle:
      'bg-slate-50 border border-slate-200/90 hover:bg-slate-100/80 text-slate-800 hover:border-slate-300 shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    outline:
      'bg-transparent border border-slate-300 hover:bg-slate-50 text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
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
          className="mb-1.5 block text-xs font-bold text-slate-700"
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
          'flex items-center justify-between font-medium transition-all duration-150 outline-none select-none cursor-pointer',
          sizeStyles[size],
          variantStyles[variant],
          disabled &&
            'opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 text-slate-400 border-slate-200',
          isOpen && 'ring-2 ring-blue-500/20 border-blue-500',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
          {value ? (
            <span className="font-semibold text-slate-900 truncate font-mono">
              {formatDisplay(value)}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <Tooltip content="Effacer la date">
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                aria-label="Effacer la date"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </Tooltip>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform duration-200 ease-out',
              isOpen && 'rotate-180 text-slate-700'
            )}
          />
        </div>
      </button>

      {/* Dropdown Calendar Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-0.5">
              <Tooltip content="Année précédente">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors"
                  aria-label="Année précédente"
                >
                  «
                </button>
              </Tooltip>
              <Tooltip content="Mois précédent">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900">
                {MONTHS_FR[viewMonth]}
              </span>
              <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
                {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              <Tooltip content="Mois suivant">
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content="Année suivante">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors"
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
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
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
                  className="py-1.5 text-slate-300 text-xs font-normal"
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
                    'py-1.5 rounded-lg text-xs font-semibold transition-all select-none',
                    isOutOfRange
                      ? 'text-slate-300 cursor-not-allowed opacity-40'
                      : isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs cursor-pointer'
                      : isToday
                      ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200 hover:bg-blue-100 cursor-pointer'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Aujourd'hui
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
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
