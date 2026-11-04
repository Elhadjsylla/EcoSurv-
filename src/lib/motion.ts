import { useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';

/**
 * Jetons de mouvement partagés.
 *
 * Reprennent les valeurs déjà en usage dans le dashboard du directeur :
 * courbe cubic-bezier(0.16, 1, 0.3, 1) (index.css : stagger-rise, page-transition-enter,
 * useCountUp, landing), apparition des cartes KPI en 0,25 s avec 0,05 s entre cartes,
 * survol en 0,15 s.
 *
 * Règle : on n'anime que transform et opacity, jamais width, height, top, left,
 * ni une propriété qui force un recalcul de mise en page.
 */

/** Durées en secondes : 120, 200 et 300 ms. */
export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.3,
} as const;

/** Courbes. `out` est la courbe déjà utilisée dans index.css et useCountUp. */
export const EASE = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

/** Ressort court : pastille d'interrupteur, indicateur d'onglet. Pas de rebond marqué. */
export const SPRING_SHORT: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 36,
  mass: 0.8,
};

/** Cascade : 40 ms entre éléments, plafonnée à 8 éléments. */
export const STAGGER = {
  step: 0.04,
  maxItems: 8,
} as const;

export const staggerDelay = (index: number): number =>
  Math.min(Math.max(index, 0), STAGGER.maxItems) * STAGGER.step;

/** Variantes d'une liste en cascade (conteneur + élément). Transform et opacity seulement. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.step, delayChildren: 0 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
};

/** Ouverture d'un menu ou d'un popover : opacité et léger déplacement, 180 ms. */
export const popoverVariants: Variants = {
  closed: { opacity: 0, y: -6, scale: 0.98 },
  open: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE.out } },
};

/**
 * Détecte prefers-reduced-motion.
 * `reduce` vaut true si l'utilisateur demande moins de mouvement ; `transition(t)` renvoie
 * alors une transition instantanée.
 */
export function useMotionPrefs(): {
  reduce: boolean;
  transition: (t: Transition) => Transition;
} {
  const reduce = Boolean(useReducedMotion());
  return {
    reduce,
    transition: (t: Transition) => (reduce ? { duration: 0 } : t),
  };
}
