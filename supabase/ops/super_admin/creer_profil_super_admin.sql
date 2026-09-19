-- =====================================================================
-- EcoSurv — Donner le rôle super_admin à un compte existant
--
-- À exécuter à la main dans le SQL Editor Supabase, APRÈS avoir créé le
-- compte dans Authentication > Users > Add user > Create new user
-- (email + mot de passe, « Auto Confirm User » coché).
--
-- Ce que fait le script, en une seule transaction :
--   1. vérifie que le compte existe (email exact) et que son email est
--      confirmé ;
--   2. crée son profil : role = 'super_admin', ecole_id = NULL (imposé par
--      la contrainte profils_ecole_selon_role). Sans effet si le profil
--      super_admin existe déjà ; REFUS si le compte a déjà un autre rôle
--      (ce serait un compte d'école : utiliser une autre adresse) ;
--   3. SE CONNECTE EN TANT QUE CE COMPTE (rôle authenticated + son
--      identifiant, exactement comme l'application) et compte ce que la
--      RLS lui laisse voir : toutes les écoles (y compris en attente et
--      suspendues), tous les élèves, tous les paiements. Si ce n'est pas
--      la totalité, TOUT est annulé, profil compris.
--
-- Le résultat s'affiche en dernière requête : une ligne par contrôle.
-- Rien d'autre n'est modifié. Ré-exécutable sans danger.
-- =====================================================================

drop table if exists pg_temp.verification_super_admin;
create temp table verification_super_admin (
  ordre int, controle text, vu bigint, total bigint, verdict text
);

do $sa$
declare
  -- ===================== À RENSEIGNER ==============================
  c_email   constant text := 'votre.adresse@exemple.mr';
  c_nom     constant text := 'SYLLA';
  c_prenom  constant text := 'Elhadj';
  -- ================================================================
  v_id        uuid;
  v_confirme  timestamptz;
  v_role      public.role_utilisateur;
  v_ecole     uuid;
  v_nb        int;
  v_total_ecoles bigint; v_total_attente bigint; v_total_eleves bigint; v_total_paiements bigint;
  v_ecoles bigint; v_attente bigint; v_eleves bigint; v_paiements bigint;
  v_est_super_admin boolean; v_acces boolean;
begin
  -- 1. Le compte Auth
  select count(*) into v_nb from auth.users where email = c_email;
  if v_nb <> 1 then
    raise exception 'REFUS : % compte Auth avec l''email « % ». Rien n''a été modifié.', v_nb, c_email
      using hint = 'Créer d''abord le compte dans Authentication > Users > Add user, puis recopier l''email exact.';
  end if;
  select id, email_confirmed_at into v_id, v_confirme from auth.users where email = c_email;
  if v_confirme is null then
    raise exception 'REFUS : l''email « % » n''est pas confirmé : ce compte ne peut pas se connecter. Rien n''a été modifié.', c_email
      using hint = 'Recréer le compte avec « Auto Confirm User » coché, ou confirmer l''email.';
  end if;

  -- 2. Le profil
  select role, ecole_id into v_role, v_ecole from public.profils where id = v_id;
  if found and v_role <> 'super_admin' then
    raise exception 'REFUS : ce compte est déjà « % » de l''école %. Rien n''a été modifié.', v_role, v_ecole
      using hint = 'Un compte d''école ne devient pas super_admin : utiliser une adresse dédiée.';
  end if;
  if not found then
    insert into public.profils (id, ecole_id, role, nom, prenom, email, actif)
    values (v_id, null, 'super_admin', c_nom, c_prenom, c_email, true);
  end if;
  update public.profils set actif = true where id = v_id and not actif;

  -- 3. Ce que la RLS laisse voir à ce compte, comparé à la totalité
  select count(*), count(*) filter (where statut_activation <> 'active')
    into v_total_ecoles, v_total_attente from public.ecoles;
  select count(*) into v_total_eleves    from public.eleves;
  select count(*) into v_total_paiements from public.paiements;

  -- Session applicative simulée : les deux formes du claim lues par
  -- auth.uid() selon les versions de Supabase.
  perform set_config('request.jwt.claim.sub', v_id::text, true);
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*), count(*) filter (where statut_activation <> 'active')
    into v_ecoles, v_attente from public.ecoles;
  select count(*) into v_eleves    from public.eleves;
  select count(*) into v_paiements from public.paiements;
  select public.est_super_admin() into v_est_super_admin;
  select acces_donnees into v_acces from public.mon_statut_acces();

  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  insert into verification_super_admin values
    (1, 'Compte ' || c_email || ' : est_super_admin()', null, null,
        case when v_est_super_admin then 'OK' else 'ÉCHEC' end),
    (2, 'Accès aux données (mon_statut_acces)', null, null,
        case when v_acces then 'OK' else 'ÉCHEC' end),
    (3, 'Écoles visibles (toutes)', v_ecoles, v_total_ecoles,
        case when v_ecoles = v_total_ecoles then 'OK' else 'ÉCHEC' end),
    (4, 'dont écoles en attente / suspendues', v_attente, v_total_attente,
        case when v_attente = v_total_attente then 'OK' else 'ÉCHEC' end),
    (5, 'Élèves visibles (toutes écoles)', v_eleves, v_total_eleves,
        case when v_eleves = v_total_eleves then 'OK' else 'ÉCHEC' end),
    (6, 'Paiements visibles (toutes écoles)', v_paiements, v_total_paiements,
        case when v_paiements = v_total_paiements then 'OK' else 'ÉCHEC' end);

  if exists (select 1 from verification_super_admin where verdict <> 'OK') then
    raise exception 'ANNULÉ : le compte ne voit pas toutes les données (% écoles sur %, % élèves sur %). Le profil n''a PAS été créé.',
      v_ecoles, v_total_ecoles, v_eleves, v_total_eleves;
  end if;
end
$sa$;

select controle, vu, total, verdict
  from verification_super_admin
 order by ordre;
