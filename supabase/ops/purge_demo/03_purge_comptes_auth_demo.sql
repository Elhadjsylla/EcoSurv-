-- =====================================================================
--  ███  SUPPRESSION DÉFINITIVE — À LIRE EN ENTIER AVANT D'EXÉCUTER  ███
--
-- EcoSurv — Purge de l'école de démonstration : ÉTAPE 3, COMPTES AUTH
--
-- Supprime les 6 comptes Supabase Auth de démonstration, désignés par
-- leur email EXACT (aucun motif LIKE : un vrai compte ne peut pas être
-- attrapé par erreur). Autonome : utilisable que l'étape 2 ait supprimé
-- des données ou qu'il n'y en ait jamais eu.
--
-- CE QUE LE SCRIPT VÉRIFIE AVANT DE SUPPRIMER (il refuse sinon) :
--   1. aucun de ces comptes n'est référencé HORS du schéma interne auth :
--      le script parcourt toutes les clés étrangères de la base qui
--      pointent vers auth.users (public.profils, et toute table créée à
--      la main dans le SQL Editor) et compte les lignes qui visent ces
--      comptes ; il doit n'y en avoir aucune. Sans ce contrôle, la
--      suppression emporterait en cascade un profil (profils.id est en
--      ON DELETE CASCADE) ou échouerait sur une autre table ;
--   2. aucun fichier Supabase Storage n'appartient à ces comptes (pas de
--      clé étrangère : il deviendrait orphelin sans erreur) ;
--   3. le nombre de comptes supprimés est exactement le nombre trouvé.
-- Ce qui vit DANS le schéma auth (identités, sessions, jetons de
-- rafraîchissement, facteurs MFA) est supprimé en cascade par Supabase
-- avec chaque compte : c'est l'effet voulu, une session de démo encore
-- ouverte ne peut plus se renouveler.
--
-- MODE D'EMPLOI
--   1. Exécuter tel quel (c_executer = false) : SIMULATION. Le script
--      supprime, contrôle, puis annule tout. Il se termine par une
--      « erreur » qui commence par « SIMULATION RÉUSSIE » et indique les
--      comptes trouvés et les tables contrôlées. Rien n'est supprimé.
--      Tout message commençant par « REFUS » ou « ANNULÉ » : ne pas
--      forcer, lire le message.
--   2. Passer c_executer à true, exécuter à nouveau. Succès = la
--      dernière requête affiche 0.
--
-- ALTERNATIVE ÉQUIVALENTE : Authentication > Users dans le dashboard,
-- supprimer les 6 comptes à la main (voie officielle Supabase). Faire
-- quand même tourner la SIMULATION ci-dessus avant : c'est elle qui
-- vérifie qu'aucun compte n'est référencé ailleurs.
-- =====================================================================

do $comptes$
declare
  -- false = SIMULATION (tout est annulé). true = SUPPRESSION RÉELLE.
  c_executer constant boolean := false;

  c_emails constant text[] := array[
    'caissier.demo@ecosurv.test',
    'directeur.demo@ecosurv.test',
    'enseignant.demo@ecosurv.test',
    'parent1.demo@ecosurv.test',
    'parent2.demo@ecosurv.test',
    'superadmin.demo@ecosurv.test'];

  v_ids        uuid[];
  v_trouves    text;
  v_nb         bigint;
  v_supprimes  bigint;
  v_n          bigint;
  v_references text;
  v_controles  text;
  r            record;
begin
  -- 0. Les comptes, par email exact.
  select coalesce(array_agg(id), '{}'),
         coalesce(string_agg(email, ', ' order by email), '(aucun)'),
         count(*)
    into v_ids, v_trouves, v_nb
    from auth.users
   where email = any (c_emails);

  -- 1. Toute clé étrangère vers auth.users hors du schéma auth.
  for r in
    select format('%I.%I', n.nspname, cl.relname) as nom_table,
           a.attname                              as colonne
      from pg_constraint c
      join pg_class cl     on cl.oid = c.conrelid
      join pg_namespace n  on n.oid = cl.relnamespace
      join pg_attribute a  on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f'
       and c.confrelid = 'auth.users'::regclass
       and n.nspname <> 'auth'
       and cardinality(c.conkey) = 1
     order by 1
  loop
    execute format('select count(*) from %s where %I = any ($1)', r.nom_table, r.colonne)
      into v_n using v_ids;
    v_controles := concat_ws(', ', v_controles, r.nom_table || '.' || r.colonne);
    if v_n > 0 then
      v_references := concat_ws(', ', v_references, format('%s.%s : %s ligne(s)', r.nom_table, r.colonne, v_n));
    end if;
  end loop;

  -- 2. Fichiers Storage (colonne owner, sans clé étrangère).
  if exists (select 1 from information_schema.columns
              where table_schema = 'storage' and table_name = 'objects'
                and column_name = 'owner') then
    execute 'select count(*) from storage.objects where owner = any ($1)' into v_n using v_ids;
    v_controles := concat_ws(', ', v_controles, 'storage.objects.owner');
    if v_n > 0 then
      v_references := concat_ws(', ', v_references, format('storage.objects : %s fichier(s)', v_n));
    end if;
  end if;

  if v_references is not null then
    raise exception 'REFUS : des comptes de démo sont encore référencés : %. Rien n''a été supprimé.', v_references
      using hint = 'Un profil restant se retire avec 02_purge_donnees_demo.sql ; toute autre référence est à examiner avant de continuer.';
  end if;

  -- 3. Suppression, par email exact.
  delete from auth.users where email = any (c_emails);
  get diagnostics v_supprimes = row_count;

  if v_supprimes <> v_nb or v_supprimes > 6 then
    raise exception 'ANNULÉ : % compte(s) supprimé(s) pour % trouvé(s). Rien n''a été supprimé.', v_supprimes, v_nb;
  end if;

  if not c_executer then
    raise exception 'SIMULATION RÉUSSIE — rien n''a été supprimé (annulation volontaire). Comptes qui seraient supprimés : % / 6 (%). Références hors schéma auth : aucune (contrôlé : %).',
      v_supprimes, v_trouves, coalesce(v_controles, 'aucune clé étrangère vers auth.users')
      using hint = 'Passer c_executer à true pour supprimer réellement, ou supprimer ces comptes depuis le dashboard.';
  end if;

  raise notice 'COMPTES SUPPRIMÉS : % / 6 (%)', v_supprimes, v_trouves;
end
$comptes$;

-- Constat final (atteint seulement après une suppression réelle) : 0.
select count(*) as comptes_demo_restants
  from auth.users
 where email in ('caissier.demo@ecosurv.test', 'directeur.demo@ecosurv.test',
                 'enseignant.demo@ecosurv.test', 'parent1.demo@ecosurv.test',
                 'parent2.demo@ecosurv.test', 'superadmin.demo@ecosurv.test');
