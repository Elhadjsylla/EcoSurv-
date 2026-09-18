import { useState, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export interface UseCountUpOptions {
  duration?: number; // en secondes ou millisecondes (défaut: 850ms)
  start?: number;    // valeur de départ (défaut: 0)
  decimals?: number; // nombre explicite de décimales (auto-détecté si non renseigné)
}

/**
 * Hook d'incrémentation numérique fluide (Count-Up) motorisé par Framer Motion.
 * Utilise la même courbe d'animation, fluidité et physique que la Landing Page.
 */
export function useCountUp(
  target: number | undefined | null,
  optionsOrDuration: number | UseCountUpOptions = {}
): number {
  const rawDuration =
    typeof optionsOrDuration === 'number'
      ? optionsOrDuration
      : optionsOrDuration.duration ?? 850;
  // Conversion transparente ms -> s si > 10
  const durationSec = rawDuration > 10 ? rawDuration / 1000 : rawDuration;

  const start =
    typeof optionsOrDuration === 'number'
      ? 0
      : optionsOrDuration.start ?? 0;

  const explicitDecimals =
    typeof optionsOrDuration === 'object' ? optionsOrDuration.decimals : undefined;

  const safeTarget =
    typeof target === 'number' && !isNaN(target) && isFinite(target) ? target : 0;
  const safeStart =
    typeof start === 'number' && !isNaN(start) && isFinite(start) ? start : 0;

  const [count, setCount] = useState<number>(safeStart);
  const currentValRef = useRef<number>(safeStart);
  const prevTargetRef = useRef<number | null>(null);

  const decimals =
    explicitDecimals !== undefined
      ? explicitDecimals
      : !Number.isInteger(safeTarget)
      ? Math.min((safeTarget.toString().split('.')[1] || '').length, 2)
      : 0;

  const roundValue = (val: number): number => {
    if (decimals > 0) {
      const factor = Math.pow(10, decimals);
      return Math.round(val * factor) / factor;
    }
    return Math.round(val);
  };

  useEffect(() => {
    // 1. Accessibilité prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValRef.current = safeTarget;
      setCount(safeTarget);
      prevTargetRef.current = safeTarget;
      return;
    }

    // 2. Si déjà stabilisé à la cible, ne rien faire
    if (prevTargetRef.current === safeTarget && currentValRef.current === safeTarget) {
      return;
    }

    const fromVal =
      prevTargetRef.current === null ? safeStart : currentValRef.current;
    prevTargetRef.current = safeTarget;

    const difference = safeTarget - fromVal;
    if (difference === 0) {
      currentValRef.current = safeTarget;
      setCount(safeTarget);
      return;
    }

    // Animation via framer-motion avec la même courbe et réactivité que la Landing Page
    const controls = animate(fromVal, safeTarget, {
      duration: durationSec,
      ease: [0.16, 1, 0.3, 1], // Courbe de transition identique à la landing page
      onUpdate: (latest) => {
        const rounded = roundValue(latest);
        currentValRef.current = rounded;
        setCount(rounded);
      },
      onComplete: () => {
        currentValRef.current = safeTarget;
        setCount(safeTarget);
      },
    });

    return () => {
      controls.stop();
    };
  }, [safeTarget, durationSec, safeStart, decimals]);

  return count;
}
