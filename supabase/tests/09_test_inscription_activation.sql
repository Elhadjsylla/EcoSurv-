-- =====================================================================
-- Auto-inscription, écoles en attente, activation et suspension —
-- assertions (migration 20260919090000). Prérequis :
-- 03_harnais_assertions.sql. Transaction annulée.
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

\set C     '''c0000000-0000-0000-0000-00000000000c'''
\set D     '''d0000000-0000-0000-0000-00000000000d'''
\set adm   '''0000000c-0000-0000-0000-0000000000a0'''
\set u1    '''0e000000-0000-4000-8000-000000000001'''
\set u2    '''0e000000-0000-4000-8000-000000000002'''
\set u3    '''0e000000-0000-4000-8000-000000000003'''

-- ---------------------------------------------------------------------
-- 0. Structure
-- ---------------------------------------------------------------------
select tests.egal(
  (select column_default like '%en_attente%' from information_schema.columns
    where table_schema = 'public' and table_name = 'ecoles' and column_name = 'statut_activation'),
  true, 'structure : une nouvelle ecole est en_attente par defaut (fail-closed)');
select tests.egal(has_column_privilege('authenticated', 'public.ecoles', 'statut_activation', 'UPDATE'), false,
  'structure : authenticated ne peut pas UPDATE statut_activation');
select tests.egal(has_column_privilege('authenticated', 'public.ecoles', 'statut_activation_modifie_par', 'UPDATE'), false,
  'structure : ni la trace de modification');
select tests.egal(has_function_privilege('authenticated', 'public.inscrire_ecole_depuis_compte()', 'execute'), false,
  'structure : trigger d inscription non appelable par un client');
select tests.egal(
  (select count(*) from unnest(array['public.mon_statut_acces()',
                                     'public.ecoles_en_attente()',
                                     'public.changer_statut_activation_ecole(uuid, public.statut_activation_ecole)']) f
    where has_function_privilege('anon', f::regprocedure, 'execute')),
  0::bigint, 'structure : aucune RPC d activation executable par anon');

-- ---------------------------------------------------------------------
-- 1. Inscription (le propriétaire joue le rôle de Supabase Auth)
-- ---------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  (:u1, 'directrice@nouvelle-ecole.mr',
   '{"type_inscription": "ecole", "nom_ecole": "École Nouvelle", "nom": "Diop", "prenom": "Aïcha", "telephone": "+222 22 00 00 01", "ville": "Kiffa"}');

select tests.egal((select count(*) from public.ecoles e join public.profils p on p.ecole_id = e.id
                    where p.id = :u1 and e.nom = 'École Nouvelle' and e.statut_activation = 'en_attente'
                      and e.statut_abonnement = 'essai' and e.email = 'directrice@nouvelle-ecole.mr'
                      and p.role = 'directeur' and p.actif and p.nom = 'Diop' and p.prenom = 'Aïcha'),
                  1::bigint, 'inscription : ecole en_attente + profil directeur rattache a CETTE ecole');

-- Métadonnées hostiles : rôle, école et statut sont ignorés.
insert into auth.users (id, email, raw_user_meta_data) values
  (:u2, 'malin@exemple.mr',
   '{"type_inscription": "ecole", "nom_ecole": "Ecole Malin", "nom": "Malin", "role": "super_admin", "ecole_id": "c0000000-0000-0000-0000-00000000000c", "statut_activation": "active"}');
select tests.egal((select p.role::text || '/' || e.statut_activation::text || '/' || (p.ecole_id = :C)::text
                     from public.profils p join public.ecoles e on e.id = p.ecole_id where p.id = :u2),
                  'directeur/en_attente/false',
                  'inscription : role, ecole_id et statut des metadonnees ignores');

-- Compte créé sans intention d'inscrire une école : rien.
insert into auth.users (id, email, raw_user_meta_data) values (:u3, 'invite@exemple.mr', '{"nom": "Invite"}');
select tests.egal((select count(*) from public.profils where id = :u3), 0::bigint,
                  'inscription : compte sans type_inscription = aucune ecole, aucun profil');

-- Données invalides : le COMPTE lui-même n'est pas créé (tout ou rien).
select tests.echoue($$insert into auth.users (email, raw_user_meta_data) values ('sans-nom@exemple.mr', '{"type_inscription": "ecole", "nom": "X"}')$$,
                    '22023', 'inscription : nom_ecole manquant, creation du compte refusee');
select tests.echoue(format($$insert into auth.users (email, raw_user_meta_data) values ('long@exemple.mr', %L)$$,
                           jsonb_build_object('type_inscription', 'ecole', 'nom_ecole', repeat('x', 151), 'nom', 'X')),
                    '22023', 'inscription : nom_ecole trop long refuse');
select tests.echoue($$insert into auth.users (email, raw_user_meta_data) values (null, '{"type_inscription": "ecole", "nom_ecole": "E", "nom": "X"}')$$,
                    '22023', 'inscription : email obligatoire');
-- Échec au moment du profil : l'école déjà insérée est annulée avec le compte.
alter table public.profils add constraint test_panne check (nom <> 'Panne') not valid;
select tests.echoue($$insert into auth.users (email, raw_user_meta_data) values ('panne@exemple.mr', '{"type_inscription": "ecole", "nom_ecole": "Ecole Panne", "nom": "Panne"}')$$,
                    '23514', 'inscription : echec a la creation du profil...');
alter table public.profils drop constraint test_panne;
select tests.egal((select count(*) from public.ecoles where nom in ('Ecole Panne', 'x')) +
                  (select count(*) from auth.users where email in ('sans-nom@exemple.mr', 'long@exemple.mr', 'panne@exemple.mr')),
                  0::bigint, '... ni ecole ni compte ne subsistent (atomicite)');

-- ---------------------------------------------------------------------
-- 2. Directeur d'une école en attente : écran d'attente, aucune donnée
-- ---------------------------------------------------------------------
select tests.session(:u1);
select tests.egal((select role::text || '/' || statut_activation::text || '/' || acces_donnees::text || '/' || ecole_nom
                     from public.mon_statut_acces()),
                  'directeur/en_attente/false/École Nouvelle', 'en attente : mon_statut_acces pour l ecran d attente');
select tests.voit('select 1 from public.profils', 1, 'en attente : lit son propre profil');
select tests.voit($$select 1 from public.ecoles where statut_activation = 'en_attente'$$, 1, 'en attente : lit la fiche de son ecole');
select tests.voit('select 1 from public.ecoles', 1, 'en attente : aucune autre ecole');
select tests.voit('select 1 from public.eleves',                   0, 'en attente : aucun eleve');
select tests.voit('select 1 from public.echeances',                0, 'en attente : aucune echeance');
select tests.voit('select 1 from public.paiements',                0, 'en attente : aucun paiement');
select tests.voit('select 1 from public.clotures_caisse',          0, 'en attente : aucune cloture');
select tests.voit('select 1 from public.notifications',            0, 'en attente : aucune notification');
select tests.echoue(format($$insert into public.eleves (ecole_id, nom, prenom) select ecole_id, 'X', 'Y' from public.profils where id = %L$$, '0e000000-0000-4000-8000-000000000001'),
                    '42501', 'en attente : inscrire un eleve refuse');
select tests.echoue(format($$insert into public.profils (id, ecole_id, role, nom) select '0e000000-0000-4000-8000-000000000003', ecole_id, 'caissier', 'Z' from public.profils where id = %L$$, '0e000000-0000-4000-8000-000000000001'),
                    '42501', 'en attente : creer un compte du personnel refuse');
select tests.echoue($$update public.ecoles set statut_activation = 'active'$$, '42501', 'en attente : s auto-activer par UPDATE refuse');
select tests.touche($$update public.ecoles set nom = 'Renommee'$$, 0, 'en attente : modifier la fiche de l ecole (0 ligne)');
select tests.echoue($$select public.changer_statut_activation_ecole((select ecole_id from public.profils where id = '0e000000-0000-4000-8000-000000000001'), 'active')$$,
                    '42501', 'en attente : s auto-activer par RPC refuse');
select tests.echoue('select * from public.ecoles_en_attente()', '42501', 'en attente : lister les ecoles en attente refuse');
select tests.echoue($$update public.profils set role = 'super_admin' where id = '0e000000-0000-4000-8000-000000000001'$$, '42501', 'en attente : changer son role refuse');
select tests.touche($$update public.profils set telephone = '+222 22 00 00 09' where id = '0e000000-0000-4000-8000-000000000001'$$, 1, 'en attente : corriger son telephone permis');

-- ---------------------------------------------------------------------
-- 3. Super admin : toutes les écoles, liste et activation
-- ---------------------------------------------------------------------
reset role;
update auth.users set email_confirmed_at = now() where id = :u1;

select tests.session(:adm);
select tests.voit(format($$select 1 from public.ecoles where id in (%L, %L) or nom in ('École Nouvelle', 'Ecole Malin')$$,
                         'c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d'),
                  4, 'super_admin : voit toutes les ecoles, actives ET en attente');
select tests.voit(format('select 1 from public.eleves where ecole_id in (%L, %L)', 'c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d'),
                  3, 'super_admin : eleves de plusieurs ecoles');
select tests.voit(format('select 1 from public.paiements where ecole_id in (%L, %L)', 'c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d'),
                  3, 'super_admin : paiements de plusieurs ecoles');
select tests.egal((select acces_donnees from public.mon_statut_acces()), true, 'super_admin : acces_donnees vrai sans ecole');
select tests.egal((select count(*) from public.ecoles_en_attente()), 2::bigint, 'super_admin : 2 ecoles en attente');
select tests.egal((select directeur_email || '/' || email_confirme::text from public.ecoles_en_attente() where nom = 'École Nouvelle'),
                  'directrice@nouvelle-ecole.mr/true', 'super_admin : directeur et email confirme affiches');
select tests.egal((select email_confirme from public.ecoles_en_attente() where nom = 'Ecole Malin'), false,
                  'super_admin : email non confirme signale');
select tests.egal(public.changer_statut_activation_ecole((select ecole_id from public.profils where id = :u1), 'active')::text,
                  'active', 'super_admin : active l ecole');
select tests.egal((select (statut_activation_modifie_par = :adm::uuid and statut_activation_modifie_le is not null)
                     from public.ecoles where nom = 'École Nouvelle'),
                  true, 'super_admin : activation tracee (qui, quand)');
select tests.egal((select count(*) from public.ecoles_en_attente()), 1::bigint, 'super_admin : plus qu une en attente');
select tests.echoue($$select public.changer_statut_activation_ecole('99999999-9999-9999-9999-999999999999', 'active')$$,
                    'P0002', 'super_admin : ecole inconnue signalee');

-- La directrice activée accède à SON école, et à elle seule.
select tests.session(:u1);
select tests.egal((select acces_donnees from public.mon_statut_acces()), true, 'activee : acces_donnees vrai');
select tests.touche(format($$insert into public.eleves (ecole_id, nom, prenom, classe) select ecole_id, 'Ba', 'Sidi', '6eme A' from public.profils where id = %L$$, '0e000000-0000-4000-8000-000000000001'),
                    1, 'activee : inscrit un eleve dans son ecole');
select tests.voit('select 1 from public.eleves', 1, 'activee : voit son seul eleve');
select tests.voit(format('select 1 from public.eleves where ecole_id = %L', 'c0000000-0000-0000-0000-00000000000c'), 0, 'activee : rien de l ecole C');

-- Le serveur (service_role, sans utilisateur) ne peut pas activer : la
-- décision appartient à un compte super_admin identifié.
select tests.session_serveur();
select tests.echoue($$select public.changer_statut_activation_ecole('c0000000-0000-0000-0000-00000000000c', 'suspendue')$$,
                    '42501', 'service_role sans utilisateur : activation refusee');
select tests.session_anon();
select tests.echoue('select * from public.mon_statut_acces()', '42501', 'anon : mon_statut_acces refuse');
reset role;

-- ---------------------------------------------------------------------
-- 4. Suspension d'une école en service (C) : tout est coupé, sauf
--    l'écran de suspension. L'école D n'est pas affectée.
-- ---------------------------------------------------------------------
-- Parent D rattaché aussi à un enfant de C (parent multi-écoles, §5.1).
insert into public.parents_eleves (ecole_id, parent_id, eleve_id, lien)
values (:C, '0000000c-0000-0000-0000-0000000000f3', '1000000c-0000-0000-0000-000000000002', 'tuteur');
select public.notifier_utilisateur(:C, '0000000c-0000-0000-0000-0000000000f1', 'echeance_retard', 'Rappel');

select tests.session('0000000c-0000-0000-0000-0000000000f3');
select tests.voit('select 1 from public.eleves', 2, 'avant suspension : parent D voit son enfant de D et celui de C');

select tests.session(:adm);
select tests.egal(public.changer_statut_activation_ecole(:C, 'suspendue')::text, 'suspendue', 'super_admin : suspend l ecole C');

select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.egal((select statut_activation::text || '/' || acces_donnees::text from public.mon_statut_acces()),
                  'suspendue/false', 'suspendue : mon_statut_acces pour l ecran de suspension');
select tests.voit('select 1 from public.ecoles', 1, 'suspendue : le directeur lit encore la fiche de son ecole');
select tests.voit('select 1 from public.profils', 1, 'suspendue : directeur ne voit plus que son profil');
select tests.voit('select 1 from public.eleves',    0, 'suspendue : directeur, aucun eleve');
select tests.voit('select 1 from public.paiements', 0, 'suspendue : directeur, aucun paiement');
select tests.voit('select 1 from public.absences',  0, 'suspendue : directeur, aucune absence');
select tests.echoue($$insert into public.absences (ecole_id, eleve_id, date_absence) values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', current_date)$$,
                    '42501', 'suspendue : directeur, aucune ecriture');
select tests.session('0000000c-0000-0000-0000-0000000000e1');
select tests.voit('select 1 from public.eleves',                   0, 'suspendue : enseignant, aucun eleve');
select tests.voit('select 1 from public.absences',                 0, 'suspendue : enseignant, aucune absence');
select tests.voit('select 1 from public.affectations_enseignants', 0, 'suspendue : enseignant, plus ses affectations');
select tests.session('0000000c-0000-0000-0000-0000000000c1');
select tests.voit('select 1 from public.paiements',       0, 'suspendue : caissier, aucun paiement');
select tests.voit('select 1 from public.clotures_caisse', 0, 'suspendue : caissier, aucune cloture');
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.eleves',          0, 'suspendue : parent, aucun enfant');
select tests.voit('select 1 from public.echeances',       0, 'suspendue : parent, aucune echeance');
select tests.voit('select 1 from public.paiements',       0, 'suspendue : parent, aucun paiement');
select tests.voit('select 1 from public.absences',        0, 'suspendue : parent, aucune absence');
select tests.voit('select 1 from public.parents_eleves',  0, 'suspendue : parent, plus ses liens');
select tests.voit('select 1 from public.notifications',   0, 'suspendue : parent, plus ses notifications');
select tests.session('0000000c-0000-0000-0000-0000000000f3');
select tests.voit('select 1 from public.eleves', 1, 'suspendue : parent multi-ecoles ne voit plus l enfant de C...');
select tests.voit(format('select 1 from public.eleves where ecole_id = %L', 'd0000000-0000-0000-0000-00000000000d'), 1, '... mais garde celui de D');
select tests.session('0000000c-0000-0000-0000-0000000000d2');
select tests.voit('select 1 from public.eleves', 1, 'suspendue : l ecole D n est pas affectee');
select tests.session(:adm);
select tests.voit(format('select 1 from public.eleves where ecole_id = %L', 'c0000000-0000-0000-0000-00000000000c'), 2,
                  'suspendue : le super_admin voit toujours les donnees de C');

-- Réactivation : l'accès revient à l'identique.
select tests.egal(public.changer_statut_activation_ecole(:C, 'active')::text, 'active', 'super_admin : reactive l ecole C');
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.voit('select 1 from public.eleves', 2, 'reactivee : le directeur retrouve ses eleves');
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.eleves', 1, 'reactivee : le parent retrouve son enfant');

reset role;
select tests.bilan('09_test_inscription_activation');
rollback;
