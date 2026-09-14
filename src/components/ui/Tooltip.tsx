import React, { ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/** Marge minimale entre l'infobulle et les bords de la fenêtre. */
const VIEWPORT_MARGIN = 8;
/** Espace entre le bas de l'infobulle et le haut du déclencheur. */
const TRIGGER_GAP = 8;
/** La flèche reste à distance des coins arrondis de la bulle. */
const ARROW_EDGE_MARGIN = 10;

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Infobulle affichée au-dessus de son déclencheur, avec une flèche pointant vers lui.
 *
 * Rendue dans document.body en position fixe : jamais rognée par un parent en
 * overflow-hidden (cartes KPI), et toujours au-dessus du déclencheur plutôt que
 * sous le curseur comme l'attribut `title` natif, qui recouvrait le contenu.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) return;
    let frame = 0;

    // Recalé à chaque frame : suit le scroll et les animations de survol de la carte.
    const place = () => {
      const trigger = triggerRef.current;
      const bubble = bubbleRef.current;
      const arrow = arrowRef.current;
      if (trigger && bubble && arrow) {
        const rect = trigger.getBoundingClientRect();
        const width = bubble.offsetWidth;
        const center = rect.left + rect.width / 2;
        const left = Math.min(
          Math.max(center - width / 2, VIEWPORT_MARGIN),
          window.innerWidth - VIEWPORT_MARGIN - width
        );
        bubble.style.left = `${left}px`;
        bubble.style.top = `${rect.top - TRIGGER_GAP}px`;
        arrow.style.left = `${Math.min(Math.max(center - left, ARROW_EDGE_MARGIN), width - ARROW_EDGE_MARGIN)}px`;
      }
      frame = requestAnimationFrame(place);
    };

    place();
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex', className)}
        aria-describedby={isOpen ? id : undefined}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        {children}
      </span>
      {isOpen &&
        createPortal(
          <div
            ref={bubbleRef}
            id={id}
            role="tooltip"
            className="pointer-events-none fixed left-0 top-0 z-50 w-max max-w-64 -translate-y-full rounded-lg bg-slate-900 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-white shadow-lg"
          >
            {content}
            <span
              ref={arrowRef}
              aria-hidden="true"
              className="absolute top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-900 dark:bg-slate-700"
            />
          </div>,
          document.body
        )}
    </>
  );
};
