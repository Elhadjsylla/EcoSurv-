import { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  duration?: number; // en millisecondes
  start?: number;
}

/**
 * Hook d'incrémentation numérique fluide (Count-Up) avec easing cubic ease-out
 * et respect automatique de prefers-reduced-motion.
 * Robuste face aux re-renders parents, aux montages StrictMode, aux rafraîchissements (F5)
 * et aux transitions entre écrans sans retour intempestif à 0.
 */
export function useCountUp(
  target: number,
  optionsOrDuration: number | UseCountUpOptions = {}
) {
  const duration =
    typeof optionsOrDuration === 'number'
      ? optionsOrDuration
      : optionsOrDuration.duration ?? 800;
  const start =
    typeof optionsOrDuration === 'number'
      ? 0
      : optionsOrDuration.start ?? 0;

  const safeTarget = typeof target === 'number' && !isNaN(target) ? target : 0;
  const safeStart = typeof start === 'number' && !isNaN(start) ? start : 0;

  const [count, setCount] = useState<number>(safeStart);

  // Ref contenant la valeur numérique couramment affichée / animée
  const currentValueRef = useRef<number>(safeStart);
  // Ref contenant la cible précédente pour comparer et éviter les relances superflues
  const prevTargetRef = useRef<number | null>(null);

  useEffect(() => {
    // Si la cible n'a pas changé et que le compteur est déjà à cette valeur, ne rien faire
    if (prevTargetRef.current === safeTarget && count === safeTarget) {
      return;
    }

    // Respect strict de prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setCount(safeTarget);
        currentValueRef.current = safeTarget;
        prevTargetRef.current = safeTarget;
        return;
      }
    }

    // Point de départ de la transition :
    // - Si premier montage (prevTargetRef.current === null), démarrer à safeStart (ex: 0)
    // - Si mise à jour de la cible, partir de la valeur courante (évite le saut brusque à 0)
    const fromVal =
      prevTargetRef.current === null ? safeStart : currentValueRef.current;
    prevTargetRef.current = safeTarget;

    const difference = safeTarget - fromVal;

    if (difference === 0) {
      setCount(safeTarget);
      currentValueRef.current = safeTarget;
      return;
    }

    // Gestion du format (entier ou décimal)
    const isDecimal = !Number.isInteger(safeTarget);
    const decimals = isDecimal
      ? Math.min((safeTarget.toString().split('.')[1] || '').length, 2)
      : 0;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / Math.max(duration, 1), 1);

      // Easing cubic ease-out : 1 - (1 - progress)^3
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const rawVal = fromVal + difference * easeOutProgress;
      const currentVal = isDecimal
        ? Number(rawVal.toFixed(decimals))
        : Math.round(rawVal);

      currentValueRef.current = currentVal;
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        currentValueRef.current = safeTarget;
        setCount(safeTarget);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [safeTarget, duration, safeStart]);

  return count;
}
