-- =====================================================================
-- EcoSurv — Clôtures de caisse
--
-- Une clôture fige, pour un caissier (son « poste ») et une journée, le
-- total des encaissements confirmés qu'il a enregistrés. Règle métier :
-- une fois la journée clôturée, AUCUN nouvel encaissement ne peut être
-- enregistré sur cette journée pour ce poste. Elle est appliquée par la
-- base (trigger paiements_verrou_cloture), pas par l'écran.
--
-- Trois choix de conception, à ne pas « simplifier » :
--
--  1. Les totaux ne viennent jamais du client. Le caissier n'envoie que
--     (ecole_id, caissier_id, date_cloture) ; montant_total_encaisse et
--     nombre_operations sont calculés par le trigger à partir des
--     paiements. Un total déclaratif serait falsifiable.
--
--  2. La journée d'un encaissement est celle de son ENREGISTREMENT
--     serveur : jour_caisse(paiements.created_at), created_at n'étant plus
--     fourni par le client depuis la migration 20260918092000. paye_le
--     n'est pas utilisé : il a longtemps été fourni par le navigateur.
--
--  3. Le calcul du total et le contrôle d'un nouvel encaissement se
--     sérialisent sur un verrou consultatif (poste, jour). Sans lui, un
--     encaissement non encore commité au moment de la clôture passerait
--     entre les deux : absent du total, et accepté sur une journée close.
--
-- Une clôture est immuable côté client (ni UPDATE ni DELETE) : une
-- correction passe par le service_role, qui doit supprimer la clôture
-- avant de toucher aux encaissements de la journée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Journée de caisse
--
-- Toutes les écoles clientes sont en Mauritanie : Africa/Nouakchott,
-- UTC+0 sans heure d'été. Le fuseau est explicite pour que le résultat
-- ne dépende pas du paramètre TimeZone de la session. Si une école hors
-- de ce fuseau arrive un jour, le fuseau deviendra une colonne de ecoles.
-- ---------------------------------------------------------------------

create or replace function public.jour_caisse(p_instant timestamptz)
returns date
language sql
immutable
parallel safe
as $$
  select (p_instant at time zone 'Africa/Nouakchott')::date;
$$;

comment on function public.jour_caisse is
  'Journee de caisse d un instant (fuseau Africa/Nouakchott). Base commune des clotures et du verrou des encaissements.';

-- Clé du verrou consultatif partagé par la clôture et l'encaissement.
create or replace function public.verrou_caisse(p_caissier_id uuid, p_jour date)
returns bigint
language sql
immutable
parallel safe
as $$
  select hashtextextended('ecosurv.caisse:' || p_caissier_id::text || ':' || p_jour::text, 0);
$$;

-- Sert le calcul des totaux d'une clôture.
create index paiements_caisse_jour_idx
  on public.paiements (ecole_id, encaisse_par, (public.jour_caisse(created_at)))
  where encaisse_par is not null;

-- ---------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------

create table public.clotures_caisse (
  id                      uuid primary key default gen_random_uuid(),
  ecole_id                uuid not null references public.ecoles (id) on delete cascade,
  caissier_id             uuid not null,
  date_cloture            date not null,
  -- Calculés par le trigger clotures_caisse_calcul, jamais saisis.
  montant_total_encaisse  numeric(12,2) not null default 0,
  nombre_operations       integer not null default 0,
  created_at              timestamptz not null default now(),

  constraint clotures_montant_positif check (montant_total_encaisse >= 0),
  constraint clotures_operations_positif check (nombre_operations >= 0),
  -- Une seule clôture par poste et par jour.
  constraint clotures_unique_par_poste_jour
    unique (ecole_id, caissier_id, date_cloture),
  -- FK composite : le caissier appartient à l'école de la clôture.
  -- ON DELETE RESTRICT : la piste de caisse survit au compte. Un caissier
  -- qui a clôturé ne se supprime pas, il se désactive (actif = false).
  constraint clotures_caissier_fk
    foreign key (ecole_id, caissier_id)
    references public.profils (ecole_id, id) on delete restrict
);

create index clotures_ecole_date_idx
  on public.clotures_caisse (ecole_id, date_cloture desc);
create index clotures_caissier_idx
  on public.clotures_caisse (caissier_id, date_cloture desc);

comment on table public.clotures_caisse is
  'Cloture journaliere de caisse par poste (caissier). Totaux calcules en base. Une journee cloturee refuse tout nouvel encaissement de ce poste.';
comment on column public.clotures_caisse.montant_total_encaisse is
  'Somme des paiements confirme enregistres par ce caissier ce jour-la, au moment de la cloture. Instantane : une confirmation ou annulation ulterieure par le serveur ne le modifie pas.';

-- ---------------------------------------------------------------------
-- 3. Calcul des totaux à la création
--
-- SECURITY DEFINER : le total doit porter sur TOUS les paiements du
-- poste, pas sur ceux que la RLS de l'appelant lui laisse voir. Un
-- contrôle qui dépend de la visibilité de l'appelant est un contrôle
-- qu'on contourne en changeant d'appelant.
-- ---------------------------------------------------------------------

create or replace function public.clotures_caisse_calcul()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(public.verrou_caisse(new.caissier_id, new.date_cloture));

  -- Après le verrou, cette requête prend un nouvel instantané (READ
  -- COMMITTED) : elle voit tout encaissement commité pendant l'attente.
  select coalesce(sum(p.montant), 0), count(*)
    into new.montant_total_encaisse, new.nombre_operations
    from public.paiements p
   where p.ecole_id = new.ecole_id
     and p.encaisse_par = new.caissier_id
     and p.statut = 'confirme'
     and public.jour_caisse(p.created_at) = new.date_cloture;

  new.created_at := now();
  return new;
end;
$$;

create trigger clotures_caisse_calcul
  before insert on public.clotures_caisse
  for each row execute function public.clotures_caisse_calcul();

-- ---------------------------------------------------------------------
-- 4. Verrou des encaissements sur une journée close
--
-- Refuse, pour tout rôle y compris le service_role :
--  - l'INSERT d'un paiement dont le poste (encaisse_par) a clôturé la
--    journée de son enregistrement ;
--  - l'UPDATE qui ferait entrer ou sortir un paiement d'une journée close,
--    ou en changerait le montant (montant, encaisse_par, ecole_id,
--    created_at).
-- Un changement de statut reste permis : c'est la voie serveur prévue
-- pour confirmer un chèque ou annuler un paiement (§6). Il ne réécrit
-- pas la clôture, qui reste l'instantané du moment où elle a été faite.
--
-- Code d'erreur dédié ES001 : le frontend peut l'intercepter pour
-- afficher « caisse clôturée » plutôt qu'une erreur générique.
-- ---------------------------------------------------------------------

create or replace function public.paiements_verrou_cloture()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_jour date;
begin
  if tg_op = 'UPDATE' then
    if new.montant      is not distinct from old.montant
       and new.encaisse_par is not distinct from old.encaisse_par
       and new.ecole_id     is not distinct from old.ecole_id
       and new.created_at   is not distinct from old.created_at then
      return new;
    end if;

    if old.encaisse_par is not null then
      v_jour := public.jour_caisse(old.created_at);
      perform pg_advisory_xact_lock(public.verrou_caisse(old.encaisse_par, v_jour));
      if exists (select 1 from public.clotures_caisse c
                  where c.ecole_id = old.ecole_id
                    and c.caissier_id = old.encaisse_par
                    and c.date_cloture = v_jour) then
        raise exception 'Caisse cloturee le % pour ce poste : ce paiement ne peut plus etre modifie', v_jour
          using errcode = 'ES001';
      end if;
    end if;
  end if;

  if new.encaisse_par is not null then
    v_jour := public.jour_caisse(new.created_at);
    perform pg_advisory_xact_lock(public.verrou_caisse(new.encaisse_par, v_jour));
    if exists (select 1 from public.clotures_caisse c
                where c.ecole_id = new.ecole_id
                  and c.caissier_id = new.encaisse_par
                  and c.date_cloture = v_jour) then
      raise exception 'Caisse cloturee le % pour ce poste : aucun nouvel encaissement possible sur cette journee', v_jour
        using errcode = 'ES001',
              hint = 'Les encaissements reprendront le jour suivant.';
    end if;
  end if;

  return new;
end;
$$;

create trigger paiements_verrou_cloture
  before insert or update on public.paiements
  for each row execute function public.paiements_verrou_cloture();

revoke execute on function public.clotures_caisse_calcul()   from public, anon, authenticated;
revoke execute on function public.paiements_verrou_cloture() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. RLS et privilèges
-- ---------------------------------------------------------------------

alter table public.clotures_caisse enable row level security;
revoke all on table public.clotures_caisse from anon;

-- Lecture, et création limitée aux trois colonnes qui désignent la
-- clôture. Ni UPDATE ni DELETE : une clôture est définitive côté client.
revoke all on table public.clotures_caisse from authenticated;
grant select on table public.clotures_caisse to authenticated;
grant insert (ecole_id, caissier_id, date_cloture)
  on table public.clotures_caisse to authenticated;

create policy clotures_select_super_admin on public.clotures_caisse
  for select to authenticated
  using (public.est_super_admin());

-- Vue 360° du directeur : toutes les clôtures de son école.
create policy clotures_select_directeur on public.clotures_caisse
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

-- Le caissier ne voit que ses propres clôtures, pas celles de ses
-- collègues.
create policy clotures_select_caissier on public.clotures_caisse
  for select to authenticated
  using ((select public.mon_role()) = 'caissier'
         and ecole_id = (select public.mon_ecole_id())
         and caissier_id = (select auth.uid()));

-- Le caissier clôture sa propre caisse, dans son école, pour aujourd'hui
-- ou une journée passée oubliée. Clôturer une journée future bloquerait
-- ses encaissements de ce jour-là par avance : refusé.
create policy clotures_insert_caissier on public.clotures_caisse
  for insert to authenticated
  with check ((select public.mon_role()) = 'caissier'
              and ecole_id = (select public.mon_ecole_id())
              and caissier_id = (select auth.uid())
              and date_cloture <= public.jour_caisse(now()));
