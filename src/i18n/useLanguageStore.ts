import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { applyDocumentDirection } from './i18n';
import { Language, translations, Translations } from './translations';
import { supabase } from '../lib/supabase';

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
        
        // 1. Appliquer le sens RTL / LTR sur le document
        applyDocumentDirection(lang);

        // 2. Notifier le moteur i18next
        i18n.changeLanguage(lang);

        // 3. Persister dans le store local
        set({
          language: lang,
          t: translations[lang] || translations.fr,
          isRtl,
        });

        // 4. Synchroniser avec Supabase en arrière-plan si utilisateur connecté
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { error } = await supabase.rpc('mettre_a_jour_langue_profil', { p_langue: lang });
              if (error) {
                // Fallback direct sur update si RPC pas encore exécuté en remote
                await supabase.from('profils').update({ langue_preferee: lang }).eq('id', user.id);
              }
            }
          } catch {
            // Ignorer si hors-ligne ou non connecté
          }
        })();
      },
    }),
    {
      name: 'ecosurv-language',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDocumentDirection(state.language);
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
