import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-surface-subtle text-secondary border-subtle',
    success: 'bg-success-surface text-success-text border-success-border',
    warning: 'bg-warning-surface text-warning-text border-warning-border',
    danger: 'bg-danger-surface text-danger-text border-danger-border',
    info: 'bg-surface-subtle text-primary border-subtle',
    outline: 'bg-surface text-secondary border-default',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
