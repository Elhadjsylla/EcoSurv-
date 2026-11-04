import React from 'react';
import { LEGAL_PAGES, type LegalSlug } from '../../content/legalPages';

interface LegalLinksProps {
  /** Pages à ne pas afficher (par exemple la page courante). */
  exclude?: LegalSlug[];
  /** Ouvre les liens dans un nouvel onglet. */
  newTab?: boolean;
  /** Classes du conteneur ; la couleur du texte est héritée de ce conteneur. */
  className?: string;
}

/**
 * Ligne de liens vers les pages légales. Liens ordinaires (rechargement de page) :
 * ces pages sont publiques et indépendantes de l'état de navigation de l'application.
 */
export const LegalLinks: React.FC<LegalLinksProps> = ({ exclude = [], newTab = false, className = '' }) => {
  const pages = LEGAL_PAGES.filter((p) => !exclude.includes(p.slug));
  return (
    <nav
      aria-label="Informations légales"
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs ${className}`}
    >
      {pages.map((p) => (
        <a
          key={p.slug}
          href={p.path}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
        >
          {p.linkLabel}
        </a>
      ))}
    </nav>
  );
};
