import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { applyDocumentDirection } from './i18n';
import { Language, translations, Translations } from './translations';
import { supabase } from '../lib/supabase';

/**
 * FEATURE FLAG : Mise en pause de l'internationalisation multilingue.
 * - true  : L'application est strictement verrouillée en Français par défaut (sélecteur masqué, dir='ltr').
 * - false : Active le support multilingue complet (Français / Arabe RTL / Anglais).
 */
export const I18N_PAUSED = true;

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
        // Si le projet i18n est en pause, forcer le français
        const targetLang = I18N_PAUSED ? 'fr' : lang;
        const isRtl = targetLang === 'ar';

        // 1. Appliquer le sens RTL / LTR sur le document
        applyDocumentDirection(targetLang);

        // 2. Notifier le moteur i18next
        i18n.changeLanguage(targetLang);

        // 3. Persister dans le store local
        set({
          language: targetLang,
          t: translations[targetLang] || translations.fr,
          isRtl,
        });

        // 4. Synchroniser avec Supabase en arrière-plan si utilisateur connecté (actif hors pause)
        if (!I18N_PAUSED) {
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase.rpc('mettre_a_jour_langue_profil', { p_langue: targetLang });
                if (error) {
                  await supabase.from('profils').update({ langue_preferee: targetLang }).eq('id', user.id);
                }
              }
            } catch {
              // Ignorer si hors-ligne ou non connecté
            }
          })();
        }
      },
    }),
    {
      name: 'ecosurv-language',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Forcer le français au rechargement si en pause
          const activeLang = I18N_PAUSED ? 'fr' : state.language;
          applyDocumentDirection(activeLang);
          i18n.changeLanguage(activeLang);
          if (I18N_PAUSED && state.language !== 'fr') {
            state.language = 'fr';
            state.isRtl = false;
            state.t = translations.fr;
          }
        }
      },
    }
  )
);
