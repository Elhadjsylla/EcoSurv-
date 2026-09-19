-- =====================================================================
-- EcoSurv — Auto-inscription des écoles et activation par le super_admin
--
-- Parcours :
--   1. Un directeur s'inscrit depuis l'application (supabase.auth.signUp,
--      métadonnée type_inscription = 'ecole'). Dans la MÊME transaction que
--      la création du compte Auth, le trigger inscrire_ecole_depuis_compte
--      crée son école (statut_activation = 'en_attente') et son profil
--      (rôle 'directeur', rattaché à cette école). Si l'une des insertions
--      échoue, le compte Auth n'est pas créé non plus : tout ou rien.
--   2. Tant que l'école n'est pas 'active', ses membres se connectent mais
--      n'accèdent à AUCUNE donnée d'école : ils ne lisent que leur propre
--      profil et la fiche de leur école (pour l'écran d'attente).
--   3. Le super_admin liste les écoles en attente et les active (ou les
--      suspend) par RPC. Personne d'autre ne peut changer ce statut.
--
-- Pourquoi un trigger sur auth.users et pas une RPC qui « crée le compte » :
-- un compte Auth ne se crée proprement que par Supabase Auth (hachage du
-- mot de passe, identités, email de confirmation). Une RPC ou une Edge
-- Function qui créerait le compte puis l'école ferait deux opérations
-- séparées, sans atomicité. Le trigger, lui, s'exécute dans la
-- transaction de création du compte.
--
-- Les métadonnées d'inscription viennent du client : elles ne décident
-- JAMAIS du rôle, de l'école de rattachement ni du statut. Une inscription
-- crée toujours une école NEUVE, en attente, dont l'inscrit est directeur.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Statut d'activation de l'école
-- ---------------------------------------------------------------------

create type public.statut_activation_ecole as enum (
  'en_attente',   -- inscrite, pas encore validée par le super_admin
  'active',       -- accès normal aux données
  'suspendue'     -- accès coupé pour tous les comptes de l'école
);

-- Les écoles DÉJÀ présentes (créées à la main, en service) passent
-- 'active' : sans cela, leurs comptes perdraient tout accès au moment de
-- la migration. Toute école créée ensuite est 'en_attente' par défaut
-- (fail-closed) : y compris par un super_admin, qui doit alors l'activer,
-- ou l'insérer explicitement avec statut_activation = 'active'.
alter table public.ecoles
  add column statut_activation public.statut_activation_ecole not null default 'active';
alter table public.ecoles
  alter column statut_activation set default 'en_attente';

-- Trace du dernier changement de statut (qui, quand).
alter table public.ecoles
  add column statut_activation_modifie_le  timestamptz,
  add column statut_activation_modifie_par uuid
    references public.profils (id) on delete set null;

create index ecoles_statut_activation_idx on public.ecoles (statut_activation);

comment on column public.ecoles.statut_activation is
  'Porte d acces aux donnees : seuls les comptes d une ecole active voient ses donnees. Modifiable uniquement par changer_statut_activation_ecole() (super_admin). Distinct de statut_abonnement, commercial et non bloquant.';

-- Le statut n'est PAS ouvert aux grants d'UPDATE de authenticated (qui
-- restent limités aux coordonnées, voir 20260908100000) : un directeur ne
-- peut donc pas activer sa propre école, même si la policy
-- ecoles_update_directeur lui ouvre la ligne.

-- ---------------------------------------------------------------------
-- 2. Fonctions de contexte : l'activation devient une condition d'accès
--
-- Même mécanisme que profils.actif : plutôt que de retoucher les ~80
-- policies, les fonctions de contexte renvoient NULL / false quand l'école
-- de l'appelant n'est pas active. Toutes les policies qui en dépendent
-- cessent de matcher d'un coup. Le super_admin (ecole_id NULL) n'est pas
-- concerné.
-- ---------------------------------------------------------------------

create or replace function public.mon_role()
returns public.role_utilisateur
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
    from public.profils p
    left join public.ecoles e on e.id = p.ecole_id
   where p.id = auth.uid()
     and p.actif
     and (p.ecole_id is null or e.statut_activation = 'active');
$$;

create or replace function public.mon_ecole_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.ecole_id
    from public.profils p
    join public.ecoles e on e.id = p.ecole_id
   where p.id = auth.uid()
     and p.actif
     and e.statut_activation = 'active';
$$;

-- Le périmètre parent ne passe pas par mon_ecole_id() (un parent peut
-- avoir des enfants dans plusieurs écoles, §5.1) : l'activation est donc
-- vérifiée sur l'école de l'ENFANT.
create or replace function public.est_tuteur_de(p_eleve_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.parents_eleves pe
      join public.ecoles e on e.id = pe.ecole_id
     where pe.parent_id = auth.uid()
       and pe.eleve_id = p_eleve_id
       and e.statut_activation = 'active'
  );
$$;

create or replace function public.est_tuteur_de_echeance(p_echeance_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.echeances ec
      join public.parents_eleves pe on pe.eleve_id = ec.eleve_id
      join public.ecoles e on e.id = ec.ecole_id
     where ec.id = p_echeance_id
       and pe.parent_id = auth.uid()
       and e.statut_activation = 'active'
  );
$$;

-- École de rattachement, QUEL QUE SOIT son statut : sert uniquement à
-- laisser un membre lire la fiche de sa propre école (écran d'attente ou
-- de suspension). Ne donne accès à aucune donnée d'école.
create or replace function public.mon_ecole_rattachement()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.ecole_id
    from public.profils p
   where p.id = auth.uid()
     and p.actif;
$$;

revoke execute on function public.mon_ecole_rattachement() from public, anon;
grant execute on function public.mon_ecole_rattachement() to authenticated;

alter policy ecoles_select_membre on public.ecoles
  using (id = (select public.mon_ecole_rattachement()));

-- Deux policies ne passaient par aucune fonction de contexte (seulement
-- auth.uid()) et laissaient donc lire ses liens / affectations dans une
-- école suspendue. Elles passent sous la même règle.
alter policy affectations_select_enseignant on public.affectations_enseignants
  using (enseignant_id = (select auth.uid())
         and ecole_id = (select public.mon_ecole_id()));

alter policy parents_eleves_select_parent on public.parents_eleves
  using (parent_id = (select auth.uid())
         and public.est_tuteur_de(eleve_id));

-- Restent lisibles quel que soit le statut, et c'est voulu :
--   profils_select_soi_meme  (son propre profil : rôle, nom)
--   ecoles_select_membre     (la fiche de son école : nom, statut)
-- C'est tout ce dont l'écran d'attente / de suspension a besoin.

-- ---------------------------------------------------------------------
-- 3. Inscription : trigger sur auth.users
--
-- Ne réagit qu'aux inscriptions d'école (métadonnée type_inscription =
-- 'ecole'). Un compte créé autrement (dashboard, invitation, futur
-- parcours parent) n'est pas concerné. Toute erreur fait échouer la
-- création du compte : Supabase Auth renvoie alors « Database error
-- saving new user » (le détail est masqué côté client : le frontend doit
-- valider les champs AVANT l'appel).
-- ---------------------------------------------------------------------

create or replace function public.inscrire_ecole_depuis_compte()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nom_ecole text  := nullif(btrim(v_meta ->> 'nom_ecole'), '');
  v_nom       text  := nullif(btrim(v_meta ->> 'nom'), '');
  v_prenom    text  := nullif(btrim(v_meta ->> 'prenom'), '');
  v_telephone text  := nullif(btrim(v_meta ->> 'telephone'), '');
  v_ville     text  := nullif(btrim(v_meta ->> 'ville'), '');
  v_ecole_id  uuid;
begin
  if v_meta ->> 'type_inscription' is distinct from 'ecole' then
    return new;
  end if;

  if new.email is null then
    raise exception 'Inscription d''école : une adresse email est requise'
      using errcode = '22023';
  end if;
  if v_nom_ecole is null or length(v_nom_ecole) > 150 then
    raise exception 'Inscription d''école : nom_ecole requis (150 caractères au plus)'
      using errcode = '22023';
  end if;
  if v_nom is null or length(v_nom) > 100
     or length(coalesce(v_prenom, '')) > 100
     or length(coalesce(v_telephone, '')) > 30
     or length(coalesce(v_ville, '')) > 100 then
    raise exception 'Inscription d''école : nom requis ; prenom, ville (100), telephone (30) trop longs'
      using errcode = '22023';
  end if;

  -- Toujours une école NEUVE et EN ATTENTE : ni ecole_id, ni statut, ni
  -- rôle ne sont lus dans les métadonnées.
  insert into public.ecoles (nom, ville, telephone, email, statut_activation, statut_abonnement)
  values (v_nom_ecole, v_ville, v_telephone, new.email, 'en_attente', 'essai')
  returning id into v_ecole_id;

  insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
  values (new.id, v_ecole_id, 'directeur', v_nom, v_prenom, v_telephone, new.email);

  return new;
end;
$$;

revoke execute on function public.inscrire_ecole_depuis_compte() from public, anon, authenticated;

create trigger inscrire_ecole_depuis_compte
  after insert on auth.users
  for each row execute function public.inscrire_ecole_depuis_compte();

-- ---------------------------------------------------------------------
-- 4. RPC
-- ---------------------------------------------------------------------

-- État d'accès de l'appelant, calculé avec les MÊMES fonctions que la
-- RLS : c'est ce que le frontend consulte après la connexion pour choisir
-- entre l'application, l'écran d'attente et l'écran de suspension.
create or replace function public.mon_statut_acces()
returns table (
  role               public.role_utilisateur,
  profil_actif       boolean,
  ecole_id           uuid,
  ecole_nom          text,
  statut_activation  public.statut_activation_ecole,
  acces_donnees      boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role,
         p.actif,
         p.ecole_id,
         e.nom,
         e.statut_activation,
         public.mon_role() is not null
    from public.profils p
    left join public.ecoles e on e.id = p.ecole_id
   where p.id = auth.uid();
$$;

-- Écoles en attente, avec leur directeur inscrit. Réservé au super_admin
-- (refus explicite sinon, pas une liste vide : une erreur se voit).
create or replace function public.ecoles_en_attente()
returns table (
  ecole_id          uuid,
  nom               text,
  ville             text,
  telephone         text,
  email             text,
  inscrite_le       timestamptz,
  directeur_id      uuid,
  directeur_nom     text,
  directeur_prenom  text,
  directeur_email   text,
  email_confirme    boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.est_super_admin() then
    raise exception 'Réservé au super_admin' using errcode = '42501';
  end if;

  return query
    select e.id, e.nom, e.ville, e.telephone, e.email, e.created_at,
           p.id, p.nom, p.prenom, u.email::text, u.email_confirmed_at is not null
      from public.ecoles e
      left join public.profils p
        on p.ecole_id = e.id and p.role = 'directeur'
      left join auth.users u on u.id = p.id
     where e.statut_activation = 'en_attente'
     order by e.created_at;
end;
$$;

-- Seule voie de changement du statut d'activation (la colonne n'est pas
-- ouverte aux grants d'UPDATE). Tracé : qui, quand.
create or replace function public.changer_statut_activation_ecole(
  p_ecole_id uuid,
  p_statut   public.statut_activation_ecole
)
returns public.statut_activation_ecole
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_statut public.statut_activation_ecole;
begin
  if not public.est_super_admin() then
    raise exception 'Réservé au super_admin' using errcode = '42501';
  end if;
  if p_statut is null then
    raise exception 'Statut requis' using errcode = '22023';
  end if;

  update public.ecoles
     set statut_activation             = p_statut,
         statut_activation_modifie_le  = now(),
         statut_activation_modifie_par = auth.uid()
   where id = p_ecole_id
  returning statut_activation into v_statut;

  if not found then
    raise exception 'École % introuvable', p_ecole_id using errcode = 'P0002';
  end if;
  return v_statut;
end;
$$;

revoke execute on function public.mon_statut_acces()                     from public, anon;
revoke execute on function public.ecoles_en_attente()                    from public, anon;
revoke execute on function public.changer_statut_activation_ecole(uuid, public.statut_activation_ecole) from public, anon;
grant execute on function public.mon_statut_acces()                      to authenticated;
grant execute on function public.ecoles_en_attente()                     to authenticated;
grant execute on function public.changer_statut_activation_ecole(uuid, public.statut_activation_ecole) to authenticated;
