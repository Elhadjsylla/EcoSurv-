import { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  duration?: number; // en millisecondes (défaut: 800ms)
  start?: number;    // valeur de départ (défaut: 0)
  decimals?: number; // nombre explicite de décimales (auto-détecté si non renseigné)
}

/**
 * Hook d'incrémentation numérique fluide (Count-Up) avec easing cubic ease-out.
 *
 * Résolution des problématiques de cycle de vie React :
 * 1. Montage & rafraîchissement (F5) : S'anime de manière déterministe et fluide de `start` vers `target`.
 * 2. Données asynchrones (Supabase / Query) : Si la valeur cible passe de 0/undefined
 *    à sa valeur réelle après le chargement, l'animation démarre proprement sans freeze.
 * 3. Re-renders parents fréquents : Si la cible reste identique, l'animation en cours
 *    N'EST PAS interrompue, annulée ni relancée depuis 0.
 * 4. Changement dynamique de cible (ex. encaissement caisse) : Transition fluide
 *    depuis la valeur actuellement affichée vers la nouvelle cible, sans saut brusque à 0.
 * 5. Accessibilité : Respect strict de `prefers-reduced-motion` (affichage immédiat sans transition).
 * 6. Précision : Gestion impeccable des entiers et des décimales (sans résidu binaire à virgule flottante).
 */
export function useCountUp(
  target: number | undefined | null,
  optionsOrDuration: number | UseCountUpOptions = {}
): number {
  const duration =
    typeof optionsOrDuration === 'number'
      ? optionsOrDuration
      : optionsOrDuration.duration ?? 800;
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

  // Valeur numérique affichée dans le state React
  const [count, setCount] = useState<number>(safeStart);

  // Valeur animée en temps réel (évite les fermetures obsolètes de state)
  const currentValRef = useRef<number>(safeStart);
  // Cible précédente pour détecter les vrais changements de cible
  const prevTargetRef = useRef<number | null>(null);
  // Identifiant de la frame d'animation active
  const animFrameIdRef = useRef<number | null>(null);

  // Détection du format (entier ou décimal)
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
    // 1. Prise en compte de prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValRef.current = safeTarget;
      setCount(safeTarget);
      prevTargetRef.current = safeTarget;
      return;
    }

    // 2. Si la cible n'a pas changé et que la valeur est déjà stabilisée à cette cible,
    // ne rien faire.
    if (prevTargetRef.current === safeTarget && currentValRef.current === safeTarget) {
      return;
    }

    // 3. Détermination de la valeur de départ :
    // - Au premier montage (prevTargetRef.current === null), démarrer à safeStart (souvent 0).
    // - Si la cible change (ex: arrivée des données Supabase ou encaissement),
    //   partir de la valeur actuelle affichée pour une transition fluide sans saut.
    const fromVal =
      prevTargetRef.current === null ? safeStart : currentValRef.current;
    prevTargetRef.current = safeTarget;

    const difference = safeTarget - fromVal;

    // Si la cible est déjà atteinte ou aucune différence, synchroniser directement
    if (difference === 0) {
      currentValRef.current = safeTarget;
      setCount(safeTarget);
      return;
    }

    // Annuler toute animation précédente encore active
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    let startTime: number | null = null;
    const animDuration = Math.max(duration, 1);

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animDuration, 1);

      // Easing cubic ease-out : 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = fromVal + difference * easeOut;
      const rounded = roundValue(current);

      currentValRef.current = rounded;
      setCount(rounded);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(step);
      } else {
        currentValRef.current = safeTarget;
        setCount(safeTarget);
        animFrameIdRef.current = null;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [safeTarget, duration, safeStart, decimals]);

  return count;
}
