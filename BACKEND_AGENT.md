# BACKEND_AGENT.md — Backend EcoSurv (Supabase / PostgreSQL)

> Document destiné à tout agent (IA ou humain) qui intervient sur le backend
> d'EcoSurv. À lire avant toute migration, toute policy, toute Edge Function.
>
> Ce fichier documente **l'état réel de la base** au terme des lots
> `feat/schema-mvp` et `feat/backend-real-actions` (notifications, clôtures
> de caisse, écritures financières bornées) : schéma, enums, logique métier
> en base, policies RLS et variables d'environnement attendues.
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
| `supabase/migrations/20260910170000_update_methode_paiement_enum.sql` | Réduit `methode_paiement` aux 4 modes officiels | **Oui** |
| `supabase/migrations/20260918090000_notifications.sql` | Enum `type_notification`, table `notifications`, 2 policies, fonctions serveur de création | **Oui** |
| `supabase/migrations/20260918091000_notifications_automatiques.sql` | Triggers : paiement confirmé et échéance en retard notifient les parents | **Oui** |
| `supabase/migrations/20260918092000_ecritures_financieres_bornees.sql` | Grants d'INSERT par colonne (`echeances`, `paiements`), horodatage serveur, encaissements au guichet bornés | **Oui** |
| `supabase/migrations/20260918093000_clotures_caisse.sql` | Table `clotures_caisse`, 4 policies, totaux calculés, verrou des encaissements | **Oui**, après la précédente |
| `supabase/seed/01_donnees_test.sql` | Jeu de démonstration fictif | Environnements de test uniquement |
| `supabase/seed/02_rattacher_comptes_test.sql` | Rattache les 6 comptes de démo | Environnements de test uniquement |
| `supabase/seed/99_purge_donnees_test.sql` | `DELETE` ciblé sur l'école de démo, sans garde-fou | Bases de test locales seulement — **jamais en production** |
| `supabase/ops/purge_demo/01_verification.sql` | Comptage en lecture seule de ce que la purge supprimerait, garde-fous | **Oui**, une fois, avant la purge (voir §8) |
| `supabase/ops/purge_demo/02_purge_donnees_demo.sql` | Purge de l'école de démo, simulation par défaut | **Oui**, une fois, **après validation manuelle** |
| `supabase/ops/purge_demo/03_purge_comptes_auth_demo.sql` | Suppression des 6 comptes Auth de démo | **Oui**, une fois, après le 02 (ou dashboard) |
| `supabase/tests/00_prelude_supabase.sql` | Simule les rôles et le schéma `auth` d'un Postgres nu | **Non — jamais.** Bac à sable local uniquement |
| `supabase/tests/01_test_schema_mvp.sql` | 13 cas de test du schéma | **Non.** Bac à sable local |
| `supabase/tests/02_test_rls.sql` | 40+ vérifications RLS par rôle (sortie à relire) | **Non.** Bac à sable local |
| `supabase/tests/03_harnais_assertions.sql` | Fonctions d'assertion `tests.*` + jeu commun (écoles C et D) | **Non.** Bac à sable local |
| `supabase/tests/04_test_cloisonnement_roles.sql` | 75 assertions : cloisonnement des 5 rôles sur les 10 tables (§6) | **Non.** Bac à sable local |
| `supabase/tests/05_test_notifications.sql` | 40 assertions : RLS et émission automatique des notifications | **Non.** Bac à sable local |
| `supabase/tests/06_test_ecritures_financieres.sql` | 21 assertions : bornes d'INSERT sur échéances et paiements | **Non.** Bac à sable local |
| `supabase/tests/07_test_clotures_caisse.sql` | 40 assertions : RLS, totaux et verrou des clôtures | **Non.** Bac à sable local |
| `supabase/tests/08_test_concurrence_cloture.sql` | 5 assertions : course encaissement / clôture sur deux connexions (`dblink`) | **Non.** Bac à sable local, **en dernier** |

Les migrations doivent être appliquées **dans l'ordre chronologique de leur
préfixe** : chacune dépend des précédentes (la clôture s'appuie sur
l'horodatage serveur posé par `20260918092000`).

### Comment rejouer les tests localement

Les tests tournent sur un Postgres jetable, sans toucher au projet Supabase :

```bash
docker run -d --name ecosurv_sql_check -e POSTGRES_PASSWORD=postgres postgres:17-alpine
# puis, dans l'ordre : 00_prelude, les migrations dans l'ordre de leur
# préfixe, 01_test_schema_mvp, 02_test_rls, 03_harnais_assertions, 04 à 08
# (psql -v ON_ERROR_STOP=1 -f <fichier>)
```

Les fichiers 03 à 08 sont des **assertions** : au premier écart, psql
s'arrête sur un message `ECHEC <cas> — obtenu …, attendu …` et sort en
erreur ; sinon chaque fichier se termine par
`=== <fichier> : N assertions OK, aucun echec ===`. Les fichiers 04 à 07
s'exécutent dans une transaction annulée et peuvent être relancés ; le 08
committe réellement (il en a besoin pour tester deux connexions) et nettoie
ses lignes.

Ces tests ont été validés **par mutation** : 18 affaiblissements volontaires
(policy élargie, grant rendu, verrou retiré, etc.) ont chacun fait échouer la
suite. Un test ajouté à ce harnais doit pouvoir en dire autant.

Le prélude recrée les rôles `anon` / `authenticated` / `service_role`, le
schéma `auth` et une version simplifiée de `auth.uid()`. C'est un **artefact
de test** : l'exécuter sur Supabase produit l'erreur `role anon already
exists` et n'a aucun sens, ces objets y existant déjà.

---

## 2. Vue d'ensemble du schéma

10 tables, toutes en RLS active, toutes porteuses d'un `ecole_id` sauf
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

        profils ──── notifications     (destinataire ; élève concerné facultatif)
        profils ──── clotures_caisse   (caissier = poste ; verrouille ses paiements du jour)
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
| `notifications` | Messages par destinataire (paiement confirmé, retard…) — voir §6bis | quelques-unes par parent et par mois |
| `clotures_caisse` | Clôture journalière d'un poste de caisse — voir §6ter | 1 par caissier et par jour ouvré |

### Pourquoi `affectations_enseignants` existe dès le MVP

Ce n'est **pas** une brique d'emploi du temps (V2). `SECURITY_RULES.md` §2
restreint l'enseignant aux « classes qui lui sont assignées ». Sans table
d'affectation, la seule policy écrivable aurait été « enseignant = toute son
école » — précisément la version élargie que les règles interdisent. C'est
donc une **dépendance de sécurité**, pas une fonctionnalité.

---

## 3. Enums

Huit enums Postgres. Tout champ de statut ou de rôle passe par un enum : une
valeur hors liste est rejetée par le moteur, pas par une validation
applicative qu'on peut oublier.

| Enum | Valeurs | Notes |
|---|---|---|
| `role_utilisateur` | `super_admin`, `directeur`, `enseignant`, `parent`, `caissier` | Les 5 rôles du §4 du cahier des charges |
| `statut_abonnement` | `essai`, `actif`, `suspendu`, `expire`, `annule` | Console super admin (§5.9) |
| `statut_echeance` | `a_jour`, `en_retard`, `partiel`, `paye` | **Calculé**, jamais saisi — voir §5 |
| `statut_paiement` | `en_attente`, `confirme`, `echoue`, `rembourse`, `annule` | Seul `confirme` solde une échéance |
| `methode_paiement` | `especes`, `bankily`, `masrvi`, `cheque` | Réduit à ces 4 modes par `20260910170000` (`sedad` → `masrvi`, `virement` → `cheque`). Seul `especes` peut être `confirme` à la saisie au guichet (§6) |
| `lien_parente` | `pere`, `mere`, `tuteur`, `autre` | Nature du lien dans `parents_eleves` |
| `type_absence` | `absence`, `retard` | §5.4 parle bien d'« absences/retards » |
| `type_notification` | `echeance_retard`, `nouvelle_note`, `paiement_confirme` | `nouvelle_note` est réservé à la V2 : aucune table de notes, rien ne l'émet encore |

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
| `paiements` | `paiements_horodatage_serveur` | Avant INSERT par `authenticated` : `paye_le` = `now()` si `confirme`, `NULL` sinon (la valeur envoyée par le navigateur est ignorée) |
| `paiements` | `paiements_verrou_cloture` | Avant INSERT/UPDATE : refuse (ES001) tout encaissement sur une journée clôturée pour ce poste — voir §6ter |
| `paiements` | `paiements_notifier_confirmation` | Après passage à `confirme` : notifie les parents de l'élève — voir §6bis |
| `echeances` | `echeances_notifier_retard` | Après passage à `en_retard` (pas à l'INSERT) : notifie les parents — voir §6bis |
| `clotures_caisse` | `clotures_caisse_calcul` | Avant INSERT : calcule les totaux à partir des paiements, sous verrou — voir §6ter |
| toutes (sauf `parents_eleves`, `affectations_enseignants`, `notifications`, `clotures_caisse`) | `*_set_updated_at` | Horodate `updated_at` |

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

**1. Les policies** — 83 policies nommées (77 du lot MVP, 2 sur
`notifications`, 4 sur `clotures_caisse`), une par (table, action, rôle),
toutes ciblant explicitement le rôle `authenticated`. Le rôle `anon` n'a
aucun privilège sur ces tables (`REVOKE ALL`) : un porteur de la seule
`anon key`, non authentifié, obtient `permission denied`.

**2. Les grants de colonnes** — certaines colonnes portent la vérité
financière et ne doivent pas être écrites depuis le client, même par un
directeur légitime sur sa propre école. Depuis `20260918092000`, cela vaut
pour l'INSERT comme pour l'UPDATE :

| Table | INSERT autorisé à `authenticated` | UPDATE autorisé à `authenticated` | Jamais écrit par le client |
|---|---|---|---|
| `echeances` | `ecole_id`, `eleve_id`, `libelle`, `montant`, `date_echeance`, `annee_scolaire` | `libelle`, `montant`, `date_echeance`, `annee_scolaire` | `montant_paye`, `statut`, `id`, horodatages |
| `paiements` | `ecole_id`, `echeance_id`, `montant`, `methode`, `statut`, `reference_transaction`, `encaisse_par`, `note`, `paye_le` *(réécrit par trigger)* | `note` | `created_at` (= journée de caisse), `id`, `updated_at` |
| `ecoles` | *(table-level, policy super_admin)* | `nom`, `ville`, `adresse`, `telephone`, `email`, `annee_scolaire` | `statut_abonnement`, `abonnement_debut`, `abonnement_fin` |
| `notifications` | **aucune** | `lu` | tout le reste |
| `clotures_caisse` | `ecole_id`, `caissier_id`, `date_cloture` | **aucune** | `montant_total_encaisse`, `nombre_operations`, `created_at` |

Confirmer, annuler ou rembourser un paiement, gérer un abonnement, créer une
notification ou corriger une clôture passent donc **obligatoirement par le
`service_role`** (Edge Function), donc par du code serveur vérifié.

> Note d'implémentation : un `REVOKE` de colonne ne peut pas entamer un
> privilège accordé au niveau table. Le motif est toujours
> `REVOKE <action> ON TABLE ... ; GRANT <action> (col, col) ON TABLE ...`.
> Côté frontend, envoyer une colonne non accordée (ex. `created_at` dans un
> `insert`) échoue en `permission denied for table …` (42501) : ne pas
> l'interpréter comme un problème de RLS.

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
d'un seul coup, sans qu'il faille traiter les 83 policies une par une.

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
| `paiements` | super_admin, directeur, caissier, parent *(ses enfants)* | super_admin, directeur, caissier *(tracé `encaisse_par` ; `en_attente`, ou `confirme` en espèces seulement ; journée non clôturée)* | super_admin, directeur *(colonne `note`)* | super_admin |
| `absences` | super_admin, directeur, enseignant *(ses classes)*, parent *(ses enfants)* | super_admin, directeur, enseignant | super_admin, directeur, enseignant | super_admin, directeur, enseignant |
| `affectations_enseignants` | super_admin, directeur, enseignant *(les siennes)* | super_admin, directeur | super_admin, directeur | super_admin, directeur |
| `notifications` | destinataire *(les siennes, dans son école)* | — *(serveur uniquement)* | destinataire *(colonne `lu`)* | — |
| `clotures_caisse` | super_admin, directeur *(son école)*, caissier *(les siennes)* | caissier *(sa caisse, aujourd'hui ou avant)* | — | — |

### Décisions à connaître avant de modifier ces policies

- **Un parent n'insère aucun paiement.** §5.8 prévoit qu'il paie depuis son
  interface, mais l'écriture en base doit venir du serveur : sinon il
  déclarerait lui-même un paiement `confirme` et se marquerait à jour. Le
  parcours attendu est : l'interface appelle une Edge Function → celle-ci
  crée le paiement en `en_attente` en `service_role` → le webhook de
  l'opérateur le passe à `confirme`.
- **Le caissier peut insérer un paiement `confirme`, en espèces
  uniquement** (il a l'argent en main). `encaisse_par` est forcé à son
  propre identifiant par la policy, ce qui laisse une trace. C'est un risque
  interne assumé et traçable, pas une faille d'isolation. Bankily, Masrvi et
  chèque sont saisis `en_attente` et ne soldent rien tant que le serveur ne
  les a pas confirmés ; `echoue`, `annule` et `rembourse` ne se créent
  jamais au guichet. Même règle pour le directeur qui encaisse lui-même.
  (Policies `paiements_insert_caissier` / `_directeur`, durcies par
  `20260918092000` ; le frontend appliquait déjà cette règle.)
- **`paiements` ne se supprime pas** (hors super_admin) : la piste comptable
  doit rester. Une correction se fait par un statut `annule` ou `rembourse`,
  côté serveur.
- **`eleves` ne se supprime pas** par un directeur : la cascade emporterait
  échéances, paiements et absences. Une sortie d'élève se traite avec
  `actif = false`.
- **Le caissier lit `eleves` et `echeances`** de son école, en lecture seule :
  sans cela il ne peut pas rattacher un encaissement au bon dossier. Ce
  périmètre est explicitement prévu par le tableau des rôles de
  `SECURITY_RULES.md` §2, qui a été mis à jour en ce sens. Il n'a aucun droit
  d'écriture sur ces tables, ni aucun accès aux absences.
- **Le caissier et l'enseignant ne se recoupent jamais** : l'enseignant n'a
  accès à aucune donnée financière, le caissier à aucune donnée
  pédagogique.

### Vérification du cloisonnement des rôles (18/09/2026)

Faite avant la passe « actions réelles », après le passage à
l'authentification Supabase réelle (PR #10). Méthode : relecture des 83
policies, puis `supabase/tests/04_test_cloisonnement_roles.sql` (75
assertions sur deux écoles C et D), validé par mutation (élargir une
policy de lecture fait échouer le test).

**Directeur et super_admin — vue 360°, confirmée.**

| Portail | Données | Directeur *(son école)* | Super admin *(tout le parc)* |
|---|---|---|---|
| Élèves | `eleves`, `parents_eleves`, `profils` | ✅ toutes classes | ✅ |
| Caissier | `paiements`, `echeances`, `clotures_caisse` | ✅ tous les postes | ✅ |
| Enseignant | `absences`, `affectations_enseignants` | ✅ toutes classes | ✅ |
| Parent | `echeances`, `paiements`, `absences` des enfants | ✅ (sur-ensemble) | ✅ |
| Notes | — | ⚠️ **pas de table** (V2) | — |

Chaque policy directeur combine `mon_role() = 'directeur'` **et**
`ecole_id = mon_ecole_id()` : le directeur C ne voit, même en ciblant
explicitement l'identifiant, aucune ligne de l'école D, ne peut ni y écrire
ni y « pousser » un de ses élèves (`WITH CHECK`). L'isolation est doublée
par les FK composites (§4). Le super_admin est inter-écoles **par
définition** (`SECURITY_RULES.md` §2, fondateurs uniquement) : il n'a pas
d'`ecole_id` et n'est pas concerné par l'isolation entre écoles.

**Notes (portail pédagogique)** : aucune table n'existe ; l'écran affiche
« disponible prochainement ». Il n'y a donc rien à ouvrir au directeur
aujourd'hui. **Condition pour la V2** : la table `notes` devra porter
`notes_select_directeur` (son école) et `notes_select_super_admin` dès sa
migration de création, en plus de l'enseignant (ses classes) et du parent
(ses enfants).

**Enseignant, caissier, parent — strictement bornés, confirmé.**

| Rôle | Lit | Ne lit pas |
|---|---|---|
| Enseignant | son profil ; élèves et absences de **ses classes** ; ses affectations | classe voisine, échéances, paiements, clôtures, liens parents |
| Caissier | son profil ; élèves, échéances, paiements de son école ; **ses** clôtures | absences, affectations, liens parents, clôtures des collègues |
| Parent | son profil ; ses liens ; élèves, échéances, paiements, absences de **ses enfants** | enfant d'un autre parent de la même classe, affectations, clôtures |

Aucun des trois ne peut s'élargir lui-même : auto-affectation, déclaration
de tutelle, auto-promotion de rôle et saisie hors périmètre sont refusées
(assertions dans `04_…`).

**Authentification réelle** : les policies ne dépendent que de
`auth.uid()` et de `profils`. Le passage aux vraies sessions Supabase ne
change rien côté base ; la seule différence avec le harnais local est la
façon dont `auth.uid()` lit le `sub` du JWT (voir §9, point 6).

**Corrections apportées** : aucune policy de **lecture** n'était trop
large ni trop étroite pour ce besoin. Côté **écriture**, trois failles
financières ont été fermées par `20260918092000` (voir la matrice et
§6ter).

**Points d'attention relevés, non corrigés** (décision produit requise) :

1. **Affectations sans année scolaire.** `enseigne_classe()` ignore
   `affectations_enseignants.annee_scolaire` : un enseignant affecté à
   « 6ème A » l'an dernier voit la « 6ème A » de cette année si
   l'affectation n'est pas supprimée au changement d'année. À traiter par
   une procédure de bascule d'année, ou en filtrant sur l'année courante de
   l'école.
2. **Directeur et `profils.id`.** `profils` n'a pas de grants de colonnes :
   un directeur peut réécrire l'`id` d'un profil de son école vers un compte
   Auth encore sans profil. Aucun accès inter-écoles n'en découle (le
   trigger fige `ecole_id`), mais un `GRANT UPDATE` par colonne sur
   `profils` le fermerait.
3. **Parent multi-écoles.** Par conception (§5.1), les policies parent ne
   filtrent pas sur `ecole_id` : un parent voit ses enfants dans toutes les
   écoles où un directeur l'a rattaché. En revanche, `ecoles` et
   `notifications` ne lui montrent que son école principale.

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
6. Une colonne porte-t-elle un état financier, un horodatage qui fait foi
   ou un privilège ? → la retirer des grants **`INSERT` et `UPDATE`** de
   `authenticated` (`REVOKE ALL ... FROM authenticated` puis grants
   explicites : sur Supabase, les privilèges par défaut donnent tout à
   `authenticated` sur une table neuve).
7. Écrire les assertions dans le harnais (`supabase/tests/03_…` à `08_…`) :
   une par (rôle, action), y compris les refus, et vérifier qu'une
   mutation de la policy fait bien échouer le test. Puis vérifier les
   *Security Advisors* du dashboard Supabase.

Rappel de `SECURITY_RULES.md` §2 : **si la réponse à l'une de ces questions
est « non », la migration ne se déploie pas.**

---

## 6bis. Notifications

Migrations `20260918090000_notifications.sql` et
`20260918091000_notifications_automatiques.sql`.

### Schéma

| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `ecole_id` | `uuid` NOT NULL | FK `ecoles`, cascade |
| `user_id` | `uuid` NOT NULL | Destinataire. FK composite `(ecole_id, user_id)` → `profils (ecole_id, id)`, cascade |
| `role_cible` | `role_utilisateur` NULL | Renseigné si l'envoi visait tout un rôle ; jamais `super_admin` |
| `eleve_id` | `uuid` NULL | Élève concerné. FK composite vers `eleves`, cascade |
| `type` | `type_notification` | `echeance_retard`, `nouvelle_note`, `paiement_confirme` |
| `message` | `text` | 1 à 1 000 caractères |
| `lu` | `boolean` | défaut `false` ; seule colonne modifiable par le client |
| `created_at` | `timestamptz` | |

**Envoi à un rôle = une ligne par destinataire.** `notifier_role()` crée
une ligne par membre **actif** du rôle au moment de l'envoi, avec
`role_cible` pour la trace. Une ligne unique partagée par le rôle aurait
un `lu` commun : un caissier la marquant lue la ferait disparaître chez ses
collègues, c'est-à-dire l'écriture d'un utilisateur sur ce qu'un autre
voit. `user_id` est donc toujours renseigné, et un compte arrivé après
l'envoi ne reçoit pas les anciennes notifications.

### Policies et privilèges

| Policy | Action | Condition |
|---|---|---|
| `notifications_select_destinataire` | SELECT | `user_id = auth.uid()` **et** `ecole_id = mon_ecole_id()` |
| `notifications_update_destinataire` | UPDATE | idem (USING et WITH CHECK) ; grant limité à `lu` |

Pas d'INSERT ni de DELETE pour `authenticated` (ni grant, ni policy).
Directeur et super_admin ne lisent pas les notifications des autres : c'est
une correspondance personnelle, pas une donnée de pilotage. La suppression
est réservée au `service_role` (purge de rétention) : une notification
de retard envoyée à un parent peut servir de preuve de relance.

### Qui crée les notifications

| Émetteur | Comment |
|---|---|
| Edge Function (`service_role`) | `select public.notifier_utilisateur(ecole, user, type, message [, eleve])` ou `public.notifier_role(ecole, role, type, message [, eleve])` |
| Trigger `paiements_notifier_confirmation` | Paiement qui **entre** dans l'état `confirme` (INSERT ou UPDATE) → parents de l'élève |
| Trigger `echeances_notifier_retard` | Échéance qui **passe** en `en_retard` (tâche quotidienne, annulation d'un paiement…) → parents de l'élève. Rien à l'INSERT d'une échéance déjà échue (reprise d'historique) |

Les deux fonctions de création sont `SECURITY INVOKER` et exécutables par
le seul `service_role` : même un grant d'exécution accordé par erreur à
`authenticated` resterait sans effet, l'INSERT interne lui étant refusé.

Les triggers **n'interrompent jamais l'écriture financière** : une erreur
d'envoi est attrapée et journalisée en `WARNING` dans les logs Postgres.

### Invariants

1. Aucun utilisateur ne crée de notification, ni pour lui ni pour un autre.
2. Un destinataire appartient toujours à l'école de la notification (FK).
3. Le client ne modifie que `lu`, et seulement sur ses propres lignes.
4. Une notification ne fait jamais échouer le paiement ou l'échéance qui
   la déclenche.

### Pour le frontend

- Cloche : `from('notifications').select('*').order('created_at', { ascending: false })`
  — la RLS filtre déjà ; `lu = false` pour le compteur.
- Marquer lue : `update({ lu: true }).eq('id', …)`. Tout autre champ
  renvoie 42501.
- Temps réel : pour Supabase Realtime, ajouter la table à la publication
  (`alter publication supabase_realtime add table public.notifications;`).
  Non fait dans cette migration (la publication n'existe pas en local) ;
  Realtime respecte la RLS.
- Portail parent : filtrer sur `eleve_id` pour l'enfant sélectionné.

---

## 6ter. Clôtures de caisse

Migration `20260918093000_clotures_caisse.sql`, qui s'appuie sur
`20260918092000_ecritures_financieres_bornees.sql`.

### Schéma

| Colonne | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `ecole_id` | `uuid` NOT NULL | FK `ecoles`, cascade |
| `caissier_id` | `uuid` NOT NULL | Le « poste ». FK composite `(ecole_id, caissier_id)` → `profils`, **`ON DELETE RESTRICT`** |
| `date_cloture` | `date` | Journée de caisse clôturée |
| `montant_total_encaisse` | `numeric(12,2)` | **Calculé** par le trigger |
| `nombre_operations` | `integer` | **Calculé** par le trigger |
| `created_at` | `timestamptz` | Forcé à `now()` |

`UNIQUE (ecole_id, caissier_id, date_cloture)` : une clôture par poste et
par jour.

### La journée de caisse

`jour_caisse(ts) = (ts AT TIME ZONE 'Africa/Nouakchott')::date` (UTC+0, sans
heure d'été ; fuseau explicite pour ne pas dépendre du `TimeZone` de la
session). La journée d'un encaissement est celle de son
**enregistrement** : `jour_caisse(paiements.created_at)`. Depuis
`20260918092000`, `created_at` ne peut plus être fourni par le client ; et
`paye_le`, qui l'a longtemps été, n'est pas utilisé pour la caisse.

### Totaux

À l'INSERT, le trigger `clotures_caisse_calcul` (`SECURITY DEFINER`, pour
compter **tous** les paiements du poste et pas seulement ceux que voit
l'appelant) calcule :

- `montant_total_encaisse` = somme des paiements `confirme` enregistrés par
  ce caissier ce jour-là ;
- `nombre_operations` = leur nombre.

Un chèque ou un mobile money `en_attente` n'y figure pas. C'est un
**instantané** : une confirmation ou une annulation faite ensuite par le
serveur ne réécrit pas la clôture.

### Contrainte métier : aucun encaissement après la clôture

Imposée **par la base**, trigger `paiements_verrou_cloture`, pour tous les
rôles y compris le `service_role` :

- INSERT d'un paiement dont le poste (`encaisse_par`) a clôturé la journée
  → refus **`ES001`** ;
- UPDATE qui changerait `montant`, `encaisse_par`, `ecole_id` ou
  `created_at` d'un paiement d'une journée close, ou y ferait entrer un
  paiement → refus `ES001` ;
- un changement de `statut` (confirmation de chèque, annulation) ou de
  `note` reste permis.

**Concurrence.** La clôture et l'encaissement prennent le même verrou
consultatif transactionnel `(poste, jour)`. Un encaissement en cours au
moment de la clôture est attendu puis compté ; un encaissement lancé
pendant une clôture en cours est attendu puis refusé. Les deux cas sont
testés sur deux connexions réelles (`08_test_concurrence_cloture.sql`). Ce
mécanisme suppose l'isolation `READ COMMITTED` (défaut de Supabase et de
PostgREST).

### Policies et privilèges

| Policy | Action | Condition |
|---|---|---|
| `clotures_select_super_admin` | SELECT | `est_super_admin()` |
| `clotures_select_directeur` | SELECT | directeur, `ecole_id = mon_ecole_id()` |
| `clotures_select_caissier` | SELECT | caissier, son école, `caissier_id = auth.uid()` |
| `clotures_insert_caissier` | INSERT | caissier, son école, `caissier_id = auth.uid()`, `date_cloture <= jour_caisse(now())` |

Grants : `SELECT`, et `INSERT (ecole_id, caissier_id, date_cloture)`. Ni
UPDATE ni DELETE : une clôture est définitive côté client. Une correction
passe par le `service_role`, qui doit **supprimer la clôture avant** de
toucher aux encaissements de la journée. Un caissier qui a clôturé ne se
supprime pas, il se désactive (`actif = false`).

### Invariants

1. Les totaux d'une clôture viennent de la base, jamais du client.
2. Une journée clôturée n'accepte plus aucun encaissement de ce poste, quel
   que soit le rôle de l'appelant.
3. La journée d'un encaissement est fixée par l'horloge du serveur.
4. Une clôture n'est ni modifiable ni supprimable depuis le client.
5. Un caissier ne voit que ses propres clôtures ; le directeur voit toutes
   celles de son école.

### Pour le frontend (écran « Clôturer la caisse du jour »)

- Clôturer : `insert({ ecole_id, caissier_id: userId, date_cloture })` puis
  `.select()` pour relire les totaux calculés. N'envoyer **ni** total **ni**
  nombre d'opérations : 42501.
- `date_cloture` : la journée de Nouakchott, soit la date **UTC**
  (`new Date().toISOString().slice(0, 10)`), et non la date locale du
  navigateur.
- Déjà clôturé : l'INSERT échoue en `23505` → afficher « caisse déjà
  clôturée ».
- Après clôture, un encaissement échoue avec `code = 'ES001'` → afficher
  « caisse clôturée pour aujourd'hui », et désactiver le bouton
  d'encaissement quand une clôture du jour existe
  (`from('clotures_caisse').select('id').eq('caissier_id', userId).eq('date_cloture', jour)`).
- Journal du jour : regrouper les paiements par `created_at` (en UTC), pas
  par `paye_le`, pour afficher exactement ce que la clôture comptera.
- Le directeur encaisse aussi (`encaisse_par` = lui) mais ne clôture pas :
  son poste n'a pas de clôture (voir §9).

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
| `caissier.demo@ecosurv.test` | `caissier` | Paiements de l'école, + élèves et échéances en lecture |
| `parent1.demo@ecosurv.test` | `parent` | 2 enfants (fratrie) |
| `parent2.demo@ecosurv.test` | `parent` | 1 enfant |

Les mots de passe sont choisis à la création et **ne figurent nulle part dans
ce dépôt**. Le domaine `.test` est réservé par la RFC 6761 : ces adresses ne
peuvent correspondre à aucune boîte réelle.

Toutes ces données sont fictives (`SECURITY_RULES.md` §5). Repères visuels :
école préfixée `[DÉMO]`, matricules `DEMO-`, transactions `DEMO-TRX-`.

> **Nom de l'école de démo.** En base, c'est **« [DÉMO] Groupe Scolaire Al
> Anwar »**, identifiant `11111111-1111-1111-1111-111111111111`, 10 élèves au
> seed. « Lycée Privé Al-Amel Nouakchott » est l'école **fictive** de
> `src/lib/mockData.ts`, côté frontend : elle n'a jamais existé en base.

### Retrait de la démo de la production

Le passage en production supprime l'école de démo et ses 6 comptes, avec
les scripts de `supabase/ops/purge_demo/`, **exécutés à la main par
Elhadj** dans le SQL Editor, dans cet ordre :

1. `01_verification.sql` : un seul `SELECT`, en lecture seule. Il liste
   toutes les écoles, les lignes que la purge supprimerait table par
   table, les garde-fous (bloquants) et les points à revoir, puis produit
   la ligne `c_attendu`.
2. `02_purge_donnees_demo.sql` : un seul bloc `DO`, atomique, en
   **simulation par défaut** (il supprime puis annule tout, et affiche
   le bilan sous la forme d'une erreur « SIMULATION RÉUSSIE »). En mode
   réel (`c_executer = true`), il exige `c_attendu` et refuse si les
   suppressions diffèrent des chiffres validés ; il compare aussi
   l'empreinte md5 de toutes les lignes des autres écoles avant et
   après. Aucun `DROP`/`TRUNCATE`, chaque `DELETE` porte sur
   l'identifiant de la démo.
3. `03_purge_comptes_auth_demo.sql` (ou le dashboard, Authentication →
   Users) : les 6 comptes, désignés par leur email exact.

Garde-fous qui font refuser le script 02 : nom d'école différent de celui
validé, profil de démo référencé par une autre école, compte non-démo
rattaché à l'école de démo, plus aucun super_admin actif après la purge,
écriture concurrente (abandon après 5 s).

Après la purge, les seeds `01` et `02` **refusent de tourner** sur une
base qui contient une autre école que la démo, sous psql comme dans le
SQL Editor. Ils restent utilisables sur une base de test locale vierge.

---

## 9. Ce qui reste à faire

Points ouverts à la fin de ce lot, à traiter **avant une mise en production
réelle**. Ils ont été revus et acceptés comme non bloquants pour la
livraison du socle de données : la base est exploitable en développement et
en démonstration en l'état.

1. **Planifier `rafraichir_statuts_echeances()`** (§5). Sans cela, les
   retards ne basculent pas d'eux-mêmes. À faire avant la première école
   cliente réelle, sous peine de sous-estimer le recouvrement.
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
   sont des données de mineurs au sens de `SECURITY_RULES.md` §5. La table
   `notes` devra aussi ouvrir la lecture au directeur et au super_admin (voir
   « Vérification du cloisonnement », §6).

Ajoutés par le lot `feat/backend-real-actions` (18/09/2026) :

8. **Seed de démonstration cassé** (antérieur à ce lot) :
   `supabase/seed/01_donnees_test.sql` insère encore des paiements `sedad`,
   valeur retirée de l'enum par `20260910170000`. Le seed échoue donc sur
   une base à jour. Correctif trivial à faire dans une branche dédiée :
   `sedad` → `masrvi`, `virement` → `cheque`, comme dans la migration.
9. **Clôture du poste directeur** : le directeur peut encaisser, mais aucune
   policy ne lui permet de clôturer son propre poste. À trancher côté
   produit : soit il ne manipule jamais d'espèces, soit on ajoute
   `clotures_insert_directeur` (sa propre caisse uniquement).
10. **Écart de caisse** : la clôture fige le total théorique. Un champ
    `montant_compte` (espèces réellement comptées, saisi par le caissier)
    permettrait d'enregistrer l'écart ; il ne doit pas remplacer le total
    calculé.
11. **Realtime** : ajouter `notifications` à la publication
    `supabase_realtime` si la cloche doit se mettre à jour sans recharger.
12. **Points d'attention RLS** listés dans « Vérification du cloisonnement »
    (§6) : année scolaire des affectations, grants de colonnes sur
    `profils`.

---

## 10. Invariants backend à ne jamais casser

1. Aucune table de données d'école sans `ecole_id` **et** sans policy RLS.
2. La `service_role key` ne quitte jamais l'environnement des Edge Functions.
3. Un paiement n'est `confirme` que par le serveur, jamais par le client —
   seule exception : les espèces remises en main propre au guichet.
4. `echeances.statut` et `echeances.montant_paye` restent calculés : ne
   jamais les rendre écrivables depuis le client, ni en UPDATE ni en INSERT.
5. Aucune donnée réelle d'élève ou de parent hors production.
6. Un changement de `role` ou d'`ecole_id` ne s'obtient jamais par
   auto-modification de son propre profil.
7. Aucune notification n'est créée par un client ; chacun ne lit que les
   siennes.
8. Les totaux d'une clôture sont calculés par la base, et une journée
   clôturée n'accepte plus aucun encaissement de ce poste.
9. La date d'un encaissement vient de l'horloge du serveur, jamais du
   navigateur.
