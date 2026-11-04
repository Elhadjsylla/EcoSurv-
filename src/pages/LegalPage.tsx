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
    const previous = document.title;
    document.title = `${page.title} — EcoSurv`;
    window.scrollTo(0, 0);
    return () => {
      document.title = previous;
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
