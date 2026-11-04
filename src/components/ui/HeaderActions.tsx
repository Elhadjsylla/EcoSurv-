import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Rangée d'actions d'un en-tête de page.
 *
 * Sous 640 px : pile ordonnée. L'action principale (classe ACTION_PRIMARY)
 * passe en premier sur toute la largeur, les actions secondaires se rangent
 * dessous sur une grille de deux colonnes égales.
 * À partir de 640 px : rangée horizontale habituelle, dans l'ordre du DOM.
 */
export const HeaderActions: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3',
      className
    )}
  >
    {children}
  </div>
);

/** À poser sur le bouton principal : première ligne, pleine largeur sous 640 px. */
export const ACTION_PRIMARY =
  'col-span-2 order-first sm:order-none sm:col-auto w-full sm:w-auto whitespace-nowrap';

/** À poser sur chaque bouton secondaire : remplit sa colonne, une seule ligne. */
export const ACTION_SECONDARY = 'w-full sm:w-auto whitespace-nowrap px-3 sm:px-4';

/** Bouton secondaire seul sur sa ligne sous 640 px (rangée à un seul secondaire). */
export const ACTION_SECONDARY_FULL =
  'col-span-2 sm:col-auto w-full sm:w-auto whitespace-nowrap';

/**
 * Libellé court sous 640 px, libellé complet au-dessus.
 * Le bouton doit porter un aria-label avec le libellé complet.
 */
export const ActionLabel: React.FC<{ short: string; full: string }> = ({ short, full }) => (
  <>
    <span className="sm:hidden">{short}</span>
    <span className="hidden sm:inline">{full}</span>
  </>
);
