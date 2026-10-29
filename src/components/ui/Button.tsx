import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  loading = false,
  loadingText,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-halo disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded-md active:scale-[0.98]';

  const variants = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover shadow-xs border border-primary',
    secondary:
      'bg-surface-subtle text-secondary hover:bg-surface hover:text-main active:bg-surface-subtle border border-default shadow-xs',
    outline:
      'border border-default bg-surface text-secondary hover:bg-surface-subtle hover:text-main active:bg-surface-subtle shadow-xs',
    ghost:
      'text-secondary hover:bg-surface-subtle hover:text-main shadow-none',
    danger:
      'bg-danger text-on-primary hover:bg-danger/90 active:bg-danger border border-danger shadow-xs',
  };

  const sizes = {
    // Cibles tactiles mobiles garanties >= 44px sur mobile (min-h-[44px])
    sm: 'min-h-[44px] sm:min-h-0 sm:h-8 px-3 text-xs gap-1.5',
    md: 'min-h-[44px] sm:h-10 px-4 text-sm gap-2',
    lg: 'min-h-[48px] h-12 px-6 text-base gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
      {loading ? loadingText || children : children}
    </button>
  );
};
