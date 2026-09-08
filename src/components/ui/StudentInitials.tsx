import React from 'react';
import { cn } from '../../lib/utils';

interface StudentInitialsProps {
  nom: string;
  prenom: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_PALETTES = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-slate-100 text-slate-800 border-slate-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-sky-100 text-sky-800 border-sky-200',
];

export const StudentInitials: React.FC<StudentInitialsProps> = ({
  nom,
  prenom,
  className,
  size = 'md',
}) => {
  // Calcul déterministe d'une couleur d'avatar à partir du nom
  const charCodeSum = (nom + prenom).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = COLOR_PALETTES[charCodeSum % COLOR_PALETTES.length];

  const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs font-semibold',
    md: 'h-9 w-9 text-xs font-bold',
    lg: 'h-11 w-11 text-sm font-bold',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border shadow-2xs select-none shrink-0',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
};
