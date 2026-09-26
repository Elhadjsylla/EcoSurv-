import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string | number = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  prefix?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'outline' | 'ghost';
  align?: 'left' | 'right';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  emptyMessage?: React.ReactNode;
}

export function Select<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  prefix,
  icon,
  size = 'md',
  variant = 'default',
  align = 'left',
  className,
  triggerClassName,
  menuClassName,
  disabled = false,
  id,
  emptyMessage,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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

  // Synchronize focusedIndex with active selection when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, options, value]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev + 1;
          while (next < options.length && options[next]?.disabled) {
            next++;
          }
          return next < options.length ? next : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && options[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (
          focusedIndex >= 0 &&
          focusedIndex < options.length &&
          !options[focusedIndex]?.disabled
        ) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && listboxRef.current && focusedIndex >= 0) {
      const focusedElement = listboxRef.current.children[
        focusedIndex
      ] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Sizes
  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-11 px-3.5 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'h-12 px-4 text-sm sm:text-base gap-2.5 rounded-xl',
  };

  // Variants
  const variantStyles = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-white shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    subtle:
      'bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900 text-slate-800 dark:text-white hover:border-slate-300 shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    outline:
      'bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    ghost:
      'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-none',
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
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center justify-between font-medium transition-all duration-150 outline-none select-none cursor-pointer',
          sizeStyles[size],
          variantStyles[variant],
          disabled &&
            'opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800',
          isOpen && 'ring-2 ring-blue-500/20 border-blue-500',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 truncate">
          {icon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{icon}</span>}
          {prefix && (
            <span className="text-slate-400 font-normal shrink-0">
              {prefix}
            </span>
          )}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate font-semibold text-slate-900 dark:text-white">
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ease-out ml-2',
            isOpen && 'rotate-180 text-slate-700 dark:text-slate-200'
          )}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute top-full mt-1.5 min-w-full w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {options.length === 0 ? (
            <div className="py-4 px-3 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <AlertCircle className="h-4 w-4 mx-auto text-amber-500/80 mb-1" />
              <div>{emptyMessage || 'Aucune option disponible'}</div>
            </div>
          ) : (
            options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <div
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => {
                  if (!option.disabled) setFocusedIndex(index);
                }}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none',
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                  isFocused && !isSelected && 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white',
                  option.disabled &&
                    'opacity-40 cursor-not-allowed pointer-events-none'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {option.icon && (
                    <span className="shrink-0">{option.icon}</span>
                  )}
                  <div className="flex flex-col text-left min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-[11px] font-normal text-slate-400 truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />
                )}
              </div>
            );
          }))}
        </div>
      )}
    </div>
  );
}

export const Dropdown = Select;
export default Select;
