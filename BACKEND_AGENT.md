# BACKEND_AGENT.md — Backend EcoSurv (Supabase / PostgreSQL)

> Document destiné à tout agent (IA ou humain) qui intervient sur le backend
> d'EcoSurv. À lire avant toute migration, toute policy, toute Edge Function.
>
> Ce fichier documente **l'état réel de la base** au terme du lot
> `feat/schema-mvp` : schéma, enums, logique métier en base, policies RLS et
> variables d'environnement attendues.
>
> Il ne remplace pas [`SECURITY_RULES.md`](SECURITY_RULES.md) (les règles) ni
> [`GIT_RULES.md`](GIT_RULES.md) (la convention Git) — il explique comment
> celles-ci sont **effectivement appliquées** en base, et pourquoi.

---

## 1. Périmètre couvert

Ce lot couvre le socle de données du **MVP** défini au §8 du cahier des
charges : dossier élève, échéancier et suivi des paiements, absences, et les
données nécessaires au portail parent et au dashboard directeur.

Hors périmètre à ce stade (V2 et au-delà) : notes et bulletins, emploi du
temps, exports PDF/Excel, i18n arabe/RTL.

### Où vivent les fichiers

| Chemin | Rôle | À exécuter sur le projet Supabase ? |
|---|---|---|
| `supabase/migrations/20260908090000_schema_mvp.sql` | Enums, 7 tables, contraintes, triggers, RLS activée | **Oui**, en premier |
| `supabase/migrations/20260908100000_rls_policies.sql` | `affectations_enseignants`, fonctions de contexte, 77 policies, grants de colonnes | **Oui**, en second |
| `supabase/seed/01_donnees_test.sql` | Jeu de démonstration fictif | Environnements de test uniquement |
| `supabase/seed/02_rattacher_comptes_test.sql` | Rattache les 6 comptes de démo | Environnements de test uniquement |
| `supabase/seed/99_purge_donnees_test.sql` | `DELETE` ciblé sur l'école de démo | Sur demande explicite seulement |
| `supabase/tests/00_prelude_supabase.sql` | Simule les rôles et le schéma `auth` d'un Postgres nu | **Non — jamais.** Bac à sable local uniquement |
| `supabase/tests/01_test_schema_mvp.sql` | 13 cas de test du schéma | **Non.** Bac à sable local |
| `supabase/tests/02_test_rls.sql` | 40+ assertions RLS par rôle | **Non.** Bac à sable local |

Les migrations doivent être appliquées **dans l'ordre chronologique de leur
préfixe**. La seconde dépend de la première.

### Comment rejouer les tests localement

Les tests tournent sur un Postgres jetable, sans toucher au projet Supabase :

```bash
docker run -d --name ecosurv_sql_check -e POSTGRES_PASSWORD=postgres postgres:17-alpine
# puis, dans l'ordre : 00_prelude, la migration schema, la migration rls,
# 01_test_schema_mvp, 02_test_rls
```

Le prélude recrée les rôles `anon` / `authenticated` / `service_role`, le
schéma `auth` et une version simplifiée de `auth.uid()`. C'est un **artefact
de test** : l'exécuter sur Supabase produit l'erreur `role anon already
exists` et n'a aucun sens, ces objets y existant déjà.

---

## 2. Vue d'ensemble du schéma

8 tables, toutes en RLS active, toutes porteuses d'un `ecole_id` sauf
`ecoles` (qui *est* le tenant) et `profils` (où `ecole_id` est `NULL` pour le
seul rôle `super_admin`).

```
                        ecoles  (le tenant)
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
     profils           eleves        affectations_enseignants
    (auth.users)          │                  │
        │                 │                  │
        │        ┌────────┼─────────┐        │
        │        │        │         │        │
        └──── parents_ echeances  absences   │
              eleves      │                  │
                          │                  │
                      paiements              │
                                             │
        profils ─────────────────────────────┘
        (enseignant affecté à une classe)
```

| Table | Contenu | Volume attendu |
|---|---|---|
| `ecoles` | Un établissement client = un tenant | quelques centaines |
| `profils` | Extension applicative de `auth.users` : rôle + école | ~10-30 par école |
| `eleves` | Dossier élève | plusieurs centaines par école |
| `parents_eleves` | Liaison many-to-many tuteurs ↔ élèves | ~1-3 par élève |
| `echeances` | Une somme due par un élève à une date | ~3-12 par élève et par an |
| `paiements` | Transactions rattachées à une échéance | ≥ 1 par échéance soldée |
| `absences` | Absences et retards | variable |
| `affectations_enseignants` | Classes assignées à un enseignant | quelques lignes par enseignant |

### Pourquoi `affectations_enseignants` existe dès le MVP

Ce n'est **pas** une brique d'emploi du temps (V2). `SECURITY_RULES.md` §2
restreint l'enseignant aux « classes qui lui sont assignées ». Sans table
d'affectation, la seule policy écrivable aurait été « enseignant = toute son
école » — précisément la version élargie que les règles interdisent. C'est
donc une **dépendance de sécurité**, pas une fonctionnalité.

---

## 3. Enums

Sept enums Postgres. Tout champ de statut ou de rôle passe par un enum : une
valeur hors liste est rejetée par le moteur, pas par une validation
applicative qu'on peut oublier.

| Enum | Valeurs | Notes |
|---|---|---|
| `role_utilisateur` | `super_admin`, `directeur`, `enseignant`, `parent`, `caissier` | Les 5 rôles du §4 du cahier des charges |
| `statut_abonnement` | `essai`, `actif`, `suspendu`, `expire`, `annule` | Console super admin (§5.9) |
| `statut_echeance` | `a_jour`, `en_retard`, `partiel`, `paye` | **Calculé**, jamais saisi — voir §5 |
| `statut_paiement` | `en_attente`, `confirme`, `echoue`, `rembourse`, `annule` | Seul `confirme` solde une échéance |
| `methode_paiement` | `especes`, `bankily`, `masrvi`, `sedad`, `virement`, `cheque` | Les opérateurs mauritaniens restent une hypothèse à valider (§5.3) |
| `lien_parente` | `pere`, `mere`, `tuteur`, `autre` | Nature du lien dans `parents_eleves` |
| `type_absence` | `absence`, `retard` | §5.4 parle bien d'« absences/retards » |

**Ajouter une valeur** à un enum en production se fait par
`ALTER TYPE ... ADD VALUE`, opération non transactionnelle et **non
réversible**. Réfléchir avant, et ne jamais retirer une valeur déjà utilisée.

Les montants sont en **Ouguiya (MRU)**, typés `numeric(12,2)` — jamais
`float`, qui perdrait des centimes sur des sommes agrégées.

---

## 4. Isolation multi-tenant : deux barrières, pas une

`SECURITY_RULES.md` §1 exige qu'aucune école ne puisse voir, modifier ou
**deviner l'existence** des données d'une autre. La RLS assure cela, mais une
policy est du code : elle peut être mal écrite. Le schéma pose donc une
seconde barrière, structurelle.

`eleves` et `echeances` portent chacune une contrainte
`UNIQUE (ecole_id, id)`, apparemment redondante avec leur clé primaire. Elle
sert de cible à des **clés étrangères composites** :

```sql
-- echeances, absences, parents_eleves vers eleves
foreign key (ecole_id, eleve_id) references eleves (ecole_id, id)
-- paiements vers echeances
foreign key (ecole_id, echeance_id) references echeances (ecole_id, id)
-- affectations_enseignants vers profils
foreign key (ecole_id, enseignant_id) references profils (ecole_id, id)
```

Conséquence : une échéance de l'école A qui pointerait un élève de l'école B
est **rejetée par PostgreSQL**, indépendamment de toute policy. Le
cloisonnement ne repose donc pas uniquement sur la RLS.

`profils` ajoute une contrainte `CHECK` de cohérence :

```sql
constraint profils_ecole_selon_role check (
  (role = 'super_admin' and ecole_id is null)
  or (role <> 'super_admin' and ecole_id is not null)
)
```

Sans elle, un compte non-`super_admin` avec `ecole_id IS NULL` échapperait à
tous les filtres `ecole_id = mon_ecole_id()` : il ne verrait rien, mais
l'invariant serait porté par la chance plutôt que par le schéma.

---

## 5. Logique financière en base

### Le statut d'une échéance est dérivé, jamais saisi

`echeances.montant_paye` est la somme des paiements **`confirme`** de
l'échéance, et `echeances.statut` en découle :

```sql
calculer_statut_echeance(montant, montant_paye, date_echeance)
  montant_paye >= montant      -> paye
  date_echeance < current_date -> en_retard
  montant_paye > 0             -> partiel
  sinon                        -> a_jour
```

**L'ordre compte** : `en_retard` prime sur `partiel`. Une échéance passée et
partiellement payée doit rester dans les relances du directeur (§5.7), pas
disparaître dans un statut rassurant. `a_jour` signifie donc « pas encore
échue, rien payé ».

### Les triggers

| Table | Trigger | Effet |
|---|---|---|
| `paiements` | `paiements_recalcul_echeance` | Après tout INSERT/UPDATE/DELETE, recalcule `montant_paye` de l'échéance concernée à partir des seuls paiements `confirme` |
| `echeances` | `echeances_statut_auto` | Avant INSERT, et avant UPDATE de `montant`, `montant_paye` ou `date_echeance`, repositionne `statut` |
| `profils` | `profils_protege_role_ecole` | Bloque tout changement de `role` ou `ecole_id` hors super_admin / directeur — voir §6 |
| toutes (sauf `parents_eleves`, `affectations_enseignants`) | `*_set_updated_at` | Horodate `updated_at` |

Un paiement `en_attente`, `echoue`, `annule` ou `rembourse` ne solde donc
**rien**. C'est l'application directe de `SECURITY_RULES.md` §6 : un clic
côté client ne peut pas marquer un élève à jour.

### Tâche planifiée requise

Le passage de `a_jour`/`partiel` vers `en_retard` dépend de la date du jour :
aucun événement en base ne le déclenche quand une échéance arrive à terme.

```sql
select public.rafraichir_statuts_echeances();  -- renvoie le nb de lignes modifiées
```

**À planifier une fois par jour** (pg_cron, ou une Edge Function déclenchée
par un scheduler). La fonction est idempotente : elle ne touche que les
lignes dont le statut stocké diffère du statut calculé. Sans cette
planification, le dashboard directeur sous-estimera les retards.

---

## 6. Row Level Security

### Trois mécanismes complémentaires

La RLS seule ne suffit pas : une policy dit **quelles lignes** sont
accessibles, jamais **quelles colonnes**. Trois couches sont donc en place.

**1. Les policies** — 77 policies nommées, une par (table, action, rôle),
toutes ciblant explicitement le rôle `authenticated`. Le rôle `anon` n'a
aucun privilège sur ces tables (`REVOKE ALL`) : un porteur de la seule
`anon key`, non authentifié, obtient `permission denied`.

**2. Les grants de colonnes** — certaines colonnes portent la vérité
financière et ne doivent pas être écrites depuis le client, même par un
directeur légitime sur sa propre école :

| Table | Colonnes modifiables par `authenticated` | Retirées |
|---|---|---|
| `echeances` | `libelle`, `montant`, `date_echeance`, `annee_scolaire` | `montant_paye`, `statut`, `ecole_id`, `eleve_id` |
| `paiements` | `note` | `statut`, `montant`, `methode`, `reference_transaction`, … |
| `ecoles` | `nom`, `ville`, `adresse`, `telephone`, `email`, `annee_scolaire` | `statut_abonnement`, `abonnement_debut`, `abonnement_fin` |

Confirmer, annuler ou rembourser un paiement, et gérer un abonnement,
passent donc **obligatoirement par le `service_role`** (Edge Function), donc
par un webhook vérifié côté serveur.

> Note d'implémentation : un `REVOKE` de colonne ne peut pas entamer un
> privilège accordé au niveau table. Le motif est toujours
> `REVOKE UPDATE ON TABLE ... ; GRANT UPDATE (col, col) ON TABLE ...`.

**3. Le trigger `profils_protege_role_ecole`** — un utilisateur a le droit de
modifier son propre profil (nom, téléphone). Une policy ne sait pas
restreindre cet UPDATE à certaines colonnes : sans ce trigger, un enseignant
y écrirait `role = 'directeur'` et changerait de périmètre. Le trigger
n'autorise un changement de `role` ou d'`ecole_id` que pour un `super_admin`,
ou pour le directeur de l'école concernée — et jamais vers `super_admin`.

### Fonctions de contexte

Les policies ne lisent jamais `profils` directement : une policy sur
`profils` qui interroge `profils` provoque une **récursion infinie**. Toutes
passent par des fonctions `SECURITY DEFINER` avec `search_path` figé, dont
l'exécution est révoquée à `public` et `anon` :

| Fonction | Retour | Usage |
|---|---|---|
| `mon_role()` | `role_utilisateur` | Rôle de l'appelant |
| `mon_ecole_id()` | `uuid` | École de l'appelant |
| `est_super_admin()` | `boolean` | Accès global |
| `est_tuteur_de(eleve_id)` | `boolean` | Périmètre parent, via `parents_eleves` |
| `est_tuteur_de_echeance(echeance_id)` | `boolean` | Périmètre parent sur les paiements |
| `enseigne_classe(ecole_id, classe)` | `boolean` | Périmètre enseignant |
| `enseigne_eleve(eleve_id)` | `boolean` | Périmètre enseignant, via la classe de l'élève |

**Toutes filtrent sur `profils.actif`.** Un profil désactivé fait renvoyer
`NULL` / `false` : aucune policy ne matche plus, et le compte perd tout accès
d'un seul coup, sans qu'il faille traiter les 77 policies une par une.

Elles sont appelées sous la forme `(select public.mon_ecole_id())` dans les
policies : PostgreSQL évalue alors l'expression une fois par requête plutôt
qu'une fois par ligne.

### Matrice des accès

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `ecoles` | super_admin, tout membre *(sa seule école)* | super_admin | super_admin, directeur *(coordonnées seules)* | super_admin |
| `profils` | super_admin, directeur *(son école)*, soi-même | super_admin, directeur *(hors super_admin)* | super_admin, directeur, soi-même | super_admin, directeur |
| `eleves` | super_admin, directeur, caissier, enseignant *(ses classes)*, parent *(ses enfants)* | super_admin, directeur | super_admin, directeur | super_admin |
| `parents_eleves` | super_admin, directeur, parent *(ses liens)* | super_admin, directeur | super_admin, directeur | super_admin, directeur |
| `echeances` | super_admin, directeur, caissier, parent *(ses enfants)* | super_admin, directeur | super_admin, directeur | super_admin, directeur *(si `montant_paye = 0`)* |
| `paiements` | super_admin, directeur, caissier, parent *(ses enfants)* | super_admin, directeur, caissier *(tracé `encaisse_par`)* | super_admin, directeur *(colonne `note`)* | super_admin |
| `absences` | super_admin, directeur, enseignant *(ses classes)*, parent *(ses enfants)* | super_admin, directeur, enseignant | super_admin, directeur, enseignant | super_admin, directeur, enseignant |
| `affectations_enseignants` | super_admin, directeur, enseignant *(les siennes)* | super_admin, directeur | super_admin, directeur | super_admin, directeur |

### Décisions à connaître avant de modifier ces policies

- **Un parent n'insère aucun paiement.** §5.8 prévoit qu'il paie depuis son
  interface, mais l'écriture en base doit venir du serveur : sinon il
  déclarerait lui-même un paiement `confirme` et se marquerait à jour. Le
  parcours attendu est : l'interface appelle une Edge Function → celle-ci
  crée le paiement en `en_attente` en `service_role` → le webhook de
  l'opérateur le passe à `confirme`.
- **Le caissier peut insérer un paiement `confirme`** (encaissement en
  espèces au guichet : il a l'argent en main). `encaisse_par` est forcé à
  son propre identifiant par la policy, ce qui laisse une trace. C'est un
  risque interne assumé et traçable, pas une faille d'isolation.
- **`paiements` ne se supprime pas** (hors super_admin) : la piste comptable
  doit rester. Une correction se fait par un statut `annule` ou `rembourse`,
  côté serveur.
- **`eleves` ne se supprime pas** par un directeur : la cascade emporterait
  échéances, paiements et absences. Une sortie d'élève se traite avec
  `actif = false`.
- **Le caissier lit `eleves` et `echeances`** de son école, bien que
  `SECURITY_RULES.md` §2 dise « uniquement les paiements » : sans cela il ne
  peut pas rattacher un encaissement au bon dossier. Il n'a aucun droit
  d'écriture sur ces tables, ni aucun accès aux absences.
- **Le caissier et l'enseignant ne se recoupent jamais** : l'enseignant n'a
  accès à aucune donnée financière, le caissier à aucune donnée
  pédagogique.

### Checklist avant de déployer une nouvelle table

1. Contient-elle des données propres à une école ? → colonne `ecole_id`
   **obligatoire**.
2. Référence-t-elle un élève, une échéance, un profil ? → **clé étrangère
   composite** vers `(ecole_id, id)`, pas une FK simple.
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` **dans la même migration** que
   le `CREATE TABLE` — jamais « plus tard ».
4. `REVOKE ALL ... FROM anon`.
5. Une policy par action et par rôle concerné, `TO authenticated` explicite,
   en s'appuyant sur les fonctions de contexte existantes.
6. Une colonne porte-t-elle un état financier ou un privilège ? → la retirer
   des grants `UPDATE` de `authenticated`.
7. Rejouer `supabase/tests/02_test_rls.sql` étendu au nouveau cas, et
   vérifier les *Security Advisors* du dashboard Supabase.

Rappel de `SECURITY_RULES.md` §2 : **si la réponse à l'une de ces questions
est « non », la migration ne se déploie pas.**

---

## 7. Variables d'environnement

Aucune valeur réelle ne figure dans ce dépôt. Voir [`.env.example`](.env.example)
pour le gabarit à copier en `.env.local`, et `SECURITY_RULES.md` §3 pour la
règle de séparation des clés.

### Frontend (Vite — préfixe `VITE_` obligatoire pour être exposé au client)

| Variable | Contenu | Sensibilité |
|---|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Publique |
| `VITE_SUPABASE_ANON_KEY` | Clé publique `anon` | **Publique par conception** — c'est son rôle ; elle ne donne accès qu'à ce que la RLS autorise |

### Backend — Edge Functions uniquement

| Variable | Contenu | Sensibilité |
|---|---|---|
| `SUPABASE_URL` | Même URL, côté serveur | Publique |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service, **contourne toute la RLS** | **CRITIQUE.** Jamais dans le frontend, jamais dans un commit, jamais dans un fichier partagé avec un agent IA |
| `MOBILE_MONEY_BASE_URL` | Endpoint de l'opérateur | Interne |
| `MOBILE_MONEY_API_KEY` | Identifiant marchand | **Secret** |
| `MOBILE_MONEY_API_SECRET` | Secret marchand | **Secret** |
| `MOBILE_MONEY_WEBHOOK_SECRET` | Secret de signature des callbacks | **Secret** — sans vérification de signature, n'importe qui pourrait confirmer un paiement |
| `SMS_PROVIDER_API_KEY` | Passerelle SMS | **Secret** |
| `SMS_SENDER_ID` | Identifiant d'expéditeur affiché | Interne |
| `WHATSAPP_API_TOKEN` | API WhatsApp Business | **Secret** |
| `WHATSAPP_PHONE_NUMBER_ID` | Numéro émetteur | Interne |

Les noms des variables de paiement et de messagerie sont **provisoires** :
ils dépendront du prestataire retenu, encore une hypothèse à valider au §5.3
du cahier des charges. Les renommer le jour où le choix est arrêté.

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont par ailleurs injectées
automatiquement dans l'environnement d'exécution des Edge Functions Supabase :
ne pas les redéclarer en secret manuel sans raison.

---

## 8. Comptes de démonstration

Le jeu de test (`supabase/seed/`) attend six comptes créés dans
**Authentication → Users**, avec « Auto Confirm User » coché. Le script
`02_rattacher_comptes_test.sql` les reconnaît **par email** et crée les
profils, liens et affectations correspondants.

| Email | Rôle | Périmètre |
|---|---|---|
| `superadmin.demo@ecosurv.test` | `super_admin` | Toutes les écoles |
| `directeur.demo@ecosurv.test` | `directeur` | Toute l'école de démo |
| `enseignant.demo@ecosurv.test` | `enseignant` | 6ème A et CM2 seulement |
| `caissier.demo@ecosurv.test` | `caissier` | Paiements de l'école |
| `parent1.demo@ecosurv.test` | `parent` | 2 enfants (fratrie) |
| `parent2.demo@ecosurv.test` | `parent` | 1 enfant |

Les mots de passe sont choisis à la création et **ne figurent nulle part dans
ce dépôt**. Le domaine `.test` est réservé par la RFC 6761 : ces adresses ne
peuvent correspondre à aucune boîte réelle.

Toutes ces données sont fictives (`SECURITY_RULES.md` §5). Repères visuels :
école préfixée `[DÉMO]`, matricules `DEMO-`, transactions `DEMO-TRX-`.

---

## 9. Ce qui reste à faire

Points ouverts à la fin de ce lot, à traiter avant une mise en production :

1. **Planifier `rafraichir_statuts_echeances()`** (§5). Sans cela, les
   retards ne basculent pas d'eux-mêmes.
2. **Créer la table et la logique d'abonnement côté super admin** : les
   colonnes d'abonnement de `ecoles` ne sont écrivables qu'en `service_role`,
   la console du §5.9 devra donc passer par des Edge Functions.
3. **Edge Function de paiement mobile money** : initiation en `en_attente` +
   webhook vérifiant la signature avant de passer à `confirme`. C'est la
   pièce qui rend le §5.8 utilisable côté parent.
4. **Création des profils à l'inscription** : aucune policy ne permet à un
   utilisateur de créer son propre profil (il choisirait son rôle). Les
   comptes sont donc créés par un directeur ou un super_admin. Si un parcours
   d'auto-inscription est souhaité, il devra passer par un trigger
   `SECURITY DEFINER` sur `auth.users` forçant `role = 'parent'`.
5. **Vérifier les Security Advisors** du dashboard Supabase après chaque
   migration.
6. **Tester avec de vrais comptes Supabase Auth** : le harnais local simule
   `auth.uid()` via un paramètre de session, alors que Supabase le lit dans
   `request.jwt.claims`. La logique des policies est identique, mais la
   vérification de bout en bout reste à faire côté application.
7. **Notes, bulletins et emploi du temps** (V2) : prévoir la même rigueur —
   `ecole_id`, FK composites, RLS dans la migration de création. Les notes
   sont des données de mineurs au sens de `SECURITY_RULES.md` §5.

---

## 10. Invariants backend à ne jamais casser

1. Aucune table de données d'école sans `ecole_id` **et** sans policy RLS.
2. La `service_role key` ne quitte jamais l'environnement des Edge Functions.
3. Un paiement n'est `confirme` que par le serveur, jamais par le client.
4. `echeances.statut` et `echeances.montant_paye` restent calculés : ne
   jamais les rendre écrivables depuis le client.
5. Aucune donnée réelle d'élève ou de parent hors production.
6. Un changement de `role` ou d'`ecole_id` ne s'obtient jamais par
   auto-modification de son propre profil.
