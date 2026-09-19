# SECURITY_RULES.md — Règles de sécurité du projet EcoSurv

> Document destiné à tout agent (IA ou humain) qui intervient sur ce projet.
> EcoSurv manipule des données financières (paiements) et des données de mineurs
> (notes, absences, coordonnées d'élèves). Ces règles sont non négociables.

## 0. Référence du projet Supabase

| Champ | Valeur |
|-------|--------|
| URL du projet | `https://ixjypwtxvgahzwqzxycv.supabase.co` |
| Région | eu-west-1 (Irlande) |

La `anon key` correspondante doit être récupérée directement via l'accès
Supabase configuré dans l'outil de l'agent, ou via **Project Settings → Data
API** dans le dashboard Supabase — elle n'est volontairement pas recopiée
dans ce document. **La `service_role key` ne doit jamais être écrite dans
aucun fichier de ce dépôt, y compris ce fichier.**

---

## 1. Principe directeur

EcoSurv est une plateforme **multi-tenant** : plusieurs écoles partagent la même
infrastructure, mais **aucune école ne doit jamais pouvoir voir, modifier ou
deviner l'existence des données d'une autre école.** Toute décision technique
qui affaiblirait cette isolation est à proscrire, même temporairement, même en
développement.

De plus, une partie des données concerne des **mineurs** (élèves) : notes,
absences, photos éventuelles, coordonnées de leurs parents. Ces données sont
sensibles par nature et doivent être traitées avec un niveau de rigueur au
moins équivalent aux données financières.

---

## 2. Isolation multi-tenant (Row Level Security)

### Règle non négociable

**Chaque table contenant des données propres à une école doit avoir une
colonne `ecole_id` et une policy RLS (Row Level Security) Supabase qui filtre
strictement sur cette colonne**, en fonction de l'école à laquelle appartient
l'utilisateur authentifié.

- Aucune requête ne doit jamais lire ou écrire des données d'une école à
  laquelle l'utilisateur n'appartient pas — **la sécurité se fait au niveau de
  la base de données (RLS), jamais uniquement dans le code frontend.**
- Le frontend peut filtrer par confort d'affichage, mais ne doit **jamais être
  la seule barrière de sécurité.** Une policy RLS mal écrite ou absente est
  une faille critique, pas un détail à corriger plus tard.
- Avant de créer une nouvelle table contenant des données liées à une école,
  vérifier systématiquement : *"Cette table a-t-elle une colonne `ecole_id` et
  une policy RLS correspondante ?"* Si la réponse est non, ne pas déployer la
  migration.

### Rôles et permissions

| Rôle | Peut voir |
|------|-----------|
| `super_admin` | Toutes les écoles (fondateurs uniquement) |
| `directeur` | Uniquement les données de son école |
| `enseignant` | Uniquement les classes qui lui sont assignées, dans son école |
| `parent` | Uniquement les données de son/ses enfant(s), dans son école |
| `caissier` | Les paiements de son école, **et en lecture seule les élèves et les échéances de son école** — sans quoi il ne peut pas rattacher un encaissement au bon dossier. Aucun droit d'écriture sur ces deux tables, et aucun accès aux absences ni aux données pédagogiques |

Chaque policy RLS doit refléter cette table, pas une version simplifiée ou
élargie "pour aller plus vite en développement".

Le périmètre du caissier est le seul qui dépasse son intitulé métier, et
c'est délibéré : encaisser suppose d'identifier l'élève et l'échéance
concernés. Cette lecture reste bornée à son école, et il ne peut ni modifier
un dossier élève ni créer une échéance. Toute extension future d'un rôle
au-delà de ce tableau doit être documentée ici avant d'être écrite en
policy, jamais l'inverse.

### École non activée

Le tableau ci-dessus ne s'applique qu'aux écoles **activées par un
super_admin** (`ecoles.statut_activation = 'active'`). Tant qu'une école est
**en attente** d'activation ou **suspendue**, aucun de ses comptes, quel que
soit son rôle, ne voit ni ne modifie de donnée de l'école. Chacun ne lit
que son propre profil et la fiche de son école, le temps d'afficher l'état
de son compte. Le même effet vaut pour un parent dont l'enfant est dans une
école non active. Seul un `super_admin` change ce statut. Le `super_admin`,
lui, voit toutes les écoles, quel que soit leur statut.

---

## 3. Gestion des clés et secrets

### Séparation stricte des clés Supabase

| Clé | Où elle vit | Règle |
|-----|-------------|-------|
| `anon key` (clé publique) | Frontend, variable `VITE_SUPABASE_ANON_KEY` | Peut être exposée côté client — c'est son rôle |
| `service_role key` | Edge Functions / backend uniquement | **Ne doit JAMAIS apparaître dans le code frontend, un commit Git, ou un fichier partagé avec un agent IA en dehors de l'environnement d'exécution sécurisé** |

- La `service_role key` contourne toutes les policies RLS : une fuite de cette
  clé équivaut à donner un accès total et illimité à toutes les données de
  toutes les écoles.
- Aucun agent IA (Gemini, Claude Code) ne doit avoir besoin de manipuler
  directement la `service_role key` dans le code qu'il génère. Si un agent
  produit un extrait de code qui l'utilise côté frontend, c'est une erreur à
  corriger immédiatement, pas une optimisation.

### Fichiers d'environnement

- `.env` et `.env.local` ne sont **jamais committés** (voir `GIT_RULES.md`,
  §5).
- Un fichier `.env.example` (sans valeurs réelles) documente les variables
  attendues pour tout nouveau contributeur ou agent qui reprend le projet.

---

## 4. Authentification

- Mots de passe : minimum imposé par Supabase Auth, pas de règle personnalisée
  affaiblissant ce standard.
- Les comptes parents (connexion simplifiée, potentiellement par téléphone)
  doivent malgré tout passer par un mécanisme d'authentification réel — jamais
  d'accès par simple devinette d'identifiant (ex. numéro d'élève dans l'URL
  sans vérification).
- Toute route ou fonction backend qui renvoie des données sensibles doit
  vérifier la session active, même si la RLS filtre déjà en théorie —
  défense en profondeur.
- **Auto-inscription** : un utilisateur qui s'inscrit seul ne choisit jamais
  son rôle, son école de rattachement ni le statut de son école. Ce qu'il
  saisit ne sert que de libellés. L'inscription d'une école crée toujours
  une école **neuve**, **en attente d'activation**, dont l'inscrit est
  directeur. Tout autre compte (personnel, parents, super_admin) est créé
  par un directeur ou un super_admin.

---

## 5. Données sensibles concernant des mineurs

- Les informations suivantes sont considérées comme **sensibles** et
  nécessitent une vigilance renforcée à chaque fois qu'elles transitent ou
  sont stockées : nom complet de l'élève, classe, notes, absences,
  coordonnées des parents, historique de paiement.
- Ne jamais utiliser de vraies données d'élèves dans un environnement de
  développement, une démonstration, ou un export partagé avec un tiers
  (y compris Stitch, un outil de design, ou un agent IA externe non maîtrisé).
  Utiliser des données fictives réalistes pour tout ce qui n'est pas
  l'environnement de production.
- Toute fonctionnalité d'export (PDF, Excel) doit être limitée aux données que
  le rôle de l'utilisateur autorise déjà à consulter — un export ne doit
  jamais devenir un moyen de contourner la RLS.

---

## 6. Communications (SMS / WhatsApp) et paiement mobile money

- Les identifiants et clés d'API des prestataires (SMS, WhatsApp, mobile
  money) suivent la même règle que la `service_role key` : jamais côté
  frontend, jamais en clair dans un commit.
- Toute confirmation de paiement doit être validée côté serveur (webhook du
  prestataire → mise à jour en base), **jamais uniquement déclenchée par une
  action côté client** (ex. un simple clic sur "j'ai payé" ne doit jamais,
  seul, débloquer un accès ou marquer un paiement comme effectué).

---

## 7. Revue de sécurité avant mise en production

Avant tout déploiement en production d'une nouvelle fonctionnalité touchant
aux paiements, aux données d'élèves, ou à l'authentification :

1. Vérifier que chaque nouvelle table a sa policy RLS.
2. Vérifier qu'aucune clé sensible n'apparaît dans le code ou l'historique Git.
3. Tester manuellement qu'un compte d'une école A ne peut pas accéder aux
   données d'une école B (changer de compte de test et vérifier).
4. Tester qu'un compte parent ne peut voir que les données de son propre
   enfant, pas celles d'un autre élève de la même classe.

---

## 8. Invariants à ne jamais casser

1. Aucune table de données propres à une école sans policy RLS filtrant sur `ecole_id`.
2. La `service_role key` ne quitte jamais l'environnement backend sécurisé.
3. Aucune donnée réelle d'élève ou de parent dans un environnement de test, de démo, ou partagée avec un outil externe.
4. Toute confirmation de paiement est validée côté serveur, jamais uniquement côté client.
5. Un agent IA qui produit du code contournant une de ces règles doit être corrigé avant merge, jamais mergé "pour l'instant, on corrigera plus tard".
