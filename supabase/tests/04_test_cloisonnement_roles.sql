-- =====================================================================
-- Cloisonnement des rôles — assertions (BACKEND_AGENT.md §6, « Vérification
-- du cloisonnement »). Prérequis : 03_harnais_assertions.sql.
--
-- Vérifie que directeur et super_admin lisent les données des portails
-- (élèves, paiements, échéances, absences, clôtures...) sans franchir la
-- frontière de l'école, et que enseignant / caissier / parent restent
-- strictement dans leur périmètre. Exécuté dans une transaction annulée.
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

-- Deux clôtures (une par école) pour couvrir aussi la nouvelle table.
insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture) values
  ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', current_date - 1),
  ('d0000000-0000-0000-0000-00000000000d', '0000000c-0000-0000-0000-0000000000c3', current_date - 1);

-- Filtres réutilisés : on ne compte que les lignes du jeu C/D.
\set C '''c0000000-0000-0000-0000-00000000000c'''
\set D '''d0000000-0000-0000-0000-00000000000d'''

-- ---------------------------------------------------------------------
-- 0. Structure : aucune table exposée sans RLS, ni à anon
-- ---------------------------------------------------------------------
select tests.egal(
  (select count(*) from pg_tables t
    where t.schemaname = 'public'
      and (not t.rowsecurity
           or not exists (select 1 from pg_policies p
                           where p.schemaname = 'public' and p.tablename = t.tablename))),
  0::bigint, 'structure : toute table public a la RLS active ET au moins une policy');

select tests.egal(
  (select count(*) from information_schema.table_privileges
    where table_schema = 'public' and grantee = 'anon'),
  0::bigint, 'structure : anon n a aucun privilege sur aucune table public');

select tests.egal(
  (select count(*) from pg_policies
    where schemaname = 'public' and roles <> '{authenticated}'),
  0::bigint, 'structure : toutes les policies ciblent authenticated et lui seul');

select tests.egal(
  (select count(*) from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')),
  0::bigint, 'structure : toute fonction SECURITY DEFINER a un search_path fige');

select tests.egal(
  (select count(*) from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and p.prorettype <> 'trigger'::regtype
      and has_function_privilege('anon', p.oid, 'execute')),
  0::bigint, 'structure : anon n execute aucune fonction SECURITY DEFINER appelable');

select tests.egal(to_regclass('public.notes') is null, true,
  'structure : pas de table notes (V2) — rien a ouvrir au directeur pour l instant');

-- ---------------------------------------------------------------------
-- 1. Anon
-- ---------------------------------------------------------------------
select tests.session_anon();
select tests.echoue('select 1 from public.eleves',          '42501', 'anon : eleves');
select tests.echoue('select 1 from public.paiements',       '42501', 'anon : paiements');
select tests.echoue('select 1 from public.notifications',   '42501', 'anon : notifications');
select tests.echoue('select 1 from public.clotures_caisse', '42501', 'anon : clotures_caisse');
reset role;

-- ---------------------------------------------------------------------
-- 2. Directeur C : vue 360° de SON école, rien de D
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.voit('select 1 from public.ecoles',                                         1, 'directeur C : sa seule ecole');
select tests.voit('select 1 from public.ecoles where id = ' || :'D',                     0, 'directeur C : ecole D invisible');
select tests.voit('select 1 from public.profils',                                        6, 'directeur C : les 6 comptes de son ecole');
select tests.voit('select 1 from public.eleves',                                         2, 'directeur C : portail eleves (toutes classes)');
select tests.voit('select 1 from public.parents_eleves',                                 2, 'directeur C : liens parents');
select tests.voit('select 1 from public.echeances',                                      2, 'directeur C : echeances');
select tests.voit('select 1 from public.paiements',                                      2, 'directeur C : portail caissier (paiements)');
select tests.voit('select 1 from public.absences',                                       2, 'directeur C : portail enseignant (absences, toutes classes)');
select tests.voit('select 1 from public.affectations_enseignants',                       1, 'directeur C : affectations');
select tests.voit('select 1 from public.clotures_caisse',                                1, 'directeur C : clotures de son ecole');
select tests.voit('select 1 from public.eleves where ecole_id = ' || :'D',               0, 'directeur C : aucun eleve de D, meme cible');
select tests.voit('select 1 from public.paiements where ecole_id = ' || :'D',            0, 'directeur C : aucun paiement de D');
select tests.voit('select 1 from public.clotures_caisse where ecole_id = ' || :'D',      0, 'directeur C : aucune cloture de D');
select tests.echoue($$insert into public.eleves (ecole_id, nom, prenom) values ('d0000000-0000-0000-0000-00000000000d', 'X', 'Y')$$,
                    '42501', 'directeur C : creer un eleve dans D');
select tests.touche($$update public.eleves set classe = 'X' where ecole_id = 'd0000000-0000-0000-0000-00000000000d'$$,
                    0, 'directeur C : modifier un eleve de D (0 ligne)');
select tests.echoue($$update public.eleves set ecole_id = 'd0000000-0000-0000-0000-00000000000d' where ecole_id = 'c0000000-0000-0000-0000-00000000000c'$$,
                    '42501', 'directeur C : pousser ses eleves vers D');

-- ---------------------------------------------------------------------
-- 3. Directeur D : symétrique
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000d2');
select tests.voit('select 1 from public.profils',          3, 'directeur D : les 3 comptes de son ecole');
select tests.voit('select 1 from public.eleves',           1, 'directeur D : ses eleves seulement');
select tests.voit('select 1 from public.paiements',        1, 'directeur D : ses paiements seulement');
select tests.voit('select 1 from public.absences',         1, 'directeur D : ses absences seulement');
select tests.voit('select 1 from public.clotures_caisse',  1, 'directeur D : ses clotures seulement');

-- ---------------------------------------------------------------------
-- 4. Super admin : tout le parc
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000a0');
select tests.voit('select 1 from public.ecoles where id in (' || :'C' || ',' || :'D' || ')',             2, 'super_admin : les deux ecoles');
select tests.voit('select 1 from public.eleves where ecole_id in (' || :'C' || ',' || :'D' || ')',       3, 'super_admin : eleves des deux ecoles');
select tests.voit('select 1 from public.paiements where ecole_id in (' || :'C' || ',' || :'D' || ')',    3, 'super_admin : paiements des deux ecoles');
select tests.voit('select 1 from public.absences where ecole_id in (' || :'C' || ',' || :'D' || ')',     3, 'super_admin : absences des deux ecoles');
select tests.voit('select 1 from public.echeances where ecole_id in (' || :'C' || ',' || :'D' || ')',    3, 'super_admin : echeances des deux ecoles');
select tests.voit('select 1 from public.clotures_caisse where ecole_id in (' || :'C' || ',' || :'D' || ')', 2, 'super_admin : clotures des deux ecoles');

-- ---------------------------------------------------------------------
-- 5. Enseignant C : sa classe (6eme A), aucune donnée financière
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000e1');
select tests.voit('select 1 from public.profils',                   1, 'enseignant : son seul profil');
select tests.voit('select 1 from public.eleves',                    1, 'enseignant : les eleves de sa classe seulement');
select tests.voit($$select 1 from public.eleves where classe = '5eme B'$$, 0, 'enseignant : pas la classe voisine');
select tests.voit('select 1 from public.absences',                  1, 'enseignant : absences de sa classe seulement');
select tests.voit('select 1 from public.affectations_enseignants',  1, 'enseignant : ses affectations');
select tests.voit('select 1 from public.parents_eleves',            0, 'enseignant : aucun lien parent');
select tests.voit('select 1 from public.echeances',                 0, 'enseignant : aucune echeance');
select tests.voit('select 1 from public.paiements',                 0, 'enseignant : aucun paiement');
select tests.voit('select 1 from public.clotures_caisse',           0, 'enseignant : aucune cloture');
select tests.echoue($$insert into public.absences (ecole_id, eleve_id, date_absence) values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000002', current_date)$$,
                    '42501', 'enseignant : absence hors de sa classe');
select tests.echoue($$insert into public.affectations_enseignants (ecole_id, enseignant_id, classe) values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000e1', '5eme B')$$,
                    '42501', 'enseignant : s auto-affecter une classe');
select tests.echoue($$update public.profils set role = 'directeur' where id = '0000000c-0000-0000-0000-0000000000e1'$$,
                    '42501', 'enseignant : se promouvoir directeur');

-- ---------------------------------------------------------------------
-- 6. Caissier C1 : finances de son école, rien de pédagogique
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000c1');
select tests.voit('select 1 from public.profils',                   1, 'caissier : son seul profil');
select tests.voit('select 1 from public.eleves',                    2, 'caissier : eleves de son ecole (lecture, pour encaisser)');
select tests.voit('select 1 from public.echeances',                 2, 'caissier : echeances de son ecole (lecture)');
select tests.voit('select 1 from public.paiements',                 2, 'caissier : paiements de son ecole');
select tests.voit('select 1 from public.absences',                  0, 'caissier : aucune absence');
select tests.voit('select 1 from public.affectations_enseignants',  0, 'caissier : aucune affectation');
select tests.voit('select 1 from public.parents_eleves',            0, 'caissier : aucun lien parent');
select tests.voit('select 1 from public.eleves where ecole_id = ' || :'D', 0, 'caissier : rien de l ecole D');
select tests.echoue($$insert into public.eleves (ecole_id, nom, prenom) values ('c0000000-0000-0000-0000-00000000000c', 'X', 'Y')$$,
                    '42501', 'caissier : creer un eleve');
select tests.touche($$update public.eleves set classe = 'X'$$, 0, 'caissier : modifier un eleve (0 ligne)');
select tests.echoue($$insert into public.echeances (ecole_id, eleve_id, libelle, montant, date_echeance) values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', 'X', 1, current_date)$$,
                    '42501', 'caissier : creer une echeance');
select tests.echoue($$insert into public.absences (ecole_id, eleve_id, date_absence) values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', current_date)$$,
                    '42501', 'caissier : saisir une absence');

-- ---------------------------------------------------------------------
-- 7. Parent C1 : son enfant, pas celui du parent C2 (même école)
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.profils',                   1, 'parent : son seul profil');
select tests.voit('select 1 from public.eleves',                    1, 'parent : son enfant seulement');
select tests.voit('select 1 from public.parents_eleves',            1, 'parent : son lien seulement');
select tests.voit('select 1 from public.echeances',                 1, 'parent : echeances de son enfant');
select tests.voit('select 1 from public.paiements',                 1, 'parent : paiements de son enfant');
select tests.voit('select 1 from public.absences',                  1, 'parent : absences de son enfant');
select tests.voit('select 1 from public.affectations_enseignants',  0, 'parent : aucune affectation');
select tests.voit('select 1 from public.clotures_caisse',           0, 'parent : aucune cloture');
select tests.echoue($$insert into public.parents_eleves (ecole_id, parent_id, eleve_id) values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f1', '1000000c-0000-0000-0000-000000000002')$$,
                    '42501', 'parent : se declarer tuteur d un autre eleve');
select tests.echoue($$insert into public.paiements (ecole_id, echeance_id, montant, methode, statut) values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 100, 'especes', 'confirme')$$,
                    '42501', 'parent : declarer un paiement');
select tests.touche($$update public.absences set justifiee = true$$, 0, 'parent : justifier une absence (0 ligne)');

-- ---------------------------------------------------------------------
-- 8. Compte désactivé : plus rien
-- ---------------------------------------------------------------------
reset role;
update public.profils set actif = false where id = '0000000c-0000-0000-0000-0000000000d1';
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.voit('select 1 from public.eleves',          0, 'directeur desactive : aucun eleve');
select tests.voit('select 1 from public.paiements',       0, 'directeur desactive : aucun paiement');
select tests.voit('select 1 from public.clotures_caisse', 0, 'directeur desactive : aucune cloture');

reset role;
select tests.bilan('04_test_cloisonnement_roles');
rollback;
