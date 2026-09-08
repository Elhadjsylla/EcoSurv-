-- =====================================================================
--  ███  COMPTES DE TEST — NE JAMAIS EXÉCUTER EN PRODUCTION  ███
--
--  Rattache les comptes de démonstration à l'école fictive créée par
--  01_donnees_test.sql : profils, liens parent-élève, affectations
--  d'enseignant.
--
--  POURQUOI UN FICHIER SÉPARÉ
--  public.profils.id référence auth.users(id). Or un compte Auth ne se
--  crée pas proprement en SQL : il doit passer par Supabase Auth (mot de
--  passe haché, confirmation, métadonnées internes). Écrire directement
--  dans auth.users produirait des comptes incohérents, et manipuler la
--  service_role key est exclu par SECURITY_RULES.md §3.
--
--  À FAIRE AVANT D'EXÉCUTER CE FICHIER
--  Dans le dashboard Supabase, Authentication > Users > Add user, créer
--  les six comptes ci-dessous en cochant « Auto Confirm User ».
--  Choisissez un mot de passe de test quelconque : il n'apparaît nulle
--  part dans ce dépôt et ne doit pas y apparaître.
--
--    superadmin.demo@ecosurv.test   -> super_admin (hors école)
--    directeur.demo@ecosurv.test    -> directeur
--    enseignant.demo@ecosurv.test   -> enseignant, affecté à 6ème A et CM2
--    caissier.demo@ecosurv.test     -> caissier
--    parent1.demo@ecosurv.test      -> parent de DEUX enfants (fratrie)
--    parent2.demo@ecosurv.test      -> parent d'un enfant
--
--  Ce script est idempotent : il ne traite que les comptes qu'il trouve,
--  ignore les autres, et peut être relancé après avoir ajouté un compte
--  manquant. Il affiche à la fin ce qui a été rattaché et ce qui manque.
--
--  Le domaine .test est réservé par la RFC 6761 : ces adresses ne peuvent
--  correspondre à aucune boîte réelle.
-- =====================================================================

do $$
declare
  v_ecole  uuid := '11111111-1111-1111-1111-111111111111';
  v_id     uuid;
  v_manque text[] := '{}';
begin

  if not exists (select 1 from public.ecoles where id = v_ecole) then
    raise exception
      'L''ecole de demonstration est absente : executez d''abord supabase/seed/01_donnees_test.sql';
  end if;

  -- --- super_admin (ecole_id NULL, imposé par profils_ecole_selon_role) ---
  select id into v_id from auth.users where email = 'superadmin.demo@ecosurv.test';
  if v_id is null then
    v_manque := v_manque || 'superadmin.demo@ecosurv.test'::text;
  else
    insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
    values (v_id, null, 'super_admin', 'Démo', 'Super Admin',
            '+222 46 00 00 01', 'superadmin.demo@ecosurv.test')
    on conflict (id) do nothing;
  end if;

  -- --- directeur ---
  select id into v_id from auth.users where email = 'directeur.demo@ecosurv.test';
  if v_id is null then
    v_manque := v_manque || 'directeur.demo@ecosurv.test'::text;
  else
    insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
    values (v_id, v_ecole, 'directeur', 'Ould Mohamed', 'Sidi',
            '+222 46 00 00 02', 'directeur.demo@ecosurv.test')
    on conflict (id) do nothing;
  end if;

  -- --- enseignant, affecté à 6ème A et CM2 uniquement ---
  -- Deux classes sur cinq : c'est ce qui permet de vérifier visuellement
  -- qu'il ne voit pas les élèves de 5ème B, 4ème A et 3ème.
  select id into v_id from auth.users where email = 'enseignant.demo@ecosurv.test';
  if v_id is null then
    v_manque := v_manque || 'enseignant.demo@ecosurv.test'::text;
  else
    insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
    values (v_id, v_ecole, 'enseignant', 'Mint Ahmed', 'Salma',
            '+222 46 00 00 03', 'enseignant.demo@ecosurv.test')
    on conflict (id) do nothing;

    insert into public.affectations_enseignants
      (ecole_id, enseignant_id, classe, annee_scolaire)
    values (v_ecole, v_id, '6ème A', '2025-2026'),
           (v_ecole, v_id, 'CM2',    '2025-2026')
    on conflict (enseignant_id, classe, annee_scolaire) do nothing;
  end if;

  -- --- caissier ---
  select id into v_id from auth.users where email = 'caissier.demo@ecosurv.test';
  if v_id is null then
    v_manque := v_manque || 'caissier.demo@ecosurv.test'::text;
  else
    insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
    values (v_id, v_ecole, 'caissier', 'Ould Taleb', 'Ahmedou',
            '+222 46 00 00 04', 'caissier.demo@ecosurv.test')
    on conflict (id) do nothing;
  end if;

  -- --- parent 1 : deux enfants, dont un à jour et un en retard ---
  -- Illustre le many-to-many de parents_eleves (§5.1) et permet de voir
  -- un portail parent avec plusieurs fiches.
  select id into v_id from auth.users where email = 'parent1.demo@ecosurv.test';
  if v_id is null then
    v_manque := v_manque || 'parent1.demo@ecosurv.test'::text;
  else
    insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
    values (v_id, v_ecole, 'parent', 'Ould Ahmed', 'Brahim',
            '+222 46 00 00 05', 'parent1.demo@ecosurv.test')
    on conflict (id) do nothing;

    insert into public.parents_eleves (ecole_id, parent_id, eleve_id, lien, principal)
    values
      -- Mohamed Lemine (6ème A, à jour)
      (v_ecole, v_id, 'e1e1e1e1-0000-4000-8000-000000000001', 'pere', true),
      -- Moustapha (CM2, en retard, aucun paiement)
      (v_ecole, v_id, 'e1e1e1e1-0000-4000-8000-000000000010', 'pere', true)
    on conflict (parent_id, eleve_id) do nothing;
  end if;

  -- --- parent 2 : un seul enfant, avec un acompte en cours ---
  select id into v_id from auth.users where email = 'parent2.demo@ecosurv.test';
  if v_id is null then
    v_manque := v_manque || 'parent2.demo@ecosurv.test'::text;
  else
    insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
    values (v_id, v_ecole, 'parent', 'Ba', 'Aïssata',
            '+222 46 00 00 06', 'parent2.demo@ecosurv.test')
    on conflict (id) do nothing;

    insert into public.parents_eleves (ecole_id, parent_id, eleve_id, lien, principal)
    values (v_ecole, v_id, 'e1e1e1e1-0000-4000-8000-000000000003', 'mere', true)
    on conflict (parent_id, eleve_id) do nothing;
  end if;

  if array_length(v_manque, 1) > 0 then
    raise notice 'Comptes Auth introuvables, donc non rattaches : %',
      array_to_string(v_manque, ', ');
    raise notice 'Creez-les dans Authentication > Users, puis relancez ce fichier.';
  else
    raise notice 'Les six comptes de demonstration sont rattaches.';
  end if;

end $$;

-- ---------------------------------------------------------------------
-- Contrôle : qui est rattaché, et à quoi
-- ---------------------------------------------------------------------

select
  p.role,
  p.prenom || ' ' || p.nom as personne,
  p.email,
  case p.role
    when 'super_admin' then 'toutes les écoles'
    when 'enseignant' then coalesce(
      (select string_agg(a.classe, ', ' order by a.classe)
         from public.affectations_enseignants a
        where a.enseignant_id = p.id),
      'aucune classe affectée')
    when 'parent' then coalesce(
      (select string_agg(el.prenom || ' (' || el.classe || ')', ', ' order by el.prenom)
         from public.parents_eleves pe
         join public.eleves el on el.id = pe.eleve_id
        where pe.parent_id = p.id),
      'aucun enfant lié')
    else 'toute son école'
  end as perimetre
from public.profils p
where p.email like '%.demo@ecosurv.test'
order by p.role, p.nom;
