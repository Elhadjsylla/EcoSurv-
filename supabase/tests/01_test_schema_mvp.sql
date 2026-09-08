\set ON_ERROR_STOP on
\pset pager off

\echo '--- 1. RLS activee sur les 7 tables (attendu: 7 lignes, toutes t) ---'
select relname, relrowsecurity
  from pg_class
 where relnamespace = 'public'::regnamespace
   and relkind = 'r'
 order by relname;

\echo ''
begin;
\echo '--- 2. Jeu minimal : 2 ecoles, 1 eleve chacune ---'
insert into public.ecoles (id, nom, ville)
values ('11111111-1111-1111-1111-111111111111', 'Ecole A', 'Nouakchott'),
       ('22222222-2222-2222-2222-222222222222', 'Ecole B', 'Nouadhibou');

insert into public.eleves (id, ecole_id, nom, prenom, classe)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', 'Test', 'EleveA', '6eme'),
       ('bbbbbbbb-0000-0000-0000-000000000002',
        '22222222-2222-2222-2222-222222222222', 'Test', 'EleveB', '5eme');

\echo ''
\echo '--- 3. ISOLATION : echeance ecole A pointant un eleve ecole B (attendu: ERREUR FK) ---'
savepoint s1;
\set ON_ERROR_STOP off
insert into public.echeances (ecole_id, eleve_id, libelle, montant, date_echeance)
values ('11111111-1111-1111-1111-111111111111',
        'bbbbbbbb-0000-0000-0000-000000000002', 'Fraude inter-ecoles', 1000, current_date);
\set ON_ERROR_STOP on
rollback to savepoint s1;

\echo ''
\echo '--- 4. CONTRAINTE ROLE : super_admin avec un ecole_id (attendu: ERREUR CHECK) ---'
insert into auth.users (id, email)
values ('cccccccc-0000-0000-0000-000000000003', 'admin@test.local');
savepoint s2;
\set ON_ERROR_STOP off
insert into public.profils (id, ecole_id, role, nom)
values ('cccccccc-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111', 'super_admin', 'Admin');
\set ON_ERROR_STOP on
rollback to savepoint s2;

\echo ''
\echo '--- 4bis. CONTRAINTE ROLE : directeur sans ecole_id (attendu: ERREUR CHECK) ---'
savepoint s3;
\set ON_ERROR_STOP off
insert into public.profils (id, role, nom)
values ('cccccccc-0000-0000-0000-000000000003', 'directeur', 'Directeur sans ecole');
\set ON_ERROR_STOP on
rollback to savepoint s3;

\echo ''
\echo '--- 5. STATUTS : echeance future 10000, echeance passee 5000 ---'
insert into public.echeances (id, ecole_id, eleve_id, libelle, montant, date_echeance)
values ('dddddddd-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-0000-0000-0000-000000000001',
        'Tranche future', 10000, current_date + 30),
       ('dddddddd-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-0000-0000-0000-000000000001',
        'Tranche echue', 5000, current_date - 10);

select libelle, montant, montant_paye, statut from public.echeances order by libelle;

\echo ''
\echo '--- 6. Paiement en_attente de 4000 : ne doit RIEN solder (statut inchange) ---'
insert into public.paiements (id, ecole_id, echeance_id, montant, methode, statut, reference_transaction)
values ('eeeeeeee-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'dddddddd-0000-0000-0000-000000000001', 4000, 'bankily', 'en_attente', 'TRX-001');

select libelle, montant, montant_paye, statut from public.echeances order by libelle;

\echo ''
\echo '--- 7. Passage a confirme : attendu montant_paye=4000, statut=partiel ---'
update public.paiements set statut = 'confirme'
 where id = 'eeeeeeee-0000-0000-0000-000000000001';

select libelle, montant, montant_paye, statut from public.echeances order by libelle;

\echo ''
\echo '--- 8. Solde du reliquat 6000 : attendu montant_paye=10000, statut=paye ---'
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, reference_transaction)
values ('11111111-1111-1111-1111-111111111111',
        'dddddddd-0000-0000-0000-000000000001', 6000, 'especes', 'confirme', 'TRX-002');

select libelle, montant, montant_paye, statut from public.echeances order by libelle;

\echo ''
\echo '--- 9. Paiement confirme partiel sur echeance ECHUE : en_retard doit primer sur partiel ---'
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, reference_transaction)
values ('11111111-1111-1111-1111-111111111111',
        'dddddddd-0000-0000-0000-000000000002', 2000, 'masrvi', 'confirme', 'TRX-003');

select libelle, montant, montant_paye, statut from public.echeances order by libelle;

\echo ''
\echo '--- 10. IDEMPOTENCE : meme reference_transaction dans la meme ecole (attendu: ERREUR UNIQUE) ---'
savepoint s4;
\set ON_ERROR_STOP off
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, reference_transaction)
values ('11111111-1111-1111-1111-111111111111',
        'dddddddd-0000-0000-0000-000000000002', 999, 'masrvi', 'confirme', 'TRX-003');
\set ON_ERROR_STOP on
rollback to savepoint s4;

\echo ''
\echo '--- 11. Annulation d un paiement confirme : le montant doit etre repris ---'
update public.paiements set statut = 'rembourse' where reference_transaction = 'TRX-003';
select libelle, montant, montant_paye, statut from public.echeances order by libelle;

\echo ''
\echo '--- 12. Absence en double le meme jour, meme type (attendu: ERREUR UNIQUE) ---'
insert into public.absences (ecole_id, eleve_id, date_absence, type)
values ('11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-0000-0000-0000-000000000001', current_date - 1, 'absence');
savepoint s5;
\set ON_ERROR_STOP off
insert into public.absences (ecole_id, eleve_id, date_absence, type)
values ('11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-0000-0000-0000-000000000001', current_date - 1, 'absence');
\set ON_ERROR_STOP on
rollback to savepoint s5;

\echo ''
\echo '--- 13. rafraichir_statuts_echeances() est idempotente (attendu: 0) ---'
select public.rafraichir_statuts_echeances() as lignes_modifiees;

rollback;
\echo '=== TESTS TERMINES ==='
