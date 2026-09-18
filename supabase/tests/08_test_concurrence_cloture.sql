-- =====================================================================
-- Clôture de caisse — course entre un encaissement et la clôture.
-- Prérequis : 03_harnais_assertions.sql. À exécuter EN DERNIER : ce test
-- a besoin de vrais COMMIT entre deux connexions (dblink) ; il nettoie
-- ses propres lignes à la fin.
--
-- Scénario A : l'encaissement n'est pas encore commité quand la clôture
--   démarre. Attendu : la clôture ATTEND, puis compte l'encaissement.
-- Scénario B : la clôture n'est pas encore commitée quand un encaissement
--   démarre. Attendu : l'encaissement ATTEND, puis est refusé (ES001).
-- Sans le verrou consultatif, A produirait une clôture sans
-- l'encaissement, et B un encaissement accepté sur une journée close.
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off

create extension if not exists dblink;
select format('dbname=%s user=%s', current_database(), current_user) as conninfo \gset
select public.jour_caisse(now()) as aujourdhui \gset

select dblink_connect('autre', :'conninfo');

-- ---------------------------------------------------------------------
-- Scénario A — caissier C2
-- ---------------------------------------------------------------------
select dblink_exec('autre', 'set role authenticated');
select dblink_exec('autre', $$set request.jwt.claim.sub = '0000000c-0000-0000-0000-0000000000c2'$$);

begin;
select tests.session('0000000c-0000-0000-0000-0000000000c2');
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, note)
values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000002',
        700, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c2', 'CONCURRENCE');
reset role;
-- L'autre connexion lance la clôture pendant que l'encaissement est ouvert.
select dblink_send_query('autre', format(
  $$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
    values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c2', %L)
    returning montant_total_encaisse, nombre_operations$$, :'aujourdhui'));
select pg_sleep(1);
select tests.egal((select count(*) from pg_locks where locktype = 'advisory' and not granted),
                  1::bigint, 'A : la cloture attend le verrou de l encaissement en cours');
commit;

select tests.egal((select montant_total_encaisse::text || ' / ' || nombre_operations
                     from dblink_get_result('autre') as r(montant_total_encaisse numeric, nombre_operations int)),
                  '700.00 / 1', 'A : la cloture compte l encaissement commite pendant son attente');
select * from dblink_get_result('autre') as r(montant_total_encaisse numeric, nombre_operations int);

-- ---------------------------------------------------------------------
-- Scénario B — caissier C1
-- ---------------------------------------------------------------------
select dblink_exec('autre', $$set request.jwt.claim.sub = '0000000c-0000-0000-0000-0000000000c1'$$);

begin;
select tests.session('0000000c-0000-0000-0000-0000000000c1');
insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', :'aujourdhui');
reset role;
select dblink_send_query('autre',
  $$insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, note)
    values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001',
            900, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1', 'CONCURRENCE')$$);
select pg_sleep(1);
select tests.egal((select count(*) from pg_locks where locktype = 'advisory' and not granted),
                  1::bigint, 'B : l encaissement attend le verrou de la cloture en cours');
commit;

-- Résultat sans lever d'erreur localement (fail_on_error = false).
select * from dblink_get_result('autre', false) as r(etat text);
select tests.egal(dblink_error_message('autre') like '%Caisse cloturee%', true,
                  'B : l encaissement est refuse une fois la cloture commitee');
select * from dblink_get_result('autre', false) as r(etat text);
select tests.egal((select count(*) from public.paiements where montant = 900 and note = 'CONCURRENCE'),
                  0::bigint, 'B : aucun encaissement enregistre sur la journee close');

select dblink_disconnect('autre');

-- ---------------------------------------------------------------------
-- Nettoyage (bac à sable) : clôtures d'abord, sinon le verrou protège
-- encore les paiements de la journée.
-- ---------------------------------------------------------------------
delete from public.clotures_caisse where ecole_id = 'c0000000-0000-0000-0000-00000000000c';
delete from public.paiements where note = 'CONCURRENCE';

select tests.bilan('08_test_concurrence_cloture');
