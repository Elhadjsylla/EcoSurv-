import { useState, useEffect } from 'react';

export interface UseCountUpOptions {
  duration?: number; // en millisecondes
  start?: number;
}

/**
 * Hook d'incrémentation numérique fluide (Count-Up) avec easing ease-out
 * et respect automatique de prefers-reduced-motion.
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
  const [count, setCount] = useState<number>(start);

  useEffect(() => {
    // Vérification de l'accessibilité : prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setCount(target);
        return;
      }
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const startValue = count;
    const difference = target - startValue;

    if (difference === 0) return;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing cubic ease-out : 1 - Math.pow(1 - progress, 3)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startValue + difference * easeOutProgress);

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration]);

  return count;
}
