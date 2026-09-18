-- =====================================================================
-- EcoSurv — Purge de l'école de démonstration : ÉTAPE 1, VÉRIFICATION
--
-- LECTURE SEULE. Un unique SELECT : rien n'est écrit, rien n'est
-- supprimé. À exécuter tel quel dans le SQL Editor Supabase (le SQL
-- Editor n'affiche que le résultat de la dernière requête : tout est
-- donc regroupé dans un seul résultat, à lire de haut en bas).
--
-- Colonnes du résultat :
--   section   A. écoles en base / B. lignes qui seraient supprimées /
--             C. garde-fous bloquants / D. points à revoir / E. à recopier
--   controle  ce qui est mesuré
--   valeur    le chiffre ou la liste lue en base
--   verdict   OK, BLOQUANT, À REVOIR, CIBLE, conservée...
--
-- Avant de passer à l'étape 2 :
--   - la ligne A « CIBLE » doit être l'école de démonstration, et elle
--     seule ;
--   - toutes les lignes C doivent être « OK » ;
--   - les chiffres B doivent correspondre à ce que vous attendez ;
--   - les lignes D doivent avoir été lues et comprises ;
--   - la ligne E est à recopier dans 02_purge_donnees_demo.sql
--     (constante c_attendu).
--
-- L'école ciblée est désignée par son IDENTIFIANT, pas par son nom :
--   11111111-1111-1111-1111-111111111111
-- C'est l'identifiant fixe posé par supabase/seed/01_donnees_test.sql.
-- =====================================================================

with params as (
  select '11111111-1111-1111-1111-111111111111'::uuid as ecole_id,
         'superadmin.demo@ecosurv.test'::text          as email_super_admin_demo,
         -- Les 5 comptes de démo rattachés à l'école (le 6e, super_admin,
         -- n'a pas d'école).
         array['directeur.demo@ecosurv.test',
               'enseignant.demo@ecosurv.test',
               'caissier.demo@ecosurv.test',
               'parent1.demo@ecosurv.test',
               'parent2.demo@ecosurv.test']::text[]    as emails_ecole_demo
),

-- Profils qui seront supprimés : ceux de l'école de démo, plus le
-- super_admin de démo (ecole_id NULL), identifié par l'email de son
-- compte Auth et par son rôle — jamais par son seul rôle.
profils_cibles as (
  select p.id
    from public.profils p, params
   where p.ecole_id = params.ecole_id
  union
  select p.id
    from public.profils p
    join auth.users u on u.id = p.id, params
   where p.ecole_id is null
     and p.role = 'super_admin'
     and u.email = params.email_super_admin_demo
),

-- Tables créées par la PR #11 : peut-être pas encore appliquées. Le
-- comptage passe par query_to_xml pour ne pas échouer si elles manquent
-- (NULL = table absente).
optionnelles as (
  select t.nom,
         case when to_regclass('public.' || t.nom) is null then null
              else (xpath('/row/n/text()',
                      query_to_xml(format('select count(*) as n from public.%I where ecole_id = %L',
                                          t.nom, (select ecole_id from params)),
                                   false, true, '')))[1]::text::bigint
         end as n
    from (values ('clotures_caisse'), ('notifications')) as t(nom)
),

-- B. Lignes qui seraient supprimées, dans l'ordre de suppression.
comptes as (
  select 1 as rang, 'clotures_caisse' as cle, (select n from optionnelles where nom = 'clotures_caisse') as n
  union all select 2, 'notifications', (select n from optionnelles where nom = 'notifications')
  union all select 3, 'parents_eleves',
    (select count(*) from public.parents_eleves where ecole_id = (select ecole_id from params))
  union all select 4, 'affectations_enseignants',
    (select count(*) from public.affectations_enseignants where ecole_id = (select ecole_id from params))
  union all select 5, 'absences',
    (select count(*) from public.absences where ecole_id = (select ecole_id from params))
  union all select 6, 'paiements',
    (select count(*) from public.paiements where ecole_id = (select ecole_id from params))
  union all select 7, 'echeances',
    (select count(*) from public.echeances where ecole_id = (select ecole_id from params))
  union all select 8, 'eleves',
    (select count(*) from public.eleves where ecole_id = (select ecole_id from params))
  union all select 9, 'profils_ecole',
    (select count(*) from public.profils where ecole_id = (select ecole_id from params))
  union all select 10, 'profil_super_admin',
    (select count(*) from profils_cibles c join public.profils p on p.id = c.id where p.ecole_id is null)
  union all select 11, 'ecoles',
    (select count(*) from public.ecoles where id = (select ecole_id from params))
),

lignes as (
  -- -------------------------------------------------------------------
  -- A. Toutes les écoles présentes, pour voir ce qui est ciblé et ce qui
  --    est conservé.
  -- -------------------------------------------------------------------
  select 100 + row_number() over (order by (e.id = params.ecole_id) desc, e.created_at) as ordre,
         'A. Écoles en base' as section,
         e.nom as controle,
         e.id::text || ' — ' ||
           (select count(*) from public.eleves  x where x.ecole_id = e.id) || ' élève(s), ' ||
           (select count(*) from public.profils x where x.ecole_id = e.id) || ' compte(s), créée le ' ||
           to_char(e.created_at, 'DD/MM/YYYY') as valeur,
         case when e.id = params.ecole_id then 'CIBLE — sera supprimée'
              else 'conservée' end as verdict
    from public.ecoles e, params

  union all
  select 199, 'A. Écoles en base', 'École ciblée (id 11111111-…)',
         coalesce((select nom from public.ecoles where id = params.ecole_id), '(introuvable)'),
         case when exists (select 1 from public.ecoles where id = params.ecole_id)
              then 'nom exact à recopier dans c_nom_ecole'
              else 'BLOQUANT — aucune école avec cet identifiant' end
    from params

  -- -------------------------------------------------------------------
  -- B. Lignes qui seraient supprimées
  -- -------------------------------------------------------------------
  union all
  select 200 + c.rang, 'B. Lignes supprimées', c.cle,
         coalesce(c.n::text, 'table absente (migration non appliquée)'),
         case when c.n is null then 'rien à faire' else 'sera supprimé' end
    from comptes c

  union all
  select 290, 'B. Lignes supprimées', 'auth.users (6 comptes de démo, étape 3)',
         (select count(*) from auth.users u, params
           where u.email = params.email_super_admin_demo
              or u.email = any (params.emails_ecole_demo))::text || ' / 6 : ' ||
         coalesce((select string_agg(u.email, ', ' order by u.email) from auth.users u, params
                    where u.email = params.email_super_admin_demo
                       or u.email = any (params.emails_ecole_demo)), '(aucun)'),
         'supprimés à l''étape 3'
    from params

  -- -------------------------------------------------------------------
  -- C. Garde-fous : doivent tous être OK, sinon le script 02 refuse.
  -- -------------------------------------------------------------------

  -- Un profil de démo référencé par une AUTRE école : sa suppression
  -- toucherait cette école (liaison supprimée en cascade, ou encaisse_par
  -- / saisie_par remis à NULL).
  union all
  select 301, 'C. Garde-fous', 'Liens parent-élève d''une autre école vers un profil de démo',
         count(*)::text, case when count(*) = 0 then 'OK' else 'BLOQUANT' end
    from public.parents_eleves pe, params
   where pe.parent_id in (select id from profils_cibles) and pe.ecole_id <> params.ecole_id

  union all
  select 302, 'C. Garde-fous', 'Paiements d''une autre école encaissés par un profil de démo',
         count(*)::text, case when count(*) = 0 then 'OK' else 'BLOQUANT' end
    from public.paiements pa, params
   where pa.encaisse_par in (select id from profils_cibles) and pa.ecole_id <> params.ecole_id

  union all
  select 303, 'C. Garde-fous', 'Absences d''une autre école saisies par un profil de démo',
         count(*)::text, case when count(*) = 0 then 'OK' else 'BLOQUANT' end
    from public.absences ab, params
   where ab.saisie_par in (select id from profils_cibles) and ab.ecole_id <> params.ecole_id

  -- Un compte qui n'est PAS l'un des 5 comptes de démo mais qui est
  -- rattaché à l'école de démo : peut-être un vrai compte (Babacar,
  -- Elhadj, un testeur) rattaché là pendant les essais. Son profil serait
  -- supprimé. Le script 02 refuse tant qu'il n'est pas explicitement
  -- autorisé (constante c_autres_comptes_autorises) ou déplacé.
  union all
  select 304, 'C. Garde-fous', 'Comptes de l''école démo qui ne sont PAS des comptes de démo',
         count(*)::text || coalesce(' : ' || string_agg(coalesce(u.email, p.email, p.id::text) || ' (' || p.role || ')', ', '), ''),
         case when count(*) = 0 then 'OK' else 'BLOQUANT — à confirmer un par un' end
    from public.profils p
    left join auth.users u on u.id = p.id, params
   where p.ecole_id = params.ecole_id
     and coalesce(u.email, '') <> all (params.emails_ecole_demo)

  -- Après la purge, il doit rester au moins un super_admin actif, sinon
  -- plus personne n'accède à la console de gestion des écoles.
  union all
  select 305, 'C. Garde-fous', 'Super admins actifs qui RESTERONT après la purge',
         count(*)::text || coalesce(' : ' || string_agg(coalesce(u.email, p.id::text), ', '), ''),
         case when count(*) > 0 then 'OK' else 'BLOQUANT — créer d''abord le vrai compte super_admin' end
    from public.profils p
    left join auth.users u on u.id = p.id
   where p.role = 'super_admin' and p.actif
     and p.id not in (select id from profils_cibles)

  -- -------------------------------------------------------------------
  -- D. Points à revoir : non bloquants, mais à lire avant de valider.
  -- -------------------------------------------------------------------

  -- Lignes de l'école démo qui ne viennent pas du seed : saisies depuis
  -- l'application pendant les essais. Elles seront supprimées aussi.
  union all
  select 401, 'D. À revoir', 'Élèves de l''école démo saisis hors seed (matricule non DEMO-)',
         count(*)::text || coalesce(' : ' || string_agg(el.prenom || ' ' || el.nom, ', '), ''),
         case when count(*) = 0 then 'OK' else 'À REVOIR — seront supprimés' end
    from public.eleves el, params
   where el.ecole_id = params.ecole_id and coalesce(el.matricule, '') not like 'DEMO-%'

  union all
  select 402, 'D. À revoir', 'Paiements de l''école démo saisis hors seed (référence non DEMO-TRX-)',
         count(*)::text || ' pour ' || coalesce(sum(pa.montant), 0)::text || ' MRU',
         case when count(*) = 0 then 'OK' else 'À REVOIR — seront supprimés' end
    from public.paiements pa, params
   where pa.ecole_id = params.ecole_id and coalesce(pa.reference_transaction, '') not like 'DEMO-TRX-%'

  -- Autres écoles qui ressemblent à des données de test : NON ciblées par
  -- ce script, signalées pour décision.
  union all
  select 403, 'D. À revoir', 'Autres écoles au nom de test/démo (NON supprimées)',
         count(*)::text || coalesce(' : ' || string_agg(e.nom || ' [' || e.id || ']', ', '), ''),
         case when count(*) = 0 then 'OK' else 'À REVOIR — hors périmètre de ce script' end
    from public.ecoles e, params
   where e.id <> params.ecole_id
     and (e.nom ilike '%test%' or e.nom ilike '%démo%' or e.nom ilike '%demo%')

  union all
  select 404, 'D. À revoir', 'Autres comptes Auth en .test / test.local (NON supprimés)',
         count(*)::text || coalesce(' : ' || string_agg(u.email, ', '), ''),
         case when count(*) = 0 then 'OK' else 'À REVOIR — hors périmètre de ce script' end
    from auth.users u, params
   where (u.email like '%.test' or u.email like '%test.local')
     and u.email <> params.email_super_admin_demo
     and u.email <> all (params.emails_ecole_demo)

  -- -------------------------------------------------------------------
  -- E. Ligne à recopier dans 02_purge_donnees_demo.sql
  -- -------------------------------------------------------------------
  union all
  select 500, 'E. À recopier', 'c_attendu (constante du script 02)',
         (select jsonb_object_agg(cle, coalesce(n, 0))::text from comptes),
         'recopier la valeur entre apostrophes'
)
select section, controle, valeur, verdict
  from lignes
 order by ordre;
