# GIT_RULES.md — Convention Git du projet EcoSurv

> Document destiné à tout agent (IA ou humain) qui intervient sur ce dépôt.
> Lis ce fichier avant tout commit, toute branche, ou toute PR.

---

## 1. Identité du projet

| Champ | Valeur |
|-------|--------|
| Nom produit | **EcoSurv** |
| Type | SaaS multi-tenant de gestion de scolarité pour écoles privées (Mauritanie) |
| Contributeurs | Elhadj SYLLA (technique) — Babacar SY (produit/business, non-codeur) |
| Agents IA | Gemini (frontend, via Antigravity) · Claude Code (backend, via Antigravity) |

---

## 2. Structure des branches

```
main                    ← toujours déployable, jamais de commit direct
 └─ dev                 ← branche d'intégration, base de toutes les features
     ├─ feat/xxx         ← une fonctionnalité
     ├─ fix/xxx           ← une correction de bug
     ├─ chore/xxx         ← tâche technique sans impact fonctionnel (deps, config)
     └─ design/xxx        ← intégration d'un écran issu de Stitch
```

### Règles

- **`main`** : reflète toujours ce qui est en production. Aucun commit direct. Seules les fusions depuis `dev` (ou un hotfix validé) y arrivent.
- **`dev`** : branche de travail courante. C'est là que les features convergent avant d'aller en production.
- **Toute nouvelle tâche = une nouvelle branche** créée depuis `dev`, jamais depuis `main` directement (sauf hotfix critique en prod, voir §6).
- Une branche = un sujet. Ne pas mélanger une fonctionnalité et un refactor sans rapport dans la même branche.
- **Pas de branche empilée sur une branche non mergée.** Une branche part de `dev` à jour et n'hérite que de ce qui y est déjà intégré. Si une tâche dépend d'un travail pas encore mergé dans `dev`, la dépendance est mentionnée explicitement dans la PR (section « Dépendances »), et la PR n'est mergée qu'une fois cette dépendance intégrée dans `dev`.
- **Vérification au démarrage de chaque tâche** : l'agent exécute `git fetch` puis `git log dev..HEAD`, consulte les PR ouvertes, et signale tout travail non intégré dans `dev` avant de créer sa branche.

> Pourquoi : le 14/09/2026, les PR #2 (navigation) et #3 (cartes KPI) visaient `feat/fix-ui-bugs-2` au lieu de `dev`. Mergées dans cette branche juste après qu'elle a elle-même été mergée dans `dev`, elles n'ont jamais atteint `dev` : la fonctionnalité semblait avoir « disparu ».

### Nommage des branches

```
feat/echeances-paiement
feat/portail-parent-absences
fix/rappel-sms-double-envoi
chore/upgrade-supabase-client
design/dashboard-directeur-desktop
```

Toujours en anglais ou en français, mais rester cohérent (ce projet utilise le français pour les noms de branches liés au métier).

---

## 3. Convention de commits

Format inspiré des *Conventional Commits*, adapté à l'équipe :

```
<type>: <description courte au présent, en français>

[corps optionnel : pourquoi ce changement, pas juste quoi]
```

### Types autorisés

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité visible pour l'utilisateur |
| `fix` | Correction de bug |
| `design` | Intégration ou ajustement d'un écran issu de Stitch |
| `refactor` | Changement de structure du code sans changement de comportement |
| `chore` | Dépendances, configuration, tâches de maintenance |
| `docs` | Documentation uniquement (ce fichier inclus) |
| `test` | Ajout ou correction de tests |
| `security` | Correction ou renforcement lié à la sécurité (voir SECURITY_RULES.md) |

### Exemples

```
feat: ajout du dashboard directeur avec stats temps réel
fix: corrige le double envoi de rappel SMS à J-1
design: intègre l'écran portail parent (référence Stitch)
security: ajoute policy RLS manquante sur la table paiements
chore: met à jour supabase-js vers la dernière version
```

**Un commit = un sujet.** Ne pas entasser plusieurs fonctionnalités sans lien dans un seul commit — ça rend impossible de revenir en arrière proprement.

---

## 4. Pull Requests

Même à deux (Elhadj + agents IA), les PR restent obligatoires pour tout ce qui part vers `dev` ou `main` — c'est la trace qui permet à Elhadj de relire, après coup, ce que les agents IA ont intégré.

### Règles

1. Toute branche `feat/`, `fix/`, `design/` passe par une PR vers `dev`, jamais de merge direct en ligne de commande.
2. La description de la PR doit répondre à trois questions minimum :
   - Qu'est-ce que ça change ?
   - Comment le tester ?
   - Y a-t-il un impact sur la sécurité ou les données (voir SECURITY_RULES.md) ?
3. **Un agent IA (Gemini/Claude Code) peut merger lui-même ses propres PR sur `dev`, sans attendre de validation préalable.** La revue humaine par Elhadj se fait **après coup, de façon asynchrone**, pas avant le merge. En contrepartie, les garde-fous ci-dessous sont obligatoires.
4. Merge en `dev` → mode **squash** (un commit propre par fonctionnalité dans l'historique de `dev`).
5. Merge de `dev` vers `main` → mode **merge commit** classique, **fait manuellement par Elhadj, sur sa décision**. Aucun agent ne merge sur `main`.

### Garde-fous du merge par un agent

1. **Vérifier le contenu avant de merger** : `git fetch` puis `git log dev..HEAD` sur sa propre branche, pour confirmer qu'elle contient bien tout ce qui est attendu et rien d'inattendu (commit oublié, commits d'une autre branche). En cas d'écart, ne pas merger et le signaler.
2. **Squash merge uniquement**, jamais de merge commit fourre-tout. Le message du commit squash résume clairement ce qui a été intégré (titre au format du §3, numéro de PR, principaux changements), pour faciliter la revue a posteriori.
3. **Jamais sur `main`** : l'agent ne merge que sur `dev`. `main` reste réservé au merge manuel depuis `dev`, décidé par Elhadj.
4. **Migrations destructrices inchangées** : toute migration de base de données destructrice (`DROP`, `TRUNCATE`, `DELETE` massif) reste interdite sans confirmation explicite préalable d'Elhadj — y compris pour merger une PR qui en contient une. Ce point ne dépend pas de la règle de merge.
5. **Compte rendu après chaque merge** : l'agent signale explicitement dans le chat ce qui vient d'être mergé (PR, commit squash) et un résumé des fichiers touchés.

---

## 5. Fichiers à ne jamais committer

- `.env`, `.env.local` et toute variable contenant une clé Supabase `service_role`
- Tout fichier contenant des données réelles d'élèves ou de parents (même en test)
- Les exports bruts de Stitch contenant potentiellement des données de démonstration sensibles

Un `.gitignore` à jour doit couvrir ces cas dès l'initialisation du dépôt. Voir `SECURITY_RULES.md` pour le détail des clés et secrets.

---

## 6. Cas particulier — Hotfix en production

Si un bug critique bloque une école cliente en production :

1. Créer une branche `hotfix/xxx` depuis `main` (pas depuis `dev`).
2. Corriger, tester, ouvrir une PR vers `main`.
3. Une fois mergé en `main` et déployé, **répercuter immédiatement le même correctif dans `dev`** (cherry-pick ou merge de `main` vers `dev`) pour éviter de le perdre au prochain déploiement.

---

## 7. Invariants à ne jamais casser

1. Jamais de commit direct sur `main`.
2. Jamais de merge sans PR, même pour une correction "évidente".
3. Un agent IA ne merge jamais sur `main`. Sur `dev`, il ne merge que ses propres PR, en squash, en respectant les garde-fous du §4 ; la revue humaine se fait a posteriori.
4. Aucun secret, clé API, ou donnée élève/parent réelle dans l'historique Git.
5. Un commit = un sujet clair, décrit en français, avec le bon préfixe de type.
6. Aucune migration destructrice (`DROP`, `TRUNCATE`, `DELETE` massif) sans confirmation explicite préalable d'Elhadj.
