import { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  duration?: number; // en millisecondes
  start?: number;
}

/**
 * Hook d'incrémentation numérique fluide (Count-Up) avec easing cubic ease-out
 * et respect automatique de prefers-reduced-motion.
 * Réinitialisation propre à chaque montage sans effet résiduel.
 */
export function useCountUp(
  target: number,
  optionsOrDuration: number | UseCountUpOptions = {}
) {
  const options =
    typeof optionsOrDuration === 'number'
      ? { duration: optionsOrDuration }
      : optionsOrDuration;
  const { duration = 800, start = 0 } = options;

  const safeTarget = typeof target === 'number' && !isNaN(target) ? target : 0;
  const safeStart = typeof start === 'number' && !isNaN(start) ? start : 0;

  const [count, setCount] = useState<number>(safeStart);
  const fromValueRef = useRef<number>(safeStart);

  useEffect(() => {
    // Vérification de l'accessibilité : prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setCount(safeTarget);
        fromValueRef.current = safeTarget;
        return;
      }
    }

    const fromVal = fromValueRef.current;
    const difference = safeTarget - fromVal;

    if (difference === 0) {
      setCount(safeTarget);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / Math.max(duration, 1), 1);

      // Easing cubic ease-out : 1 - (1 - progress)^3
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(fromVal + difference * easeOutProgress);

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(safeTarget);
        fromValueRef.current = safeTarget;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [safeTarget, duration]);

  return count;
}
