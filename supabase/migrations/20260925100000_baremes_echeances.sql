-- =====================================================================
-- Migration 20260925100000_baremes_echeances.sql
-- Grilles tarifaires et barèmes d'échéances par classe pour les écoles
-- =====================================================================

create table if not exists public.baremes_echeances (
  id                    uuid primary key default gen_random_uuid(),
  ecole_id              uuid not null references public.ecoles (id) on delete cascade,
  libelle               text not null,
  classe                text not null,
  montant_total         numeric(12,2) not null check (montant_total > 0),
  frequence             text not null default 'mensuel' check (frequence in ('mensuel', 'trimestriel', 'annuel')),
  nombre_tranches       integer not null default 3 check (nombre_tranches between 1 and 12),
  montant_par_tranche   numeric(12,2) not null check (montant_par_tranche > 0),
  date_limite_prochaine date not null,
  annee_scolaire        text not null default '2025-2026',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint baremes_echeances_ecole_classe_unique unique (ecole_id, classe, libelle)
);

create index if not exists baremes_echeances_ecole_idx on public.baremes_echeances (ecole_id);
create index if not exists baremes_echeances_classe_idx on public.baremes_echeances (ecole_id, classe);

create trigger baremes_echeances_set_updated_at
  before update on public.baremes_echeances
  for each row execute function public.set_updated_at();

-- RLS
alter table public.baremes_echeances enable row level security;

-- Lecture : directeur de l'école, caissier, ou super_admin
create policy baremes_select_directeur on public.baremes_echeances
  for select to authenticated
  using (
    ecole_id = (select public.mon_ecole_id())
    or (select public.mon_role()) = 'super_admin'
  );

-- Insertion : directeur uniquement pour son école
create policy baremes_insert_directeur on public.baremes_echeances
  for insert to authenticated
  with check (
    (select public.mon_role()) = 'directeur'
    and ecole_id = (select public.mon_ecole_id())
  );

-- Mise à jour : directeur uniquement
create policy baremes_update_directeur on public.baremes_echeances
  for update to authenticated
  using (
    (select public.mon_role()) = 'directeur'
    and ecole_id = (select public.mon_ecole_id())
  )
  with check (
    (select public.mon_role()) = 'directeur'
    and ecole_id = (select public.mon_ecole_id())
  );

-- Suppression : directeur uniquement
create policy baremes_delete_directeur on public.baremes_echeances
  for delete to authenticated
  using (
    (select public.mon_role()) = 'directeur'
    and ecole_id = (select public.mon_ecole_id())
  );

grant select, insert, update, delete on table public.baremes_echeances to authenticated;
