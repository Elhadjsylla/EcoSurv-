import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importer les modules de traduction FR
import frCommon from '../locales/fr/common.json';
import frNav from '../locales/fr/nav.json';
import frAuth from '../locales/fr/auth.json';
import frLanding from '../locales/fr/landing.json';
import frDirecteur from '../locales/fr/dashboard-directeur.json';
import frWhatsapp from '../locales/fr/whatsapp-templates.json';
import frPdf from '../locales/fr/documents-pdf.json';

// Importer les modules de traduction AR
import arCommon from '../locales/ar/common.json';
import arNav from '../locales/ar/nav.json';
import arAuth from '../locales/ar/auth.json';
import arLanding from '../locales/ar/landing.json';
import arDirecteur from '../locales/ar/dashboard-directeur.json';
import arWhatsapp from '../locales/ar/whatsapp-templates.json';
import arPdf from '../locales/ar/documents-pdf.json';

// Importer les modules de traduction EN
import enCommon from '../locales/en/common.json';
import enNav from '../locales/en/nav.json';
import enAuth from '../locales/en/auth.json';
import enLanding from '../locales/en/landing.json';
import enDirecteur from '../locales/en/dashboard-directeur.json';
import enWhatsapp from '../locales/en/whatsapp-templates.json';
import enPdf from '../locales/en/documents-pdf.json';

export const defaultNS = 'common';

export const resources = {
  fr: {
    common: frCommon,
    nav: frNav,
    auth: frAuth,
    landing: frLanding,
    directeur: frDirecteur,
    whatsapp: frWhatsapp,
    pdf: frPdf,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    auth: arAuth,
    landing: arLanding,
    directeur: arDirecteur,
    whatsapp: arWhatsapp,
    pdf: arPdf,
  },
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    landing: enLanding,
    directeur: enDirecteur,
    whatsapp: enWhatsapp,
    pdf: enPdf,
  },
} as const;

// Déterminer la langue initiale stockée
const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const persisted = localStorage.getItem('ecosurv-language');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const lang = parsed?.state?.language;
        if (lang === 'ar' || lang === 'en' || lang === 'fr') return lang;
      }
    } catch {
      // Ignorer
    }
  }
  return 'fr';
};

const initialLang = getInitialLanguage();

// Initialisation i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'fr',
    defaultNS,
    interpolation: {
      escapeValue: false, // React gère déjà l'échappement XSS
    },
    react: {
      useSuspense: false,
    },
  });

// Synchronisation automatique de la direction RTL et de la balise HTML lang
export const applyDocumentDirection = (lang: string) => {
  if (typeof document !== 'undefined') {
    const isRtl = lang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
};

applyDocumentDirection(initialLang);

i18n.on('languageChanged', (lng) => {
  applyDocumentDirection(lng);
});

export default i18n;
