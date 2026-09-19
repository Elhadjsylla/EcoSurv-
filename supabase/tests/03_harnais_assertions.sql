-- =====================================================================
-- Harnais d'assertions RLS + jeu de données commun aux tests 04 à 08.
-- BAC À SABLE LOCAL UNIQUEMENT — jamais sur Supabase.
--
-- Contrairement à 02_test_rls.sql (sortie à relire à l'œil), chaque
-- vérification ici est une assertion : au premier écart, le script
-- s'arrête avec « ECHEC ... » et psql sort en erreur.
--
-- Ordre : 00_prelude, les migrations, puis ce fichier, puis 04 à 08.
-- Données entièrement fictives, identifiants distincts de 02_test_rls.
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off

-- ---------------------------------------------------------------------
-- 1. Fonctions d'assertion (SECURITY INVOKER : elles s'exécutent avec
--    le rôle et la RLS de la session simulée)
-- ---------------------------------------------------------------------

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Ouvre une session applicative simulée : rôle authenticated + claim sub.
create function tests.session(p_user uuid)
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', p_user::text, false);
  execute 'set role authenticated';
end;
$$;

-- Session serveur (Edge Function) : service_role, sans utilisateur.
create function tests.session_serveur()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', false);
  execute 'set role service_role';
end;
$$;

create function tests.session_anon()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', false);
  execute 'set role anon';
end;
$$;

create function tests.ok(p_libelle text)
returns void
language plpgsql
as $$
begin
  perform set_config('tests.nb_ok',
    (coalesce(nullif(current_setting('tests.nb_ok', true), ''), '0')::int + 1)::text, false);
  raise notice 'OK    %', p_libelle;
end;
$$;

-- Nombre de lignes renvoyées par une requête, sous la RLS courante.
create function tests.nb(p_requete text)
returns bigint
language plpgsql
as $$
declare
  v bigint;
begin
  execute format('select count(*) from (%s) s', p_requete) into v;
  return v;
end;
$$;

create function tests.egal(p_obtenu anyelement, p_attendu anyelement, p_libelle text)
returns void
language plpgsql
as $$
begin
  if p_obtenu is distinct from p_attendu then
    raise exception 'ECHEC %  — obtenu %, attendu %', p_libelle, p_obtenu, p_attendu;
  end if;
  perform tests.ok(p_libelle);
end;
$$;

-- La requête doit voir exactement p_attendu lignes.
create function tests.voit(p_requete text, p_attendu bigint, p_libelle text)
returns void
language plpgsql
as $$
begin
  perform tests.egal(tests.nb(p_requete), p_attendu, p_libelle);
end;
$$;

-- L'ordre doit échouer avec ce SQLSTATE précis (42501 = RLS ou
-- privilège, 23505 = unicité, 23503 = FK, ES001 = caisse clôturée...).
create function tests.echoue(p_ordre text, p_etat text, p_libelle text)
returns void
language plpgsql
as $$
declare
  v_echec boolean := false;
begin
  begin
    execute p_ordre;
  exception when others then
    if sqlstate <> p_etat then
      raise exception 'ECHEC %  — erreur % inattendue (%), attendu %',
        p_libelle, sqlstate, sqlerrm, p_etat;
    end if;
    v_echec := true;
  end;
  if not v_echec then
    raise exception 'ECHEC %  — l''ordre a REUSSI, attendu erreur %', p_libelle, p_etat;
  end if;
  perform tests.ok(p_libelle || '  [refus ' || p_etat || ']');
end;
$$;

-- L'ordre (INSERT/UPDATE/DELETE) doit réussir et toucher p_attendu lignes.
create function tests.touche(p_ordre text, p_attendu bigint, p_libelle text)
returns void
language plpgsql
as $$
declare
  v bigint;
begin
  execute p_ordre;
  get diagnostics v = row_count;
  perform tests.egal(v, p_attendu, p_libelle);
end;
$$;

create function tests.bilan(p_fichier text)
returns void
language plpgsql
as $$
begin
  raise notice '=== % : % assertions OK, aucun echec ===',
    p_fichier, coalesce(nullif(current_setting('tests.nb_ok', true), ''), '0');
  perform set_config('tests.nb_ok', '0', false);
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Jeu de données (inséré en propriétaire, hors RLS)
--
--   École C : directeur, enseignant (6eme A), 2 caissiers, 2 parents
--   École D : directeur, caissier, parent
--   Un super_admin.
-- ---------------------------------------------------------------------

insert into public.ecoles (id, nom, ville, statut_activation) values
  ('c0000000-0000-0000-0000-00000000000c', 'Ecole Test C', 'Nouakchott', 'active'),
  ('d0000000-0000-0000-0000-00000000000d', 'Ecole Test D', 'Rosso', 'active');

insert into auth.users (id, email) values
  ('0000000c-0000-0000-0000-0000000000a0', 'adm@c.test'),
  ('0000000c-0000-0000-0000-0000000000d1', 'dir@c.test'),
  ('0000000c-0000-0000-0000-0000000000d2', 'dir@d.test'),
  ('0000000c-0000-0000-0000-0000000000e1', 'ens@c.test'),
  ('0000000c-0000-0000-0000-0000000000c1', 'caisse1@c.test'),
  ('0000000c-0000-0000-0000-0000000000c2', 'caisse2@c.test'),
  ('0000000c-0000-0000-0000-0000000000c3', 'caisse@d.test'),
  ('0000000c-0000-0000-0000-0000000000f1', 'parent1@c.test'),
  ('0000000c-0000-0000-0000-0000000000f2', 'parent2@c.test'),
  ('0000000c-0000-0000-0000-0000000000f3', 'parent@d.test');

insert into public.profils (id, ecole_id, role, nom) values
  ('0000000c-0000-0000-0000-0000000000a0', null,                                   'super_admin', 'Adm'),
  ('0000000c-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-00000000000c', 'directeur',   'DirC'),
  ('0000000c-0000-0000-0000-0000000000d2', 'd0000000-0000-0000-0000-00000000000d', 'directeur',   'DirD'),
  ('0000000c-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-00000000000c', 'enseignant',  'EnsC'),
  ('0000000c-0000-0000-0000-0000000000c1', 'c0000000-0000-0000-0000-00000000000c', 'caissier',    'CaisseC1'),
  ('0000000c-0000-0000-0000-0000000000c2', 'c0000000-0000-0000-0000-00000000000c', 'caissier',    'CaisseC2'),
  ('0000000c-0000-0000-0000-0000000000c3', 'd0000000-0000-0000-0000-00000000000d', 'caissier',    'CaisseD'),
  ('0000000c-0000-0000-0000-0000000000f1', 'c0000000-0000-0000-0000-00000000000c', 'parent',      'ParentC1'),
  ('0000000c-0000-0000-0000-0000000000f2', 'c0000000-0000-0000-0000-00000000000c', 'parent',      'ParentC2'),
  ('0000000c-0000-0000-0000-0000000000f3', 'd0000000-0000-0000-0000-00000000000d', 'parent',      'ParentD');

insert into public.eleves (id, ecole_id, nom, prenom, classe) values
  ('1000000c-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000c', 'Diallo', 'Awa',   '6eme A'),
  ('1000000c-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000000c', 'Ba',     'Omar',  '5eme B'),
  ('1000000c-0000-0000-0000-00000000000d', 'd0000000-0000-0000-0000-00000000000d', 'Sow',    'Mariem','6eme A');

insert into public.affectations_enseignants (ecole_id, enseignant_id, classe) values
  ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000e1', '6eme A');

insert into public.echeances (id, ecole_id, eleve_id, libelle, montant, date_echeance) values
  ('2000000c-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000c',
   '1000000c-0000-0000-0000-000000000001', 'Tranche 1', 15000, current_date + 15),
  ('2000000c-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000000c',
   '1000000c-0000-0000-0000-000000000002', 'Tranche 1', 15000, current_date + 15),
  ('2000000c-0000-0000-0000-00000000000d', 'd0000000-0000-0000-0000-00000000000d',
   '1000000c-0000-0000-0000-00000000000d', 'Tranche 1', 15000, current_date + 15);

-- Paiements insérés AVANT les liens parent-élève : le jeu de départ ne
-- contient donc aucune notification, les tests 05 les créent eux-mêmes.
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, reference_transaction) values
  ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 4000, 'bankily', 'confirme', 'FIX-C1'),
  ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000002', 4000, 'bankily', 'confirme', 'FIX-C2'),
  ('d0000000-0000-0000-0000-00000000000d', '2000000c-0000-0000-0000-00000000000d', 4000, 'bankily', 'confirme', 'FIX-D1');

insert into public.parents_eleves (ecole_id, parent_id, eleve_id, lien, principal) values
  ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f1', '1000000c-0000-0000-0000-000000000001', 'mere', true),
  ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f2', '1000000c-0000-0000-0000-000000000002', 'pere', true),
  ('d0000000-0000-0000-0000-00000000000d', '0000000c-0000-0000-0000-0000000000f3', '1000000c-0000-0000-0000-00000000000d', 'mere', true);

insert into public.absences (ecole_id, eleve_id, date_absence, type) values
  ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000001', current_date - 3, 'absence'),
  ('c0000000-0000-0000-0000-00000000000c', '1000000c-0000-0000-0000-000000000002', current_date - 3, 'absence'),
  ('d0000000-0000-0000-0000-00000000000d', '1000000c-0000-0000-0000-00000000000d', current_date - 3, 'retard');

select tests.egal((select count(*) from public.notifications
                     where ecole_id in ('c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d')),
                  0::bigint, 'harnais : jeu de depart sans notification');
