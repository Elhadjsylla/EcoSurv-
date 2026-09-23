# Internationalisation (i18n) — EcoSurv

> **Statut actuel** : ⏸️ **EN PAUSE** (Application verrouillée à 100% en Français par défaut).
> **Feature Flag** : `I18N_PAUSED = true` dans `src/i18n/useLanguageStore.ts`.

---

## 📌 État d'avancement du projet i18n

### ✅ Ce qui a été réalisé (Phase 1 — Fondation & BDD) :
1. **Architecture modulaire `/src/locales/`** : Structure prête par domaine (`common`, `nav`, `auth`, `landing`, `dashboard-directeur`, `whatsapp-templates`, `documents-pdf`) pour le Français (FR), l'Arabe (AR) et l'Anglais (EN).
2. **Moteur i18next & Fallback** : Configuration centralisée dans `src/i18n/i18n.ts` avec prise en charge native des 6 formes de pluriel arabe (CLDR) et fallback automatique vers le français.
3. **Migration Supabase BDD** : `supabase/migrations/20260923120000_preferences_langue.sql` prête pour persister `langue_preferee` sur `profils` et `langue_parent` sur `eleves`.
4. **Marquage pour revue humaine** : Les textes officiels (quittances, bulletins, templates WhatsApp) sont tagués `_needs_human_review: true`.

---

## 🚀 Comment réactiver le projet lors de la reprise ?

1. Dans [`src/i18n/useLanguageStore.ts`](file:///c:/Users/LENOVO%20T480S/OneDrive/Bureau/EcoSurv/src/i18n/useLanguageStore.ts), passer la constante à `false` :
   ```typescript
   export const I18N_PAUSED = false;
   ```
2. **Prochaine étape à reprendre : Phase 2 (Landing Page & Authentification)** :
   - Brancher l'intégralité des sections de `LandingPage.tsx` (FAQ, simulateur ROI, parcours timeline, CTA final et footer) sur les clés JSON de `landing.json`.
   - Brancher les formulaires de connexion (`LoginPage.tsx`) et d'inscription (`RegisterPage.tsx`) sur `auth.json`.
   - Tester le rendu visuel dans les 3 langues avant d'enchaîner sur la Phase 3 (Dashboard Directeur).
