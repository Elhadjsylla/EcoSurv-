import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { LegalLinks } from '../components/legal/LegalLinks';
import { getLegalPage } from '../content/legalPages';

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]';

const EMAIL_PATTERN = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

const INTERNAL_LINK_PATTERN = /\[\[([^\]|]+)\|(\/[^\]]*)\]\]/g;

/** Transforme [[texte|/chemin]] en lien interne, puis les adresses e-mail en liens mailto. */
function renderWithMailto(text: string): React.ReactNode[] {
  const chunks = text.split(INTERNAL_LINK_PATTERN);
  // split avec deux groupes : [texte, libellé, chemin, texte, ...]
  const nodes: React.ReactNode[] = [];
  for (let c = 0; c < chunks.length; c += 3) {
    nodes.push(...renderEmails(chunks[c], `t${c}`));
    if (c + 2 < chunks.length) {
      nodes.push(
        <a
          key={`l${c}`}
          href={chunks[c + 2]}
          className={`text-[#1D4ED8] dark:text-blue-400 underline underline-offset-2 rounded ${FOCUS_RING}`}
        >
          {chunks[c + 1]}
        </a>
      );
    }
  }
  return nodes;
}

/** Transforme les adresses e-mail d'un texte en liens mailto. */
function renderEmails(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(EMAIL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={`${keyPrefix}-${i}`}
        href={`mailto:${part}`}
        className={`text-[#1D4ED8] dark:text-blue-400 underline underline-offset-2 break-words rounded ${FOCUS_RING}`}
      >
        {part}
      </a>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  );
}

const SITE_URL = 'https://www.ecosurv.app';

/** Descriptions des pages légales (balise meta description). */
const LEGAL_DESCRIPTIONS: Record<string, string> = {
  'mentions-legales': 'Mentions légales du site EcoSurv, service de gestion scolaire pour les écoles en Mauritanie : éditeur, contact, hébergement.',
  cgu: 'Conditions générales d’utilisation d’EcoSurv, service de gestion scolaire pour les écoles en Mauritanie : comptes, obligations, tarifs, responsabilité.',
  confidentialite: 'Politique de confidentialité d’EcoSurv : données traitées, finalités, durée de conservation et droits des personnes concernées.',
  cookies: 'Information sur les cookies et le stockage local utilisés par le site EcoSurv.',
};

/**
 * Met à jour (ou crée) une balise de l'en-tête et renvoie une fonction qui remet l'état d'origine :
 * valeur précédente si la balise existait, suppression si elle a été créée ici. Jamais de doublon.
 */
function setHeadTag(
  selector: string,
  tag: 'meta' | 'link',
  identity: Record<string, string>,
  attribute: 'content' | 'href',
  value: string
): () => void {
  let element = document.head.querySelector<HTMLElement>(selector);
  const created = !element;
  if (!element) {
    element = document.createElement(tag);
    Object.entries(identity).forEach(([k, v]) => element!.setAttribute(k, v));
    document.head.appendChild(element);
  }
  const previous = element.getAttribute(attribute);
  element.setAttribute(attribute, value);
  return () => {
    if (created) element?.remove();
    else if (previous !== null) element?.setAttribute(attribute, previous);
  };
}

/** Vrai si l'utilisateur vient d'une page de notre site et qu'un retour arrière est possible. */
function cameFromOurSite(): boolean {
  try {
    if (!document.referrer || window.history.length <= 1) return false;
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

interface LegalPageProps {
  slug: string;
}

export const LegalPage: React.FC<LegalPageProps> = ({ slug }) => {
  const page = getLegalPage(slug);

  useEffect(() => {
    if (!page) return;
    const title = `${page.title} — EcoSurv`;
    const description = LEGAL_DESCRIPTIONS[page.slug] ?? `${page.title} du service EcoSurv.`;
    const url = `${SITE_URL}${page.path}`;

    const previousTitle = document.title;
    document.title = title;
    // Une seule balise de chaque : on modifie celle d'index.html, on la crée seulement si elle manque,
    // et on remet les valeurs d'origine (celles de la landing) en quittant la page.
    const restores = [
      setHeadTag('meta[name="description"]', 'meta', { name: 'description' }, 'content', description),
      setHeadTag('link[rel="canonical"]', 'link', { rel: 'canonical' }, 'href', url),
      setHeadTag('meta[property="og:title"]', 'meta', { property: 'og:title' }, 'content', title),
      setHeadTag('meta[property="og:description"]', 'meta', { property: 'og:description' }, 'content', description),
      setHeadTag('meta[property="og:url"]', 'meta', { property: 'og:url' }, 'content', url),
    ];
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
      restores.forEach((restore) => restore());
    };
  }, [page]);

  if (!page) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="/" aria-label="EcoSurv, retour à l'accueil" className={`rounded ${FOCUS_RING}`}>
            <Logo height={28} />
          </a>
          <a
            href="/"
            onClick={(e) => {
              // Arrivé depuis une page de notre site : retour à cette page. Sinon, lien normal vers « / ».
              if (cameFromOurSite()) {
                e.preventDefault();
                window.history.back();
              }
            }}
            className={`inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${FOCUS_RING}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour au site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
          {page.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Dernière mise à jour : {page.updatedAt}
        </p>

        <div className="mt-8 space-y-8">
          {page.sections.map((section, i) => (
            <section key={i} className="space-y-3">
              {section.title && (
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.title}</h2>
              )}
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="text-base leading-relaxed text-slate-700 dark:text-slate-300 break-words">
                  {renderWithMailto(p)}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
                  {section.list.map((item, k) => (
                    <li key={k} className="text-base leading-relaxed text-slate-700 dark:text-slate-300 break-words">
                      {renderWithMailto(item)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-3 text-slate-500 dark:text-slate-400">
          <LegalLinks exclude={[page.slug]} />
          <p className="text-center text-xs">&copy; {new Date().getFullYear()} EcoSurv</p>
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
