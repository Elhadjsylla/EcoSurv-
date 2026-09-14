import { useEffect } from 'react';
import { useNavigationStore } from '../store/useNavigationStore';

/** Distance horizontale cumulée (px) à partir de laquelle un geste navigue. */
export const SWIPE_THRESHOLD_PX = 80;

/** Le geste doit être au moins deux fois plus horizontal que vertical. */
export const SWIPE_HORIZONTAL_RATIO = 2;

/** Sans événement wheel pendant ce délai, le geste (inertie comprise) est terminé. */
export const SWIPE_GESTURE_IDLE_MS = 150;

export type SwipeDirection = 'back' | 'forward';

type WheelLike = Pick<
  WheelEvent,
  'deltaX' | 'deltaY' | 'deltaMode' | 'ctrlKey' | 'shiftKey' | 'target' | 'timeStamp'
>;

/**
 * Vrai si `target` ou l'un de ses ancêtres peut encore défiler horizontalement
 * dans le sens de `deltaX` (tableau en overflow-x pas encore en butée).
 */
function canScrollHorizontally(target: EventTarget | null, deltaX: number): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.documentElement) {
    if (el.scrollWidth > el.clientWidth) {
      const { overflowX } = getComputedStyle(el);
      if (overflowX === 'auto' || overflowX === 'scroll') {
        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        if (deltaX > 0 ? el.scrollLeft < maxScrollLeft - 1 : el.scrollLeft > 0) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Transforme le flux d'événements wheel en swipes : au plus un appel à
 * `onSwipe` par geste.
 *
 * Un geste qui commence dans un conteneur capable de défiler dans ce sens (ou
 * sous `data-no-nav-swipe`) lui appartient jusqu'à la fin de son inertie : il
 * ne navigue jamais, même si le conteneur arrive en butée en cours de route.
 */
export function createSwipeDetector(onSwipe: (direction: SwipeDirection) => void) {
  let lastEventAt = -Infinity;
  let accumulatedX = 0;
  let accumulatedY = 0;
  let gestureSettled = false;

  return (event: WheelLike) => {
    if (event.timeStamp - lastEventAt > SWIPE_GESTURE_IDLE_MS) {
      accumulatedX = 0;
      accumulatedY = 0;
      gestureSettled = false;
    }
    lastEventAt = event.timeStamp;
    if (gestureSettled) return;

    // Pincement (ctrl), Maj + molette de souris, molettes en lignes/pages : pas un swipe trackpad.
    if (event.ctrlKey || event.shiftKey || event.deltaMode !== 0) return;

    if (
      event.deltaX !== 0 &&
      ((event.target instanceof Element && event.target.closest('[data-no-nav-swipe]')) ||
        canScrollHorizontally(event.target, event.deltaX))
    ) {
      gestureSettled = true;
      return;
    }

    accumulatedX += event.deltaX;
    accumulatedY += event.deltaY;
    if (
      Math.abs(accumulatedX) >= SWIPE_THRESHOLD_PX &&
      Math.abs(accumulatedX) > Math.abs(accumulatedY) * SWIPE_HORIZONTAL_RATIO
    ) {
      gestureSettled = true;
      onSwipe(accumulatedX < 0 ? 'back' : 'forward');
    }
  };
}

/** Swipe horizontal à deux doigts sur trackpad = Précédent / Suivant. */
export function useSwipeNavigation() {
  useEffect(() => {
    const handleWheel = createSwipeDetector((direction) => {
      const { goBack, goForward } = useNavigationStore.getState();
      if (direction === 'back') goBack();
      else goForward();
    });
    // Passif : le défilement natif n'est jamais bloqué.
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);
}
