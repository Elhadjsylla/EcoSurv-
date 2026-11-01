import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Logo } from '../ui/Logo';

export const AUTH_SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Motif de croix très discret (pas de dégradé), tuile de 48 px : le calque qui le porte
// glisse d'une tuile en boucle (keyframes register-drift dans index.css), ce qui reste continu.
const PLUS_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 20v8M20 24h8' stroke='%23F8FAFC' stroke-opacity='0.07' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

/**
 * Variantes d'entrée du panneau de gauche : les éléments arrivent depuis la gauche,
 * un par un. En mouvement réduit : simple fondu.
 */
export const useAuthPanelVariants = () => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const panelVariants: Variants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.15, staggerChildren: 0.09 } },
  };
  const panelItemVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { opacity: 0, x: -28 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: AUTH_SMOOTH_EASE } },
      };
  return { shouldReduceMotion, panelVariants, panelItemVariants };
};

interface AuthAsideProps {
  heading: React.ReactNode;
  description: string;
  /** Contenu sous la description (liste d'étapes, de rôles…) : ses éléments utilisent panelItemVariants. */
  children?: React.ReactNode;
  footer?: string;
}

/**
 * Panneau de gauche des pages de connexion et d'inscription (grands écrans) : toujours
 * sombre. Tailles et espacements suivent la hauteur de la fenêtre (vh) pour que tout
 * reste visible sans défilement sur un écran peu haut ; au pire, le panneau défile.
 */
export const AuthAside: React.FC<AuthAsideProps> = ({ heading, description, children, footer }) => {
  const { panelVariants, panelItemVariants } = useAuthPanelVariants();

  return (
    <aside
      data-testid="auth-aside"
      className="relative hidden lg:flex lg:sticky lg:top-0 lg:h-[100dvh] overflow-hidden bg-slate-950 text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 motion-safe:animate-[register-drift_14s_linear_infinite]"
        style={{ backgroundImage: PLUS_PATTERN }}
      />

      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="relative flex w-full flex-col gap-6 overflow-y-auto px-12 py-[clamp(1.25rem,5vh,3.5rem)] xl:px-16"
      >
        <motion.div variants={panelItemVariants} className="shrink-0">
          <Logo variant="inverse" height={34} />
        </motion.div>

        <div className="my-auto flex flex-col gap-[clamp(1.25rem,4vh,2rem)]">
          <div className="space-y-[clamp(0.75rem,2.5vh,1.25rem)]">
            <motion.h2
              variants={panelItemVariants}
              className="text-[clamp(1.75rem,5vh,3rem)] font-extrabold leading-[1.1] tracking-tight"
            >
              {heading}
            </motion.h2>
            <motion.p
              variants={panelItemVariants}
              className="max-w-md text-[clamp(0.875rem,2vh,1rem)] leading-relaxed text-slate-400"
            >
              {description}
            </motion.p>
          </div>

          {children}
        </div>

        {footer && (
          <motion.p variants={panelItemVariants} className="shrink-0 text-xs text-slate-500">
            {footer}
          </motion.p>
        )}
      </motion.div>
    </aside>
  );
};
