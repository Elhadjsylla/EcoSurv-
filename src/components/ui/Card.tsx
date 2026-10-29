import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-md border border-subtle bg-surface p-6 shadow-xs transition-all hover:border-default',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn('text-lg font-bold text-main tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p className={cn('text-sm text-muted', className)} {...props}>
      {children}
    </p>
  );
};
