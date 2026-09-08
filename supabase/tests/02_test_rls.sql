-- Tests RLS EcoSurv : chaque role est simule via set role authenticated +
-- le claim JWT `sub`. Donnees entierement fictives.
\pset pager off
\set ON_ERROR_STOP on

-- =====================================================================
-- Jeu de donnees, cree en tant que proprietaire (hors RLS)
-- =====================================================================
\set ecoleA   '''e0000000-0000-0000-0000-00000000000a'''
\set ecoleB   '''e0000000-0000-0000-0000-00000000000b'''
\set uAdmin   '''00000000-0000-0000-0000-0000000000a0'''
\set uDirA    '''00000000-0000-0000-0000-0000000000d1'''
\set uDirB    '''00000000-0000-0000-0000-0000000000d2'''
\set uEns     '''00000000-0000-0000-0000-0000000000e1'''
\set uCaiss   '''00000000-0000-0000-0000-0000000000c1'''
\set uParent  '''00000000-0000-0000-0000-0000000000p1'''
\set eleve1   '''10000000-0000-0000-0000-000000000001'''
\set eleve2   '''10000000-0000-0000-0000-000000000002'''
\set eleveB   '''10000000-0000-0000-0000-00000000000b'''
\set echA1    '''20000000-0000-0000-0000-000000000001'''
\set echA2    '''20000000-0000-0000-0000-000000000002'''

insert into public.ecoles (id, nom, ville) values
  ('e0000000-0000-0000-0000-00000000000a', 'Ecole Test A', 'Nouakchott'),
  ('e0000000-0000-0000-0000-00000000000b', 'Ecole Test B', 'Nouadhibou');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a0', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', 'dirA@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'dirB@test.local'),
  ('00000000-0000-0000-0000-0000000000e1', 'ens@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'caissier@test.local'),
  ('00000000-0000-0000-0000-0000000000f1', 'parent@test.local');

insert into public.profils (id, ecole_id, role, nom) values
  ('00000000-0000-0000-0000-0000000000a0', null, 'super_admin', 'Admin'),
  ('00000000-0000-0000-0000-0000000000d1', 'e0000000-0000-0000-0000-00000000000a', 'directeur',  'DirA'),
  ('00000000-0000-0000-0000-0000000000d2', 'e0000000-0000-0000-0000-00000000000b', 'directeur',  'DirB'),
  ('00000000-0000-0000-0000-0000000000e1', 'e0000000-0000-0000-0000-00000000000a', 'enseignant', 'EnsA'),
  ('00000000-0000-0000-0000-0000000000c1', 'e0000000-0000-0000-0000-00000000000a', 'caissier',   'CaissA'),
  ('00000000-0000-0000-0000-0000000000f1', 'e0000000-0000-0000-0000-00000000000a', 'parent',     'ParentA');

insert into public.eleves (id, ecole_id, nom, prenom, classe) values
  ('10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000a', 'Eleve', 'Un',   '6eme A'),
  ('10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000a', 'Eleve', 'Deux', '5eme B'),
  ('10000000-0000-0000-0000-00000000000b', 'e0000000-0000-0000-0000-00000000000b', 'Eleve', 'EcoleB', '6eme A');

-- L'enseignant n'est affecte qu'a la 6eme A de l'ecole A.
insert into public.affectations_enseignants (ecole_id, enseignant_id, classe) values
  ('e0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', '6eme A');

-- Le parent est tuteur du seul eleve1.
insert into public.parents_eleves (ecole_id, parent_id, eleve_id, lien, principal) values
  ('e0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000f1',
   '10000000-0000-0000-0000-000000000001', 'pere', true);

insert into public.echeances (id, ecole_id, eleve_id, libelle, montant, date_echeance) values
  ('20000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-00000000000a',
   '10000000-0000-0000-0000-000000000001', 'Tranche 1 eleve1', 15000, current_date + 15),
  ('20000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-00000000000a',
   '10000000-0000-0000-0000-000000000002', 'Tranche 1 eleve2', 15000, current_date + 15);

insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, reference_transaction) values
  ('e0000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001',
   5000, 'especes', 'confirme', '00000000-0000-0000-0000-0000000000c1', 'TEST-P1'),
  ('e0000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000002',
   7000, 'bankily', 'confirme', null, 'TEST-P2');

insert into public.absences (ecole_id, eleve_id, date_absence, type, justifiee) values
  ('e0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', current_date - 2, 'absence', false),
  ('e0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000002', current_date - 2, 'absence', true);

\echo ''
\echo '#####################################################################'
\echo '# A partir d ici, tout doit ECHOUER ou renvoyer un perimetre reduit #'
\echo '#####################################################################'
\set ON_ERROR_STOP off

-- =====================================================================
\echo ''
\echo '=== 1. ANON (non authentifie) : aucun acces (attendu: permission denied) ==='
set role anon;
select count(*) as eleves_vus_par_anon from public.eleves;
select count(*) as paiements_vus_par_anon from public.paiements;
reset role;

-- =====================================================================
\echo ''
\echo '=== 2. DIRECTEUR A : son ecole uniquement ==='
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000d1';

\echo '-- 2a. ecoles visibles (attendu: 1, Ecole Test A)'
select nom from public.ecoles;

\echo '-- 2b. eleves visibles (attendu: 2, aucun de l ecole B)'
select prenom, classe from public.eleves order by prenom;

\echo '-- 2c. echeances visibles (attendu: 2)'
select count(*) as echeances from public.echeances;

\echo '-- 2d. INSERT d un eleve dans l ECOLE B (attendu: ERREUR policy)'
insert into public.eleves (ecole_id, nom, prenom, classe)
values ('e0000000-0000-0000-0000-00000000000b', 'Intrus', 'Test', '6eme A');

\echo '-- 2e. UPDATE de montant_paye a la main (attendu: ERREUR permission colonne)'
update public.echeances set montant_paye = 999999
 where id = '20000000-0000-0000-0000-000000000001';

\echo '-- 2f. UPDATE du statut d un paiement (attendu: ERREUR permission colonne)'
update public.paiements set statut = 'confirme' where reference_transaction = 'TEST-P2';

\echo '-- 2g. UPDATE du statut d abonnement de son ecole (attendu: ERREUR permission colonne)'
update public.ecoles set statut_abonnement = 'actif'
 where id = 'e0000000-0000-0000-0000-00000000000a';

\echo '-- 2h. UPDATE legitime du telephone de son ecole (attendu: UPDATE 1)'
update public.ecoles set telephone = '+222 00 00 00 00'
 where id = 'e0000000-0000-0000-0000-00000000000a';

\echo '-- 2i. DELETE d un eleve (attendu: DELETE 0 — reserve au super_admin)'
delete from public.eleves where id = '10000000-0000-0000-0000-000000000002';

\echo '-- 2j. DELETE d une echeance ayant deja un paiement (attendu: DELETE 0)'
delete from public.echeances where id = '20000000-0000-0000-0000-000000000001';

reset role;

-- =====================================================================
\echo ''
\echo '=== 3. DIRECTEUR B : ne doit RIEN voir de l ecole A ==='
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000d2';

\echo '-- 3a. eleves visibles (attendu: 1, celui de l ecole B)'
select prenom from public.eleves;
\echo '-- 3b. echeances de l ecole A visibles (attendu: 0)'
select count(*) as echeances_ecole_a from public.echeances;
\echo '-- 3c. paiements visibles (attendu: 0)'
select count(*) as paiements from public.paiements;
\echo '-- 3d. ecoles visibles (attendu: 1, Ecole Test B)'
select nom from public.ecoles;
reset role;

-- =====================================================================
\echo ''
\echo '=== 4. ENSEIGNANT A : ses classes uniquement, pas de finances ==='
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000e1';

\echo '-- 4a. eleves visibles (attendu: 1 seul, Un / 6eme A)'
select prenom, classe from public.eleves;

\echo '-- 4b. echeances visibles (attendu: 0 — hors perimetre pedagogique)'
select count(*) as echeances from public.echeances;

\echo '-- 4c. paiements visibles (attendu: 0)'
select count(*) as paiements from public.paiements;

\echo '-- 4d. absences visibles (attendu: 1, celle de sa classe)'
select count(*) as absences from public.absences;

\echo '-- 4e. saisie d une absence pour un eleve HORS de sa classe (attendu: ERREUR policy)'
insert into public.absences (ecole_id, eleve_id, date_absence, type)
values ('e0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000002',
        current_date - 5, 'absence');

\echo '-- 4f. saisie d une absence pour SA classe (attendu: INSERT 1)'
insert into public.absences (ecole_id, eleve_id, date_absence, type)
values ('e0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001',
        current_date - 5, 'absence');

\echo '-- 4g. ESCALADE : se promouvoir directeur (attendu: ERREUR trigger 42501)'
update public.profils set role = 'directeur'
 where id = '00000000-0000-0000-0000-0000000000e1';

\echo '-- 4h. s auto-affecter une autre classe (attendu: ERREUR policy)'
insert into public.affectations_enseignants (ecole_id, enseignant_id, classe)
values ('e0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', '5eme B');

\echo '-- 4i. modification legitime de son telephone (attendu: UPDATE 1)'
update public.profils set telephone = '+222 11 11 11 11'
 where id = '00000000-0000-0000-0000-0000000000e1';

reset role;

-- =====================================================================
\echo ''
\echo '=== 5. CAISSIER A : paiements de son ecole, rien de pedagogique ==='
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000c1';

\echo '-- 5a. paiements visibles (attendu: 2, ceux de son ecole)'
select count(*) as paiements from public.paiements;
\echo '-- 5b. echeances visibles (attendu: 2 — necessaires pour encaisser)'
select count(*) as echeances from public.echeances;
\echo '-- 5c. absences visibles (attendu: 0 — hors perimetre)'
select count(*) as absences from public.absences;

\echo '-- 5d. encaissement especes trace a son nom (attendu: INSERT 1)'
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, reference_transaction)
values ('e0000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001',
        3000, 'especes', 'confirme', '00000000-0000-0000-0000-0000000000c1', 'TEST-P3');

\echo '-- 5e. encaissement au nom de QUELQU UN D AUTRE (attendu: ERREUR policy)'
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, reference_transaction)
values ('e0000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001',
        3000, 'especes', 'confirme', '00000000-0000-0000-0000-0000000000d1', 'TEST-P4');

\echo '-- 5f. creer une echeance (attendu: ERREUR policy — reserve au directeur)'
insert into public.echeances (ecole_id, eleve_id, libelle, montant, date_echeance)
values ('e0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001',
        'Echeance fabriquee', 1000, current_date);

reset role;

-- =====================================================================
\echo ''
\echo '=== 6. PARENT : son enfant uniquement ==='
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000f1';

\echo '-- 6a. eleves visibles (attendu: 1 seul, Un — PAS l eleve Deux de la meme ecole)'
select prenom, classe from public.eleves;

\echo '-- 6b. echeances visibles (attendu: 1, celle de son enfant)'
select libelle from public.echeances;

\echo '-- 6c. paiements visibles (attendu: ceux de son enfant uniquement)'
select reference_transaction, montant from public.paiements order by reference_transaction;

\echo '-- 6d. absences visibles (attendu: celles de son enfant uniquement)'
select count(*) as absences from public.absences;

\echo '-- 6e. profils visibles (attendu: 1, le sien)'
select nom from public.profils;

\echo '-- 6f. ELARGISSEMENT : se declarer tuteur de l eleve Deux (attendu: ERREUR policy)'
insert into public.parents_eleves (ecole_id, parent_id, eleve_id, lien)
values ('e0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000f1',
        '10000000-0000-0000-0000-000000000002', 'tuteur');

\echo '-- 6g. FRAUDE : declarer lui-meme un paiement (attendu: ERREUR policy)'
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, reference_transaction)
values ('e0000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001',
        15000, 'bankily', 'confirme', 'TEST-FRAUDE');

\echo '-- 6h. FRAUDE : se marquer a jour sur son echeance (attendu: ERREUR permission colonne)'
update public.echeances set statut = 'paye'
 where id = '20000000-0000-0000-0000-000000000001';

\echo '-- 6i. justifier lui-meme une absence (attendu: UPDATE 0 — pas de policy update parent)'
update public.absences set justifiee = true where ecole_id = 'e0000000-0000-0000-0000-00000000000a';

reset role;

-- =====================================================================
\echo ''
\echo '=== 7. SUPER ADMIN : tout le parc ==='
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000a0';
\echo '-- 7a. ecoles visibles (attendu: 2)'
select count(*) as ecoles from public.ecoles;
\echo '-- 7b. eleves visibles (attendu: 3, les deux ecoles)'
select count(*) as eleves from public.eleves;
\echo '-- 7c. profils visibles (attendu: 6)'
select count(*) as profils from public.profils;
reset role;

-- =====================================================================
\echo ''
\echo '=== 8. COMPTE DESACTIVE : actif = false coupe tout acces ==='
update public.profils set actif = false where id = '00000000-0000-0000-0000-0000000000d1';
set role authenticated;
set "request.jwt.claim.sub" = '00000000-0000-0000-0000-0000000000d1';
\echo '-- 8a. eleves visibles par le directeur desactive (attendu: 0)'
select count(*) as eleves from public.eleves;
\echo '-- 8b. ecoles visibles (attendu: 0)'
select count(*) as ecoles from public.ecoles;
reset role;
update public.profils set actif = true where id = '00000000-0000-0000-0000-0000000000d1';

\echo ''
\echo '=== 9. Couverture : aucune table du schema public sans policy ==='
select t.tablename,
       t.rowsecurity as rls,
       count(p.policyname) as policies
  from pg_tables t
  left join pg_policies p
    on p.schemaname = t.schemaname and p.tablename = t.tablename
 where t.schemaname = 'public'
 group by t.tablename, t.rowsecurity
 order by t.tablename;

\echo ''
\echo '=== TESTS RLS TERMINES ==='
