-- =====================================================================
--  ███  DONNÉES DE TEST — NE JAMAIS EXÉCUTER EN PRODUCTION  ███
--
--  Jeu de démonstration EcoSurv : 1 école, 10 élèves, 30 échéances,
--  paiements et absences. TOUT est fictif.
--
--  Aucun élève, parent, numéro de téléphone ou montant de ce fichier ne
--  correspond à une personne réelle. Conforme à SECURITY_RULES.md §5 :
--  « Ne jamais utiliser de vraies données d'élèves dans un environnement
--  de développement, une démonstration, ou un export partagé. »
--
--  Repères visuels volontaires, pour qu'on ne confonde jamais ces lignes
--  avec des données réelles :
--    - le nom de l'école est préfixé « [DÉMO] »
--    - les matricules sont préfixés « DEMO- »
--    - les références de transaction sont préfixées « DEMO-TRX- »
--    - tous les UUID de démo commencent par un motif répétitif reconnaissable
--
--  Ré-exécutable sans dégât (ON CONFLICT DO NOTHING). Pour repartir de
--  zéro, voir supabase/seed/99_purge_donnees_test.sql — ce fichier
--  contient un DELETE, à lire avant de l'exécuter.
--
--  Montants en Ouguiya (MRU). Dates relatives à la date d'exécution :
--  tranche 1 échue depuis 60 jours, tranche 2 échue depuis 15 jours,
--  tranche 3 due dans 45 jours. Le jeu reste donc réaliste dans le temps.
-- =====================================================================

-- ---------------------------------------------------------------------
-- L'école de démonstration
-- ---------------------------------------------------------------------

insert into public.ecoles
  (id, nom, ville, adresse, telephone, email,
   statut_abonnement, abonnement_debut, abonnement_fin, annee_scolaire,
   statut_activation)
values
  ('11111111-1111-1111-1111-111111111111',
   '[DÉMO] Groupe Scolaire Al Anwar',
   'Nouakchott',
   'Tevragh Zeina, Nouakchott',
   '+222 45 25 00 00',
   'contact@demo.ecosurv.test',
   'actif',
   current_date - 90,
   current_date + 275,
   '2025-2026',
   'active')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 10 élèves — primaire (CM2) et collège (6e à 3e)
-- ---------------------------------------------------------------------

insert into public.eleves
  (id, ecole_id, matricule, nom, prenom, classe, date_naissance,
   lieu_naissance, sexe, annee_scolaire, actif)
values
  ('e1e1e1e1-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-001', 'Ould Ahmed',    'Mohamed Lemine', '6ème A', '2012-03-14', 'Nouakchott', 'M', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-002', 'Mint Sidi Mohamed', 'Fatimetou',  '6ème A', '2012-07-22', 'Nouakchott', 'F', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-003', 'Ba',            'Aminata',        '5ème B', '2011-11-05', 'Rosso',      'F', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-004', 'Ould Baba',     'Cheikh',         '5ème B', '2011-02-18', 'Atar',       'M', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-005', 'Mint Abdallahi','Mariem',         '4ème A', '2010-09-30', 'Nouakchott', 'F', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-006', 'Sy',            'Amadou',         '4ème A', '2010-05-12', 'Kaédi',      'M', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-007', 'Mint Ely',      'Zeinabou',       '3ème',   '2009-12-01', 'Nouadhibou', 'F', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-008', 'Diallo',        'Ousmane',        '3ème',   '2009-08-19', 'Sélibaby',   'M', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-009', 'Mint Brahim',   'Khadijetou',     'CM2',    '2013-04-25', 'Nouakchott', 'F', '2025-2026', true),
  ('e1e1e1e1-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'DEMO-2026-010', 'Ould Sidina',   'Moustapha',      'CM2',    '2013-10-08', 'Néma',       'M', '2025-2026', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Échéancier : 3 tranches par élève.
-- Collège 12 000 MRU la tranche (36 000 MRU l'année),
-- primaire  8 000 MRU la tranche (24 000 MRU l'année).
--
-- Le statut n'est PAS renseigné ici : le trigger echeances_statut_auto le
-- calcule, et les paiements plus bas le font évoluer. C'est justement ce
-- qu'on veut vérifier visuellement.
-- ---------------------------------------------------------------------

insert into public.echeances
  (id, ecole_id, eleve_id, libelle, montant, date_echeance, annee_scolaire)
select
  ('ec000000-0000-4000-8000-0000000' || lpad(e.num::text, 3, '0') || lpad(t.tranche::text, 2, '0'))::uuid,
  '11111111-1111-1111-1111-111111111111',
  e.eleve_id,
  'Scolarité 2025-2026 — tranche ' || t.tranche,
  case when e.classe = 'CM2' then 8000 else 12000 end,
  case t.tranche
    when 1 then current_date - 60
    when 2 then current_date - 15
    else        current_date + 45
  end,
  '2025-2026'
from (values
  (1,  'e1e1e1e1-0000-4000-8000-000000000001'::uuid, '6ème A'),
  (2,  'e1e1e1e1-0000-4000-8000-000000000002'::uuid, '6ème A'),
  (3,  'e1e1e1e1-0000-4000-8000-000000000003'::uuid, '5ème B'),
  (4,  'e1e1e1e1-0000-4000-8000-000000000004'::uuid, '5ème B'),
  (5,  'e1e1e1e1-0000-4000-8000-000000000005'::uuid, '4ème A'),
  (6,  'e1e1e1e1-0000-4000-8000-000000000006'::uuid, '4ème A'),
  (7,  'e1e1e1e1-0000-4000-8000-000000000007'::uuid, '3ème'),
  (8,  'e1e1e1e1-0000-4000-8000-000000000008'::uuid, '3ème'),
  (9,  'e1e1e1e1-0000-4000-8000-000000000009'::uuid, 'CM2'),
  (10, 'e1e1e1e1-0000-4000-8000-000000000010'::uuid, 'CM2')
) as e(num, eleve_id, classe)
cross join (values (1), (2), (3)) as t(tranche)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Paiements — scénarios volontairement variés, pour que le dashboard
-- directeur (§5.7) montre les quatre statuts et que les relances aient
-- de la matière.
--
--   élèves 1, 2, 8  : tranches échues soldées      -> à jour
--   élève  6        : année entière soldée          -> tout payé
--   élève  3        : acompte sur tranche à venir   -> partiel
--   élèves 4, 9     : soldes incomplets sur échéance échue -> en retard
--   élèves 5, 10    : aucun paiement                -> en retard
--   élève  7        : mobile money NON confirmé     -> reste en retard
--
-- Le dernier cas est le plus important à vérifier : un paiement
-- 'en_attente' ne doit rien solder tant que le webhook opérateur ne l'a
-- pas confirmé (SECURITY_RULES.md §6).
-- ---------------------------------------------------------------------

insert into public.paiements
  (id, ecole_id, echeance_id, montant, methode, statut,
   reference_transaction, note, paye_le)
values
  -- Élève 1 : tranches 1 et 2 soldées
  ('bacc0000-0000-4000-8000-000000000101', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000101', 12000, 'bankily', 'confirme',
   'DEMO-TRX-0001', 'Paiement mobile money', now() - interval '58 days'),
  ('bacc0000-0000-4000-8000-000000000102', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000102', 12000, 'bankily', 'confirme',
   'DEMO-TRX-0002', 'Paiement mobile money', now() - interval '12 days'),

  -- Élève 2 : tranches 1 et 2 soldées, dont une en espèces au guichet
  ('bacc0000-0000-4000-8000-000000000201', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000201', 12000, 'especes', 'confirme',
   'DEMO-TRX-0003', 'Encaissement guichet', now() - interval '59 days'),
  ('bacc0000-0000-4000-8000-000000000202', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000202', 12000, 'masrvi', 'confirme',
   'DEMO-TRX-0004', null, now() - interval '14 days'),

  -- Élève 3 : à jour sur l'échu, plus un acompte sur la tranche à venir
  -- -> tranche 3 en statut « partiel »
  ('bacc0000-0000-4000-8000-000000000301', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000301', 12000, 'especes', 'confirme',
   'DEMO-TRX-0005', null, now() - interval '55 days'),
  ('bacc0000-0000-4000-8000-000000000302', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000302', 12000, 'bankily', 'confirme',
   'DEMO-TRX-0006', null, now() - interval '10 days'),
  ('bacc0000-0000-4000-8000-000000000303', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000303',  4000, 'bankily', 'confirme',
   'DEMO-TRX-0007', 'Acompte anticipé sur la tranche 3', now() - interval '3 days'),

  -- Élève 4 : tranche 1 soldée, tranche 2 échue impayée
  ('bacc0000-0000-4000-8000-000000000401', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000401', 12000, 'sedad', 'confirme',
   'DEMO-TRX-0008', null, now() - interval '57 days'),

  -- Élève 6 : année complète soldée
  ('bacc0000-0000-4000-8000-000000000601', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000601', 12000, 'virement', 'confirme',
   'DEMO-TRX-0009', 'Paiement annuel anticipé', now() - interval '61 days'),
  ('bacc0000-0000-4000-8000-000000000602', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000602', 12000, 'virement', 'confirme',
   'DEMO-TRX-0010', 'Paiement annuel anticipé', now() - interval '61 days'),
  ('bacc0000-0000-4000-8000-000000000603', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000603', 12000, 'virement', 'confirme',
   'DEMO-TRX-0011', 'Paiement annuel anticipé', now() - interval '61 days'),

  -- Élève 7 : tranche 1 soldée ; tranche 2 initiée en mobile money mais
  -- JAMAIS confirmée par l'opérateur -> ne doit rien solder.
  ('bacc0000-0000-4000-8000-000000000701', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000701', 12000, 'masrvi', 'confirme',
   'DEMO-TRX-0012', null, now() - interval '56 days'),
  ('bacc0000-0000-4000-8000-000000000702', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000702', 12000, 'masrvi', 'en_attente',
   'DEMO-TRX-0013', 'Transaction initiée, en attente du webhook opérateur', null),

  -- Élève 8 : tranches 1 et 2 soldées
  ('bacc0000-0000-4000-8000-000000000801', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000801', 12000, 'especes', 'confirme',
   'DEMO-TRX-0014', 'Encaissement guichet', now() - interval '60 days'),
  ('bacc0000-0000-4000-8000-000000000802', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000802', 12000, 'especes', 'confirme',
   'DEMO-TRX-0015', 'Encaissement guichet', now() - interval '11 days'),

  -- Élève 9 : tranche 1 soldée, acompte insuffisant sur la tranche 2 échue
  ('bacc0000-0000-4000-8000-000000000901', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000901',  8000, 'especes', 'confirme',
   'DEMO-TRX-0016', null, now() - interval '54 days'),
  ('bacc0000-0000-4000-8000-000000000902', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000000902',  3000, 'bankily', 'confirme',
   'DEMO-TRX-0017', 'Acompte, reliquat annoncé par la famille', now() - interval '8 days'),

  -- Un paiement échoué, pour que l'historique ne soit pas irréaliste
  ('bacc0000-0000-4000-8000-000000001001', '11111111-1111-1111-1111-111111111111',
   'ec000000-0000-4000-8000-000000001001',  8000, 'bankily', 'echoue',
   'DEMO-TRX-0018', 'Solde insuffisant côté opérateur', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Absences et retards — de quoi alimenter le suivi d'assiduité (§5.4)
-- ---------------------------------------------------------------------

insert into public.absences
  (id, ecole_id, eleve_id, date_absence, type, justifiee, motif)
values
  ('ab000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000001', current_date - 12, 'absence', true,  'Certificat médical'),
  ('ab000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000001', current_date - 5,  'retard',  false, null),
  ('ab000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000003', current_date - 9,  'absence', false, null),
  ('ab000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000004', current_date - 9,  'absence', true,  'Voyage familial signalé'),
  ('ab000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000005', current_date - 3,  'absence', false, null),
  ('ab000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000005', current_date - 2,  'absence', false, null),
  ('ab000000-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000007', current_date - 7,  'retard',  true,  'Transport scolaire retardé'),
  ('ab000000-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000009', current_date - 4,  'absence', false, null),
  ('ab000000-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000010', current_date - 6,  'absence', false, null),
  ('ab000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'e1e1e1e1-0000-4000-8000-000000000010', current_date - 1,  'retard',  false, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Contrôle : ce que le dashboard directeur devrait afficher
-- ---------------------------------------------------------------------

select
  e.classe,
  e.prenom || ' ' || e.nom as eleve,
  sum(ec.montant)      as total_du,
  sum(ec.montant_paye) as total_encaisse,
  count(*) filter (where ec.statut = 'en_retard') as tranches_en_retard,
  count(*) filter (where ec.statut = 'partiel')   as tranches_partielles,
  count(*) filter (where ec.statut = 'paye')      as tranches_payees
from public.eleves e
join public.echeances ec on ec.eleve_id = e.id
where e.ecole_id = '11111111-1111-1111-1111-111111111111'
group by e.classe, e.nom, e.prenom
order by e.classe, e.nom;
