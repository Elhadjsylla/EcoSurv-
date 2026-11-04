import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { DURATION, EASE, SPRING_SHORT, useMotionPrefs } from '../../lib/motion';

interface ThemeSwitchProps {
  /** true quand le mode sombre est actif. */
  checked: boolean;
  /** Appelé à l'activation (clic, Espace ou Entrée). Ne change rien d'autre. */
  onToggle: () => void;
  className?: string;
}

/**
 * Interrupteur de thème.
 * Piste 44 x 24 px dans une zone tactile de 52 x 44 px. Pastille qui glisse avec un ressort
 * court, icône soleil ou lune qui pivote et fond en fondu. Piste neutre en mode clair,
 * bleu #1D4ED8 quand le mode sombre est actif. Sous prefers-reduced-motion : instantané.
 * Seul l'aspect change : le choix du thème reste celui de useThemeStore.toggleTheme.
 */
export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ checked, onToggle, className }) => {
  const { reduce, transition } = useMotionPrefs();
  const iconTransition = reduce ? { duration: 0 } : { duration: DURATION.base, ease: EASE.out };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Mode sombre"
      onClick={onToggle}
      className={`group relative inline-flex h-11 w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-md focus-halo ${className ?? ''}`}
    >
      <span
        aria-hidden="true"
        className={`relative block h-6 w-11 rounded-full border transition-colors ${
          reduce ? 'duration-0' : 'duration-200'
        } ${
          checked
            ? 'border-[#1D4ED8] bg-[#1D4ED8]'
            : 'border-slate-500 bg-slate-300 group-hover:bg-slate-400/80'
        }`}
      >
        <motion.span
          className="absolute left-[2px] top-[2px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-xs"
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={transition(SPRING_SHORT)}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {checked ? (
              <motion.span
                key="moon"
                className="absolute flex"
                initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                transition={iconTransition}
              >
                <Moon className="h-3 w-3 text-[#1D4ED8]" />
              </motion.span>
            ) : (
              <motion.span
                key="sun"
                className="absolute flex"
                initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                transition={iconTransition}
              >
                <Sun className="h-3 w-3 text-slate-700" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </span>
    </button>
  );
};
