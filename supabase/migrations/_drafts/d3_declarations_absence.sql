begin;

do $$
declare v_manquants text;
begin
  select string_agg(r, ', ') into v_manquants
  from unnest(array['directeur','enseignant']) as r
  where r not in (select unnest(enum_range(null::public.role_utilisateur))::text);
  if v_manquants is not null then
    raise exception 'Rôles introuvables dans role_utilisateur : %', v_manquants;
  end if;
end $$;

create table public.declarations_absence (
  id          uuid primary key default gen_random_uuid(),
  ecole_id    uuid not null references public.ecoles(id) on delete cascade,
  eleve_id    uuid not null references public.eleves(id) on delete cascade,
  declare_par uuid references public.profils(id) on delete set null default auth.uid(),
  date_debut  date not null,
  date_fin    date not null,
  motif       text not null check (motif in ('malade','famille','transport','autre')),
  commentaire text check (commentaire is null or char_length(commentaire) <= 500),
  statut      text not null default 'en_attente'
              check (statut in ('en_attente','acceptee','refusee')),
  traite_par  uuid references public.profils(id) on delete set null,
  traite_le   timestamptz,
  reponse     text check (reponse is null or char_length(reponse) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint decl_abs_dates check (date_fin >= date_debut and date_fin - date_debut <= 13),
  constraint decl_abs_traitement check (
    (statut = 'en_attente' and traite_le is null and traite_par is null)
    or (statut <> 'en_attente' and traite_le is not null)
  )
);

create index decl_abs_ecole_statut_idx on public.declarations_absence (ecole_id, statut, created_at desc);
create index decl_abs_eleve_dates_idx  on public.declarations_absence (eleve_id, date_debut);

create or replace function public.declarations_absence_avant_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ecole uuid;
begin
  select e.ecole_id into v_ecole from public.eleves e where e.id = new.eleve_id;
  if v_ecole is null then
    raise exception 'Élève introuvable.';
  end if;
  new.ecole_id    := v_ecole;
  new.declare_par := auth.uid();
  new.statut      := 'en_attente';
  new.traite_par  := null;
  new.traite_le   := null;
  new.reponse     := null;
  new.created_at  := now();
  new.updated_at  := now();

  if new.date_debut < current_date - 30 then
    raise exception 'La date de début est trop ancienne (30 jours au maximum).';
  end if;
  if new.date_fin > current_date + 14 then
    raise exception 'La date de fin est trop éloignée (14 jours au maximum).';
  end if;
  if (select count(*) from public.declarations_absence
        where eleve_id = new.eleve_id and statut = 'en_attente') >= 5 then
    raise exception 'Trop de déclarations en attente pour cet élève.';
  end if;
  if (select count(*) from public.declarations_absence
        where declare_par = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Limite de 10 déclarations par 24 heures atteinte.';
  end if;
  return new;
end $$;

create trigger declarations_absence_avant_insert
before insert on public.declarations_absence
for each row execute function public.declarations_absence_avant_insert();

create or replace function public.declarations_absence_avant_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.statut <> 'en_attente' then
    raise exception 'Cette déclaration a déjà été traitée.';
  end if;
  if new.statut not in ('acceptee','refusee') then
    raise exception 'Statut invalide.';
  end if;
  if (new.id, new.ecole_id, new.eleve_id, new.declare_par, new.date_debut,
      new.date_fin, new.motif, new.commentaire, new.created_at)
     is distinct from
     (old.id, old.ecole_id, old.eleve_id, old.declare_par, old.date_debut,
      old.date_fin, old.motif, old.commentaire, old.created_at) then
    raise exception 'Seul le statut et la réponse peuvent être modifiés.';
  end if;
  new.traite_par := auth.uid();
  new.traite_le  := now();
  new.updated_at := now();
  return new;
end $$;

create trigger declarations_absence_avant_update
before update on public.declarations_absence
for each row execute function public.declarations_absence_avant_update();

alter table public.declarations_absence enable row level security;

revoke all on public.declarations_absence from anon, public;
grant select, insert, update, delete on public.declarations_absence to authenticated;

create policy decl_abs_select on public.declarations_absence
for select to authenticated
using (
  public.est_super_admin()
  or (
    public.mon_profil_actif()
    and ecole_id = public.mon_ecole_id()
    and (
      public.mon_role()::text = 'directeur'
      or (public.mon_role()::text = 'enseignant' and public.enseigne_eleve(eleve_id))
      or public.est_tuteur_de(eleve_id)
    )
  )
);

create policy decl_abs_insert on public.declarations_absence
for insert to authenticated
with check (
  public.mon_profil_actif()
  and public.est_tuteur_de(eleve_id)
  and declare_par = auth.uid()
);

create policy decl_abs_update on public.declarations_absence
for update to authenticated
using (
  public.mon_profil_actif()
  and ecole_id = public.mon_ecole_id()
  and statut = 'en_attente'
  and (
    public.mon_role()::text = 'directeur'
    or (public.mon_role()::text = 'enseignant' and public.enseigne_eleve(eleve_id))
  )
)
with check (
  public.mon_profil_actif()
  and ecole_id = public.mon_ecole_id()
);

create policy decl_abs_delete on public.declarations_absence
for delete to authenticated
using (declare_par = auth.uid() and statut = 'en_attente');

commit;
