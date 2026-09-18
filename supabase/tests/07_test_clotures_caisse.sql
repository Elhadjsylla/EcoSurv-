-- =====================================================================
-- Table clotures_caisse — assertions RLS par rôle, totaux calculés et
-- verrou des encaissements. Prérequis : 03_harnais_assertions.sql.
-- Transaction annulée. La concurrence est testée à part (08).
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

\set C  '''c0000000-0000-0000-0000-00000000000c'''
\set c1 '''0000000c-0000-0000-0000-0000000000c1'''
\set c2 '''0000000c-0000-0000-0000-0000000000c2'''

-- Journée de caisse du test : aujourd'hui à Nouakchott.
select public.jour_caisse(now()) as aujourdhui \gset

-- ---------------------------------------------------------------------
-- 1. Journée d'activité
-- ---------------------------------------------------------------------
-- Hier : un encaissement espèces du caissier C1 (reprise serveur datée).
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, created_at, reference_transaction)
values (:C, '2000000c-0000-0000-0000-000000000001', 5000, 'especes', 'confirme', :c1, now() - interval '1 day', 'HIER-C1');

\set enc 'insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par) values (''c0000000-0000-0000-0000-00000000000c'', ''2000000c-0000-0000-0000-000000000002'', '

-- Aujourd'hui : C1 encaisse 3000 + 2000 en espèces et reçoit un chèque.
select tests.session(:c1);
select tests.touche(:'enc' || $$3000, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1')$$, 1, 'C1 : encaissement 3000');
select tests.touche(:'enc' || $$2000, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1')$$, 1, 'C1 : encaissement 2000');
select tests.touche(:'enc' || $$1000, 'cheque', 'en_attente', '0000000c-0000-0000-0000-0000000000c1')$$, 1, 'C1 : cheque recu (en attente)');
-- C2, autre poste de la même école.
select tests.session(:c2);
select tests.touche(:'enc' || $$700, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c2')$$, 1, 'C2 : encaissement 700');

-- ---------------------------------------------------------------------
-- 2. Clôture : totaux calculés par la base, jamais fournis
-- ---------------------------------------------------------------------
select tests.session(:c1);
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture, montant_total_encaisse, nombre_operations)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', %L, 999999, 1)$$, :'aujourdhui'),
                    '42501', 'C1 : fournir soi-meme le total');
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture, created_at)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', %L, now() - interval '1 day')$$, :'aujourdhui'),
                    '42501', 'C1 : fournir soi-meme l horodatage');
select tests.touche(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', %L)$$, :'aujourdhui'),
                    1, 'C1 : cloture sa caisse du jour');
select tests.egal((select montant_total_encaisse::text || ' / ' || nombre_operations
                     from public.clotures_caisse where date_cloture = :'aujourdhui'),
                  '5000.00 / 2',
                  'C1 : total = ses especes confirmees du jour (ni hier, ni le cheque en attente, ni C2)');

select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', %L)$$, :'aujourdhui'),
                    '23505', 'C1 : seconde cloture du meme jour');
select tests.touche(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', %L)$$, (:'aujourdhui'::date - 1)),
                    1, 'C1 : cloture d une journee passee oubliee');
select tests.egal((select montant_total_encaisse::text || ' / ' || nombre_operations
                     from public.clotures_caisse where date_cloture = :'aujourdhui'::date - 1),
                  '5000.00 / 1', 'C1 : total d hier = l encaissement d hier seul');
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c1', %L)$$, (:'aujourdhui'::date + 1)),
                    '42501', 'C1 : cloturer demain par avance');
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c2', %L)$$, :'aujourdhui'),
                    '42501', 'C1 : cloturer la caisse d un collegue');
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('d0000000-0000-0000-0000-00000000000d', '0000000c-0000-0000-0000-0000000000c1', %L)$$, :'aujourdhui'),
                    '42501', 'C1 : cloturer dans une autre ecole');

-- Immuable côté client.
select tests.echoue('update public.clotures_caisse set montant_total_encaisse = 0', '42501', 'C1 : modifier une cloture');
select tests.echoue('delete from public.clotures_caisse', '42501', 'C1 : supprimer une cloture');

-- ---------------------------------------------------------------------
-- 3. Verrou : plus aucun encaissement pour ce poste sur la journée close
-- ---------------------------------------------------------------------
select tests.echoue(:'enc' || $$800, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1')$$, 'ES001', 'C1 : encaisser apres cloture');
select tests.echoue(:'enc' || $$800, 'bankily', 'en_attente', '0000000c-0000-0000-0000-0000000000c1')$$, 'ES001', 'C1 : enregistrer un mobile money apres cloture');
select tests.session(:c2);
select tests.touche(:'enc' || $$300, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c2')$$, 1, 'C2 : son poste reste ouvert');
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.touche(:'enc' || $$400, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000d1')$$, 1, 'directeur : son propre poste reste ouvert');
-- La note reste modifiable par le directeur sur un paiement d'une journée close.
select tests.touche($$update public.paiements set note = 'verifie' where encaisse_par = '0000000c-0000-0000-0000-0000000000c1'$$,
                    4, 'directeur : annoter un paiement d une journee close');

-- Le serveur lui-même ne réécrit pas une journée close...
select tests.session_serveur();
select tests.echoue(:'enc' || $$800, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1')$$, 'ES001', 'serveur : encaissement au nom de C1 apres cloture');
select tests.echoue($$update public.paiements set montant = 1 where reference_transaction = 'HIER-C1'$$, 'ES001', 'serveur : modifier le montant d une journee close');
select tests.echoue($$update public.paiements set encaisse_par = '0000000c-0000-0000-0000-0000000000c2' where reference_transaction = 'HIER-C1'$$, 'ES001', 'serveur : sortir un paiement d une journee close');
select tests.echoue($$update public.paiements set encaisse_par = '0000000c-0000-0000-0000-0000000000c1'
                       where encaisse_par = '0000000c-0000-0000-0000-0000000000c2' and montant = 700$$,
                    'ES001', 'serveur : faire entrer un paiement dans une journee close');
-- ...mais peut encore requalifier un statut (confirmation, annulation).
select tests.touche($$update public.paiements set statut = 'confirme', paye_le = now()
                       where methode = 'cheque' and encaisse_par = '0000000c-0000-0000-0000-0000000000c1'$$,
                    1, 'serveur : confirmer le cheque recu le jour clos');
select tests.egal((select montant_total_encaisse from public.clotures_caisse where date_cloture = :'aujourdhui'),
                  5000.00::numeric(12,2), 'la cloture reste l instantane du moment ou elle a ete faite');

-- ---------------------------------------------------------------------
-- 4. Lecture par rôle
-- ---------------------------------------------------------------------
reset role;
insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
values ('d0000000-0000-0000-0000-00000000000d', '0000000c-0000-0000-0000-0000000000c3', :'aujourdhui');

select tests.session(:c1);
select tests.voit('select 1 from public.clotures_caisse', 2, 'C1 : ses 2 clotures');
select tests.session(:c2);
select tests.voit('select 1 from public.clotures_caisse', 0, 'C2 : pas les clotures de son collegue');
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.voit('select 1 from public.clotures_caisse', 2, 'directeur C : toutes les clotures de son ecole');
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c2', %L)$$, :'aujourdhui'),
                    '42501', 'directeur C : cloturer a la place d un caissier');
select tests.session('0000000c-0000-0000-0000-0000000000d2');
select tests.voit('select 1 from public.clotures_caisse', 1, 'directeur D : la sienne seulement');
select tests.session('0000000c-0000-0000-0000-0000000000c3');
select tests.voit('select 1 from public.clotures_caisse', 1, 'caissier D : la sienne seulement');
select tests.session('0000000c-0000-0000-0000-0000000000a0');
select tests.voit($$select 1 from public.clotures_caisse where ecole_id in ('c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d')$$,
                  3, 'super_admin : tout le parc');
select tests.session('0000000c-0000-0000-0000-0000000000e1');
select tests.voit('select 1 from public.clotures_caisse', 0, 'enseignant : aucune');
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.clotures_caisse', 0, 'parent : aucune');
select tests.session_anon();
select tests.echoue('select 1 from public.clotures_caisse', '42501', 'anon : aucun acces');

-- Un caissier désactivé ne clôture plus et ne lit plus.
reset role;
update public.profils set actif = false where id = '0000000c-0000-0000-0000-0000000000c2';
select tests.session(:c2);
select tests.echoue(format($$insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
                             values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c2', %L)$$, :'aujourdhui'),
                    '42501', 'caissier desactive : ne cloture plus');
reset role;
update public.profils set actif = true where id = '0000000c-0000-0000-0000-0000000000c2';

-- ---------------------------------------------------------------------
-- 5. La piste de caisse survit au compte
-- ---------------------------------------------------------------------
-- Deux barrières : le ON DELETE SET NULL de paiements.encaisse_par
-- réécrirait des journées closes (refusé par le verrou, ES001), et la FK
-- RESTRICT de clotures_caisse refuse la suppression (23503) quand aucune
-- journée close ne porte de paiement.
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.echoue($$delete from public.profils where id = '0000000c-0000-0000-0000-0000000000c1'$$,
                    'ES001', 'directeur : supprimer un caissier qui a encaisse sur une journee close');
reset role;
insert into public.clotures_caisse (ecole_id, caissier_id, date_cloture)
values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000c2', :'aujourdhui'::date - 10);
delete from public.paiements where encaisse_par = '0000000c-0000-0000-0000-0000000000c2';
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.echoue($$delete from public.profils where id = '0000000c-0000-0000-0000-0000000000c2'$$,
                    '23503', 'directeur : supprimer un caissier qui a cloture (il se desactive)');

reset role;
select tests.bilan('07_test_clotures_caisse');
rollback;
