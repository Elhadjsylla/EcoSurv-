import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, translations, Translations } from './translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRtl: boolean;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'fr',
      t: translations.fr,
      isRtl: false,

      setLanguage: (lang: Language) => {
        const isRtl = lang === 'ar';
        // Set document direction and lang attributes
        if (typeof document !== 'undefined') {
          document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }

        set({
          language: lang,
          t: translations[lang] || translations.fr,
          isRtl,
        });
      },
    }),
    {
      name: 'ecosurv-language',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);
