import React from 'react';
import { cn } from '../../lib/utils';

interface StudentInitialsProps {
  nom: string;
  prenom: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Avatar : une seule teinte (bleu du thème), l'identité de la personne passe par ses initiales.
const COLOR_PALETTES = [
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80',
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
