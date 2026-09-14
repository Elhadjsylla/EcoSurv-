import React, { ReactNode, RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/** Marge minimale entre l'infobulle et les bords de la fenêtre. */
const VIEWPORT_MARGIN = 8;
/** Espace entre l'infobulle et l'élément qu'elle pointe. */
const TRIGGER_GAP = 8;
/** La flèche reste à distance des coins arrondis de la bulle. */
const ARROW_EDGE_MARGIN = 10;

const OPPOSITE_SIDE: Record<TooltipSide, TooltipSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function fitsOnSide(side: TooltipSide, anchor: DOMRect, width: number, height: number) {
  switch (side) {
    case 'top':
      return anchor.top - TRIGGER_GAP - height >= VIEWPORT_MARGIN;
    case 'bottom':
      return anchor.bottom + TRIGGER_GAP + height <= window.innerHeight - VIEWPORT_MARGIN;
    case 'left':
      return anchor.left - TRIGGER_GAP - width >= VIEWPORT_MARGIN;
    case 'right':
      return anchor.right + TRIGGER_GAP + width <= window.innerWidth - VIEWPORT_MARGIN;
  }
}

interface TooltipBubbleProps {
  content: ReactNode;
  /** Élément pointé par la bulle, relu à chaque frame. */
  anchorRef: RefObject<Element | null>;
  side?: TooltipSide;
  id?: string;
}

/**
 * Bulle d'infobulle de référence d'EcoSurv : fond sombre, texte clair, coins
 * arrondis et flèche pointant vers l'élément ancré.
 *
 * Rendue dans document.body en position fixe : jamais rognée par un parent en
 * overflow (sidebar, cartes, tableaux). Placée du côté demandé, ou du côté
 * opposé si la place manque, et toujours recadrée dans la fenêtre.
 */
export const TooltipBubble: React.FC<TooltipBubbleProps> = ({ content, anchorRef, side = 'top', id }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    let frame = 0;

    // Recalé à chaque frame : suit le scroll et les animations de l'élément pointé.
    const place = () => {
      const anchor = anchorRef.current;
      const bubble = bubbleRef.current;
      const arrow = arrowRef.current;
      if (anchor && bubble && arrow) {
        const rect = anchor.getBoundingClientRect();
        const { offsetWidth: width, offsetHeight: height } = bubble;
        const placement =
          fitsOnSide(side, rect, width, height) || !fitsOnSide(OPPOSITE_SIDE[side], rect, width, height)
            ? side
            : OPPOSITE_SIDE[side];

        if (placement === 'top' || placement === 'bottom') {
          const center = rect.left + rect.width / 2;
          const left = clamp(center - width / 2, VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - width);
          bubble.style.left = `${left}px`;
          bubble.style.top = `${placement === 'top' ? rect.top - TRIGGER_GAP - height : rect.bottom + TRIGGER_GAP}px`;
          arrow.style.left = `${clamp(center - left, ARROW_EDGE_MARGIN, width - ARROW_EDGE_MARGIN)}px`;
          arrow.style.top = placement === 'top' ? '100%' : '0';
        } else {
          const middle = rect.top + rect.height / 2;
          const top = clamp(middle - height / 2, VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN - height);
          bubble.style.top = `${top}px`;
          bubble.style.left = `${placement === 'right' ? rect.right + TRIGGER_GAP : rect.left - TRIGGER_GAP - width}px`;
          arrow.style.top = `${clamp(middle - top, ARROW_EDGE_MARGIN, height - ARROW_EDGE_MARGIN)}px`;
          arrow.style.left = placement === 'right' ? '0' : '100%';
        }
        bubble.dataset.side = placement;
      }
      frame = requestAnimationFrame(place);
    };

    place();
    return () => cancelAnimationFrame(frame);
  }, [anchorRef, side]);

  return createPortal(
    <div
      ref={bubbleRef}
      id={id}
      role="tooltip"
      className="pointer-events-none fixed left-0 top-0 z-60 w-max max-w-64 rounded-lg bg-slate-900 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-white shadow-lg"
    >
      {content}
      <span
        ref={arrowRef}
        aria-hidden="true"
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-900 dark:bg-slate-700"
      />
    </div>,
    document.body
  );
};

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Côté préféré (au-dessus par défaut) ; bascule du côté opposé si la place manque. */
  side?: TooltipSide;
  /** N'ouvre pas l'infobulle, par exemple quand le libellé est déjà visible. */
  disabled?: boolean;
  /** Balise du déclencheur : 'div' pour envelopper un bloc (titre, paragraphe). */
  as?: 'span' | 'div';
  className?: string;
}

/**
 * Infobulle de l'application, à utiliser à la place de l'attribut `title` natif.
 *
 * Enveloppe l'élément survolé et affiche la bulle de référence au survol ou au
 * focus clavier ; la bulle pointe vers le premier élément enfant du déclencheur.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  disabled = false,
  as: Trigger = 'span',
  className,
}) => {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const anchorRef = useRef<Element | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isVisible = isOpen && !disabled;

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const open = () => {
    anchorRef.current = triggerRef.current?.firstElementChild ?? triggerRef.current;
    setIsOpen(true);
  };
  // Un clic masque aussi l'infobulle, comme le title natif.
  const close = () => setIsOpen(false);

  return (
    <>
      <Trigger
        ref={(node: HTMLElement | null) => {
          triggerRef.current = node;
        }}
        data-tooltip=""
        className={cn('inline-flex', className)}
        aria-describedby={isVisible ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onMouseDown={close}
        onFocus={(event: React.FocusEvent<HTMLElement>) => {
          if ((event.target as Element).matches(':focus-visible')) open();
        }}
        onBlur={close}
      >
        {children}
      </Trigger>
      {isVisible && <TooltipBubble id={id} content={content} anchorRef={anchorRef} side={side} />}
    </>
  );
};

/** Contenu d'infobulle composé d'un libellé et d'un compteur ou statut (badge). */
export const TooltipLabel: React.FC<{ label: string; badge?: string }> = ({ label, badge }) => (
  <span className="flex items-center gap-2">
    {label}
    {badge && <span className="rounded-full bg-white/15 px-1.5 text-[10px] font-bold">{badge}</span>}
  </span>
);
