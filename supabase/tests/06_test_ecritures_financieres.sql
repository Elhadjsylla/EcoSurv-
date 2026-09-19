-- =====================================================================
-- Écritures financières bornées (migration 20260918092000) — assertions.
-- Prérequis : 03_harnais_assertions.sql. Transaction annulée.
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

-- ---------------------------------------------------------------------
-- 1. echeances : montant_paye et statut non fixables à la création
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.echoue($$insert into public.echeances (ecole_id, eleve_id, libelle, montant, montant_paye, date_echeance)
                      values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', 'Deja payee ?', 5000, 5000, current_date + 30)$$,
                    '42501', 'directeur : creer une echeance deja payee');
select tests.echoue($$insert into public.echeances (ecole_id, eleve_id, libelle, montant, statut, date_echeance)
                      values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', 'Statut force', 5000, 'paye', current_date + 30)$$,
                    '42501', 'directeur : forcer le statut a la creation');
-- Le parcours du frontend (src/data/echeances.ts) reste permis.
select tests.touche($$insert into public.echeances (ecole_id, eleve_id, libelle, montant, date_echeance, annee_scolaire)
                      values ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', 'Tranche 2', 5000, current_date + 30, '2026-2027')$$,
                    1, 'directeur : creation legitime d une echeance');
select tests.egal((select statut::text || '/' || montant_paye::text from public.echeances where libelle = 'Tranche 2'),
                  'a_jour/0.00', 'directeur : echeance creee a_jour, montant_paye 0');

-- ---------------------------------------------------------------------
-- 2. paiements : seules les espèces sont confirmées au guichet
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000c1');
\set ins 'insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, reference_transaction) values (''c0000000-0000-0000-0000-00000000000c'', ''2000000c-0000-0000-0000-000000000001'', 100, '

select tests.echoue(:'ins' || $$'bankily', 'confirme', '0000000c-0000-0000-0000-0000000000c1', 'T1')$$, '42501', 'caissier : Bankily confirme sans webhook');
select tests.echoue(:'ins' || $$'masrvi',  'confirme', '0000000c-0000-0000-0000-0000000000c1', 'T2')$$, '42501', 'caissier : Masrvi confirme sans webhook');
select tests.echoue(:'ins' || $$'cheque',  'confirme', '0000000c-0000-0000-0000-0000000000c1', 'T3')$$, '42501', 'caissier : cheque confirme avant encaissement');
select tests.echoue(:'ins' || $$'especes', 'rembourse', '0000000c-0000-0000-0000-0000000000c1', 'T4')$$, '42501', 'caissier : creer un remboursement');
select tests.echoue(:'ins' || $$'especes', 'annule', '0000000c-0000-0000-0000-0000000000c1', 'T5')$$, '42501', 'caissier : creer un paiement annule');
select tests.touche(:'ins' || $$'bankily', 'en_attente', '0000000c-0000-0000-0000-0000000000c1', 'T6')$$, 1, 'caissier : Bankily en attente permis');
select tests.touche(:'ins' || $$'cheque',  'en_attente', '0000000c-0000-0000-0000-0000000000c1', 'T7')$$, 1, 'caissier : cheque en attente permis');
select tests.touche(:'ins' || $$'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1', 'T8')$$, 1, 'caissier : especes confirmees permis');

select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.echoue(:'ins' || $$'bankily', 'confirme', '0000000c-0000-0000-0000-0000000000d1', 'T9')$$, '42501', 'directeur : Bankily confirme sans webhook');
select tests.touche(:'ins' || $$'especes', 'confirme', '0000000c-0000-0000-0000-0000000000d1', 'T10')$$, 1, 'directeur : especes confirmees permis');

-- ---------------------------------------------------------------------
-- 3. Horodatage serveur : ni created_at ni paye_le ne viennent du client
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000c1');
select tests.echoue($$insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, created_at)
                      values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 100, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1', now() - interval '2 days')$$,
                    '42501', 'caissier : antidater created_at');
select tests.touche($$insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, paye_le, reference_transaction)
                      values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 100, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1', '2020-01-01', 'T11')$$,
                    1, 'caissier : paye_le fourni par le client accepte...');
select tests.egal((select paye_le = now() from public.paiements where reference_transaction = 'T11'), true,
                  '... mais reecrit a l heure serveur');
select tests.touche($$insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, paye_le, reference_transaction)
                      values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 100, 'cheque', 'en_attente', '0000000c-0000-0000-0000-0000000000c1', '2020-01-01', 'T12')$$,
                    1, 'caissier : cheque en attente avec paye_le...');
select tests.egal((select paye_le is null from public.paiements where reference_transaction = 'T12'), true,
                  '... paye_le remis a NULL tant que non confirme');

-- Le serveur (webhook, reprise d'historique) garde la maîtrise des dates.
select tests.session_serveur();
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, paye_le, created_at, reference_transaction)
values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 100, 'bankily', 'confirme',
        '2026-01-15 10:00+00', '2026-01-15 10:00+00', 'T13');
select tests.egal((select paye_le = '2026-01-15 10:00+00' and created_at = '2026-01-15 10:00+00'
                     from public.paiements where reference_transaction = 'T13'), true,
                  'serveur : dates fournies conservees');

-- Le super_admin n'est pas borné par les policies guichet.
select tests.session('0000000c-0000-0000-0000-0000000000a0');
select tests.touche(:'ins' || $$'bankily', 'confirme', NULL, 'T14')$$, 1, 'super_admin : saisie non bornee (inchange)');

reset role;
select tests.bilan('06_test_ecritures_financieres');
rollback;
