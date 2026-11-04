import React from 'react';
import { motion } from 'framer-motion';
import { DURATION, EASE, staggerDelay, useMotionPrefs } from '../../lib/motion';

interface RevealProps {
  children: React.ReactNode;
  /** Rang dans la cascade (40 ms par rang, plafonné à 8). */
  index?: number;
  className?: string;
}

/**
 * Apparition d'une section ou d'une carte au chargement : opacité et translation de 12 px,
 * 300 ms, courbe du dashboard du directeur. Joué une fois. Sous prefers-reduced-motion :
 * affichage direct. Ne laisse aucun transform une fois terminé (pas de repère de position fixed).
 */
export const Reveal: React.FC<RevealProps> = ({ children, index = 0, className }) => {
  const { reduce } = useMotionPrefs();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE.out, delay: staggerDelay(index) }}
    >
      {children}
    </motion.div>
  );
};
