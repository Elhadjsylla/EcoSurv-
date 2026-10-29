# Suivi Technique : Warnings ESLint (react-hooks/exhaustive-deps)

> **Directive ECOSURV** : Ne pas corriger ces avertissements en bloc pour éviter tout risque de boucle infinie de rendus (re-render loop). Chaque cas doit être testé unitairement lors d'une passe dédiée.

---

| N° | Fichier & Ligne | Dépendance signalée | Risque identifié en cas d'ajout naïf |
|---|---|---|---|
| 1 | `src/hooks/useAuth.ts:34` | `fetchProfile` | `fetchProfile` n'est pas stabilisé avec `useCallback`, son ajout direct redéclencherait la vérification de session à chaque render. |
| 2 | `src/hooks/useCountUp.ts:100` | `roundValue` | `roundValue` dépend des options dynamiques du composant compteur. |
| 3 | `src/pages/ConfigPage.tsx:97` | `fetchStaff` | `fetchStaff` déclenche des appels réseau Supabase ; son ajout nécessite un `useCallback` strict pour éviter les boucles d'actualisation de l'annuaire. |
| 4 | `src/pages/EcheancesPage.tsx:104` | `newClasse` | L'effet synchronise les sélecteurs de classe lors de la création d'échéance. |
| 5 | `src/pages/caissier/CaissierJournalPage.tsx:236` | `fetchJournalTransactions` | Fonction asynchrone rechargeant les encaissements de la journée. |
| 6 | `src/pages/enseignant/TeacherClassesPage.tsx:51` | `teacherStudents` | Tableau local recréé au render ; sera assaini avec la migration vers les tables réelles de classes/élèves. |
| 7 | `src/pages/enseignant/TeacherGradesPage.tsx:41` | `teacherStudents` | Tableau local recréé au render ; sera assaini avec la migration vers les tables réelles de notes. |
