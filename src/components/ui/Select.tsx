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

  // Sizes avec cible tactile mobile garantie >= 44px
  const sizeStyles = {
    sm: 'min-h-[44px] sm:min-h-0 sm:h-8 px-3 text-xs gap-1.5 rounded-sm',
    md: 'min-h-[44px] sm:h-10 px-3.5 text-xs sm:text-sm gap-2 rounded-md',
    lg: 'min-h-[48px] h-12 px-4 text-sm sm:text-base gap-2.5 rounded-md',
  };

  // Variants alignées sur les tokens sémantiques EcoSurv
  const variantStyles = {
    default:
      'bg-surface-input border border-strong hover:border-default text-main shadow-2xs focus-halo',
    subtle:
      'bg-surface-subtle border border-default hover:border-strong text-main shadow-2xs focus-halo',
    outline:
      'bg-surface border border-default hover:border-strong text-secondary focus-halo',
    ghost:
      'bg-transparent border-transparent hover:bg-surface-subtle text-secondary shadow-none focus-halo',
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
          className="mb-1.5 block text-xs font-bold text-main"
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
          'flex items-center justify-between font-medium transition-colors duration-150 select-none cursor-pointer',
          sizeStyles[size],
          variantStyles[variant],
          disabled &&
            'opacity-50 cursor-not-allowed pointer-events-none bg-surface-subtle text-muted border-subtle',
          isOpen && 'border-primary ring-2 ring-primary/20',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 truncate">
          {icon && <span className="shrink-0 text-muted">{icon}</span>}
          {prefix && (
            <span className="text-muted font-normal shrink-0">
              {prefix}
            </span>
          )}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate font-semibold text-main">
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span className="text-muted truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted shrink-0 transition-transform duration-150 ease-out ml-2',
            isOpen && 'rotate-180 text-primary'
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
            'absolute top-full mt-1.5 min-w-full w-full rounded-md border border-subtle bg-surface-elevated p-1.5 shadow-md z-50 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {options.length === 0 ? (
            <div className="py-4 px-3 text-center text-xs text-muted space-y-1">
              <AlertCircle className="h-4 w-4 mx-auto text-warning mb-1" />
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
                    'flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none',
                    isSelected
                      ? 'bg-surface-subtle text-primary font-bold'
                      : 'text-secondary hover:bg-surface-subtle hover:text-main',
                    isFocused && !isSelected && 'bg-surface-subtle text-main',
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
                        <span className="text-xs font-normal text-muted truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export const Dropdown = Select;
export default Select;
