-- =====================================================================
-- EcoSurv — Notifications utilisateur
--
-- Une notification est un message adressé à UN utilisateur d'UNE école.
-- Elle est écrite exclusivement côté serveur (service_role, triggers,
-- fonctions ci-dessous) : aucun utilisateur authentifié ne peut en créer,
-- ni pour lui-même ni pour un autre. Le client ne peut que lire les
-- siennes et les marquer lues.
--
-- Notification « à un rôle » : elle est éclatée en une ligne par membre
-- actif du rôle au moment de l'envoi (role_cible garde la trace du
-- ciblage). Une ligne partagée par tout un rôle aurait un état `lu`
-- commun : un caissier qui la marque lue la ferait disparaître chez ses
-- collègues, c'est-à-dire une écriture d'un utilisateur sur ce que voit
-- un autre. Avec l'éclatement, user_id est toujours renseigné et la
-- policy de lecture reste user_id = auth.uid().
--
-- Checklist BACKEND_AGENT.md §6 : ecole_id, FK composites, RLS activée
-- dans la même migration, anon révoqué, policies TO authenticated,
-- colonnes sensibles hors des grants.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enum des types de notification
-- ---------------------------------------------------------------------

-- 'nouvelle_note' est réservé à la V2 (notes et bulletins) : aucune table
-- de notes n'existe encore, rien ne l'émet pour l'instant.
create type public.type_notification as enum (
  'echeance_retard',
  'nouvelle_note',
  'paiement_confirme'
);

-- ---------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  ecole_id    uuid not null references public.ecoles (id) on delete cascade,
  -- Destinataire. Toujours renseigné, y compris pour un envoi à un rôle.
  user_id     uuid not null,
  -- Renseigné quand la notification a été envoyée à tout un rôle.
  role_cible  public.role_utilisateur,
  -- Élève concerné, quand il y en a un : permet au portail parent de
  -- filtrer sur l'enfant sélectionné.
  eleve_id    uuid,
  type        public.type_notification not null,
  message     text not null,
  lu          boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint notifications_message_valide
    check (length(btrim(message)) between 1 and 1000),
  -- Un super_admin n'a pas d'école : il ne peut pas être la cible d'une
  -- notification scopée par ecole_id.
  constraint notifications_role_cible_valide
    check (role_cible is null or role_cible <> 'super_admin'),
  -- FK composite : le destinataire appartient forcément à l'école de la
  -- notification. Une notification de l'école A adressée à un compte de
  -- l'école B est rejetée par PostgreSQL, indépendamment de toute policy.
  constraint notifications_destinataire_fk
    foreign key (ecole_id, user_id)
    references public.profils (ecole_id, id) on delete cascade,
  -- Même garantie pour l'élève (MATCH SIMPLE : ignorée si eleve_id est NULL).
  constraint notifications_eleve_fk
    foreign key (ecole_id, eleve_id)
    references public.eleves (ecole_id, id) on delete cascade
);

-- Sert la cloche du header : « mes non lues, les plus récentes d'abord ».
create index notifications_destinataire_idx
  on public.notifications (user_id, lu, created_at desc);
create index notifications_ecole_id_idx
  on public.notifications (ecole_id);
create index notifications_eleve_id_idx
  on public.notifications (eleve_id)
  where eleve_id is not null;

comment on table public.notifications is
  'Notifications par destinataire. Ecriture reservee au serveur (service_role, triggers) : le client ne peut que lire les siennes et modifier la colonne lu.';
comment on column public.notifications.role_cible is
  'Renseigne quand la notification a ete envoyee a tout un role : une ligne par membre actif, pour que lu reste propre a chacun.';

-- ---------------------------------------------------------------------
-- 3. RLS et privilèges
-- ---------------------------------------------------------------------

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon;

-- Le client ne crée ni ne supprime aucune notification : ni INSERT ni
-- DELETE, et l'UPDATE est limité à la colonne `lu`. Changer le message,
-- le destinataire ou l'école d'une notification existante est donc
-- impossible même sur ses propres lignes.
revoke all on table public.notifications from authenticated;
grant select on table public.notifications to authenticated;
grant update (lu) on table public.notifications to authenticated;

-- Lecture : ses propres notifications, dans son école. Le filtre ecole_id
-- est redondant avec la FK composite ; il est gardé en défense en
-- profondeur. mon_ecole_id() filtrant sur profils.actif, un compte
-- désactivé ne lit plus rien.
--
-- Pas de policy directeur ni super_admin : une notification est une
-- correspondance personnelle, pas une donnée de pilotage.
create policy notifications_select_destinataire on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid())
         and ecole_id = (select public.mon_ecole_id()));

-- Marquer lue / non lue. Seule `lu` est ouverte par les grants.
create policy notifications_update_destinataire on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())
         and ecole_id = (select public.mon_ecole_id()))
  with check (user_id = (select auth.uid())
              and ecole_id = (select public.mon_ecole_id()));

-- ---------------------------------------------------------------------
-- 4. Fonctions serveur de création
--
-- SECURITY INVOKER et exécution révoquée à authenticated : seuls le
-- service_role (Edge Functions) et les triggers SECURITY DEFINER du
-- schéma peuvent les appeler. Les rendre SECURITY DEFINER et exécutables
-- par authenticated reviendrait à laisser tout utilisateur notifier
-- n'importe qui dans son école.
-- ---------------------------------------------------------------------

-- Notification à un utilisateur précis. La FK composite rejette un
-- destinataire qui n'appartient pas à p_ecole_id.
create or replace function public.notifier_utilisateur(
  p_ecole_id  uuid,
  p_user_id   uuid,
  p_type      public.type_notification,
  p_message   text,
  p_eleve_id  uuid default null
)
returns uuid
language sql
volatile
set search_path = public, pg_temp
as $$
  insert into public.notifications (ecole_id, user_id, type, message, eleve_id)
  values (p_ecole_id, p_user_id, p_type, p_message, p_eleve_id)
  returning id;
$$;

-- Notification à tous les membres ACTIFS d'un rôle dans une école.
-- Renvoie le nombre de destinataires.
create or replace function public.notifier_role(
  p_ecole_id  uuid,
  p_role      public.role_utilisateur,
  p_type      public.type_notification,
  p_message   text,
  p_eleve_id  uuid default null
)
returns integer
language sql
volatile
set search_path = public, pg_temp
as $$
  with envoi as (
    insert into public.notifications
      (ecole_id, user_id, role_cible, type, message, eleve_id)
    select p.ecole_id, p.id, p_role, p_type, p_message, p_eleve_id
      from public.profils p
     where p.ecole_id = p_ecole_id
       and p.role = p_role
       and p.actif
    returning 1
  )
  select count(*)::integer from envoi;
$$;

revoke execute on function public.notifier_utilisateur(uuid, uuid, public.type_notification, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.notifier_role(uuid, public.role_utilisateur, public.type_notification, text, uuid)
  from public, anon, authenticated;
grant execute on function public.notifier_utilisateur(uuid, uuid, public.type_notification, text, uuid)
  to service_role;
grant execute on function public.notifier_role(uuid, public.role_utilisateur, public.type_notification, text, uuid)
  to service_role;
