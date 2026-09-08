-- =====================================================================
-- EcoSurv — Schéma MVP (étape A)
-- Cahier des charges §8 (MVP) : dossier élève, échéances et suivi des
-- paiements, portail parent (paiements + absences), dashboard directeur.
--
-- Invariant SECURITY_RULES.md §2 : toute table de données propres à une
-- école porte une colonne ecole_id. La RLS est ACTIVÉE ici sans aucune
-- policy, ce qui bloque tout accès par défaut (deny-all) ; les policies
-- arrivent à l'étape B. Aucune table n'est donc jamais exposée nue.
-- Montants en Ouguiya (MRU) : numeric(12,2).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------

-- Cycle de vie de l'abonnement d'une école (console super admin, §5.9)
create type public.statut_abonnement as enum (
  'essai',
  'actif',
  'suspendu',
  'expire',
  'annule'
);

-- Rôles de la plateforme (§4 du cahier des charges, SECURITY_RULES.md §2)
create type public.role_utilisateur as enum (
  'super_admin',
  'directeur',
  'enseignant',
  'parent',
  'caissier'
);

-- Statut de paiement d'une échéance (§5.3)
--   a_jour    : pas encore échue, rien payé
--   partiel   : partiellement payée, pas encore échue
--   en_retard : échue et non soldée
--   paye      : soldée
create type public.statut_echeance as enum (
  'a_jour',
  'en_retard',
  'partiel',
  'paye'
);

-- Statut d'une transaction de paiement.
-- Un paiement ne solde une échéance QUE lorsqu'il est 'confirme', et cette
-- confirmation vient du webhook du prestataire (SECURITY_RULES.md §6).
create type public.statut_paiement as enum (
  'en_attente',
  'confirme',
  'echoue',
  'rembourse',
  'annule'
);

-- Moyens de paiement : espèces au guichet (caissier) + mobile money
-- mauritanien. Les opérateurs exacts restent une hypothèse à valider (§5.3).
create type public.methode_paiement as enum (
  'especes',
  'bankily',
  'masrvi',
  'sedad',
  'virement',
  'cheque'
);

-- Nature du lien entre un tuteur et un élève
create type public.lien_parente as enum (
  'pere',
  'mere',
  'tuteur',
  'autre'
);

-- Absence vs retard (§5.4 : « saisie des absences/retards »)
create type public.type_absence as enum (
  'absence',
  'retard'
);

-- ---------------------------------------------------------------------
-- 2. UTILITAIRE : horodatage updated_at
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. ecoles — le tenant, racine de l'isolation multi-tenant
-- ---------------------------------------------------------------------

create table public.ecoles (
  id                 uuid primary key default gen_random_uuid(),
  nom                text not null,
  ville              text,
  adresse            text,
  telephone          text,
  email              text,
  statut_abonnement  public.statut_abonnement not null default 'essai',
  abonnement_debut   date,
  abonnement_fin     date,
  annee_scolaire     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint ecoles_nom_non_vide check (length(btrim(nom)) > 0),
  constraint ecoles_abonnement_coherent
    check (abonnement_fin is null
           or abonnement_debut is null
           or abonnement_fin >= abonnement_debut)
);

create index ecoles_statut_abonnement_idx
  on public.ecoles (statut_abonnement);

create trigger ecoles_set_updated_at
  before update on public.ecoles
  for each row execute function public.set_updated_at();

comment on table public.ecoles is
  'Tenant EcoSurv. Une ligne = un etablissement client.';

-- ---------------------------------------------------------------------
-- 4. profils — extension de auth.users, porte le rôle et le tenant
-- ---------------------------------------------------------------------

create table public.profils (
  id          uuid primary key references auth.users (id) on delete cascade,
  ecole_id    uuid references public.ecoles (id) on delete restrict,
  role        public.role_utilisateur not null,
  nom         text not null,
  prenom      text,
  telephone   text,
  email       text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Un super_admin est hors école (il voit tout) ; tout autre rôle est
  -- obligatoirement rattaché à une école. Sans cette contrainte, un compte
  -- sans ecole_id échapperait au filtrage RLS.
  constraint profils_ecole_selon_role check (
    (role = 'super_admin' and ecole_id is null)
    or (role <> 'super_admin' and ecole_id is not null)
  )
);

create index profils_ecole_id_idx on public.profils (ecole_id);
create index profils_role_idx     on public.profils (role);

create trigger profils_set_updated_at
  before update on public.profils
  for each row execute function public.set_updated_at();

comment on table public.profils is
  'Profil applicatif lie 1-1 a auth.users. Source de verite du role et de l ecole_id utilises par toutes les policies RLS.';
comment on column public.profils.ecole_id is
  'NULL uniquement pour super_admin. Pour un parent : ecole de rattachement principale — son perimetre reel de lecture vient de parents_eleves.';

-- ---------------------------------------------------------------------
-- 5. eleves — dossier élève (§5.2)
-- ---------------------------------------------------------------------

create table public.eleves (
  id              uuid primary key default gen_random_uuid(),
  ecole_id        uuid not null references public.ecoles (id) on delete cascade,
  matricule       text,
  nom             text not null,
  prenom          text not null,
  classe          text,
  date_naissance  date,
  lieu_naissance  text,
  sexe            char(1),
  annee_scolaire  text,
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint eleves_sexe_valide check (sexe is null or sexe in ('M', 'F')),
  -- Borne basse volontairement fixe : un CHECK ne peut pas appeler
  -- current_date (fonction non IMMUTABLE). Le contrôle « date non future »
  -- se fait côté application.
  constraint eleves_naissance_plausible
    check (date_naissance is null or date_naissance > date '1950-01-01'),
  -- Un matricule est unique au sein d'une école, pas globalement.
  constraint eleves_matricule_unique_par_ecole unique (ecole_id, matricule),
  -- Cible des clés étrangères composites plus bas : rend structurellement
  -- impossible qu'une échéance/absence pointe un élève d'une autre école.
  constraint eleves_id_ecole_unique unique (ecole_id, id)
);

create index eleves_ecole_id_idx     on public.eleves (ecole_id);
create index eleves_ecole_classe_idx on public.eleves (ecole_id, classe);
create index eleves_nom_idx          on public.eleves (ecole_id, nom, prenom);

create trigger eleves_set_updated_at
  before update on public.eleves
  for each row execute function public.set_updated_at();

comment on table public.eleves is
  'Dossier eleve. Donnees sensibles de mineurs — voir SECURITY_RULES.md section 5 : jamais de donnees reelles hors production.';

-- ---------------------------------------------------------------------
-- 6. parents_eleves — liaison many-to-many tuteurs <-> élèves (§5.1)
-- ---------------------------------------------------------------------

create table public.parents_eleves (
  id          uuid primary key default gen_random_uuid(),
  ecole_id    uuid not null,
  parent_id   uuid not null references public.profils (id) on delete cascade,
  eleve_id    uuid not null,
  lien        public.lien_parente not null default 'tuteur',
  -- Tuteur destinataire prioritaire des rappels SMS/WhatsApp.
  principal   boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint parents_eleves_unique unique (parent_id, eleve_id),
  -- FK composite : l'ecole_id de la liaison est forcément celle de l'élève.
  constraint parents_eleves_eleve_fk
    foreign key (ecole_id, eleve_id)
    references public.eleves (ecole_id, id) on delete cascade
);

create index parents_eleves_parent_id_idx on public.parents_eleves (parent_id);
create index parents_eleves_eleve_id_idx  on public.parents_eleves (eleve_id);
create index parents_eleves_ecole_id_idx  on public.parents_eleves (ecole_id);

comment on table public.parents_eleves is
  'Un parent peut avoir plusieurs enfants, un eleve plusieurs tuteurs. Table pivot dont dependent toutes les policies RLS du role parent.';
comment on column public.parents_eleves.ecole_id is
  'Ecole de l eleve (imposee par la FK composite). Permet a un parent d avoir des enfants dans plusieurs ecoles, comme prevu au 5.1.';

-- ---------------------------------------------------------------------
-- 7. echeances — échéancier de scolarité (§5.3)
-- ---------------------------------------------------------------------

create table public.echeances (
  id              uuid primary key default gen_random_uuid(),
  ecole_id        uuid not null,
  eleve_id        uuid not null,
  libelle         text not null,
  montant         numeric(12,2) not null,
  -- Dénormalisation maintenue par trigger (somme des paiements 'confirme').
  montant_paye    numeric(12,2) not null default 0,
  date_echeance   date not null,
  statut          public.statut_echeance not null default 'a_jour',
  annee_scolaire  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint echeances_montant_positif check (montant > 0),
  constraint echeances_montant_paye_positif check (montant_paye >= 0),
  constraint echeances_eleve_fk
    foreign key (ecole_id, eleve_id)
    references public.eleves (ecole_id, id) on delete cascade,
  constraint echeances_id_ecole_unique unique (ecole_id, id)
);

create index echeances_ecole_id_idx     on public.echeances (ecole_id);
create index echeances_eleve_id_idx     on public.echeances (eleve_id);
create index echeances_ecole_date_idx   on public.echeances (ecole_id, date_echeance);
-- Sert la liste « élèves en retard de paiement » du dashboard directeur (§5.7).
create index echeances_ecole_statut_idx on public.echeances (ecole_id, statut);

create trigger echeances_set_updated_at
  before update on public.echeances
  for each row execute function public.set_updated_at();

comment on table public.echeances is
  'Une ligne = une somme due par un eleve a une date. montant_paye et statut sont recalcules automatiquement depuis les paiements confirmes.';

-- ---------------------------------------------------------------------
-- 8. paiements — transactions (§5.3)
-- ---------------------------------------------------------------------

create table public.paiements (
  id                     uuid primary key default gen_random_uuid(),
  ecole_id               uuid not null,
  echeance_id            uuid not null,
  montant                numeric(12,2) not null,
  methode                public.methode_paiement not null,
  statut                 public.statut_paiement not null default 'en_attente',
  -- Référence de la transaction chez l'opérateur mobile money : garantit
  -- l'idempotence du webhook de confirmation.
  reference_transaction  text,
  -- Caissier ou directeur ayant encaissé (paiement au guichet).
  encaisse_par           uuid references public.profils (id) on delete set null,
  note                   text,
  paye_le                timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint paiements_montant_positif check (montant > 0),
  constraint paiements_echeance_fk
    foreign key (ecole_id, echeance_id)
    references public.echeances (ecole_id, id) on delete cascade,
  -- Empêche le double comptage d'un même callback opérateur.
  constraint paiements_reference_unique_par_ecole
    unique (ecole_id, reference_transaction)
);

create index paiements_ecole_id_idx     on public.paiements (ecole_id);
create index paiements_echeance_id_idx  on public.paiements (echeance_id);
create index paiements_ecole_statut_idx on public.paiements (ecole_id, statut);
create index paiements_recents_idx      on public.paiements (ecole_id, created_at desc);

create trigger paiements_set_updated_at
  before update on public.paiements
  for each row execute function public.set_updated_at();

comment on table public.paiements is
  'Transactions. Seul le statut confirme solde une echeance, et cette confirmation doit venir du serveur (webhook), jamais d un clic client — SECURITY_RULES.md section 6.';

-- ---------------------------------------------------------------------
-- 9. absences (§5.4)
-- ---------------------------------------------------------------------

create table public.absences (
  id            uuid primary key default gen_random_uuid(),
  ecole_id      uuid not null,
  eleve_id      uuid not null,
  date_absence  date not null,
  type          public.type_absence not null default 'absence',
  justifiee     boolean not null default false,
  motif         text,
  saisie_par    uuid references public.profils (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint absences_unique_par_jour unique (eleve_id, date_absence, type),
  constraint absences_eleve_fk
    foreign key (ecole_id, eleve_id)
    references public.eleves (ecole_id, id) on delete cascade
);

create index absences_ecole_id_idx   on public.absences (ecole_id);
create index absences_eleve_id_idx   on public.absences (eleve_id);
create index absences_ecole_date_idx on public.absences (ecole_id, date_absence desc);

create trigger absences_set_updated_at
  before update on public.absences
  for each row execute function public.set_updated_at();

comment on table public.absences is
  'Absences et retards. Donnee sensible de mineur — consultable par le parent lie via parents_eleves uniquement.';

-- ---------------------------------------------------------------------
-- 10. Cohérence financière : montant_paye et statut des échéances
-- ---------------------------------------------------------------------

create or replace function public.calculer_statut_echeance(
  p_montant       numeric,
  p_montant_paye  numeric,
  p_date_echeance date
)
returns public.statut_echeance
language sql
stable
as $$
  select case
    when p_montant_paye >= p_montant    then 'paye'::public.statut_echeance
    when p_date_echeance < current_date then 'en_retard'::public.statut_echeance
    when p_montant_paye > 0             then 'partiel'::public.statut_echeance
    else                                     'a_jour'::public.statut_echeance
  end;
$$;

comment on function public.calculer_statut_echeance is
  'Statut derive d une echeance. en_retard prime sur partiel : une echeance passee et non soldee doit remonter dans les relances du directeur.';

-- Recalcule l'échéance impactée après tout mouvement de paiement.
create or replace function public.recalculer_echeance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_echeance_id uuid := coalesce(new.echeance_id, old.echeance_id);
begin
  update public.echeances e
     set montant_paye = coalesce((
           select sum(p.montant)
             from public.paiements p
            where p.echeance_id = e.id
              and p.statut = 'confirme'
         ), 0)
   where e.id = v_echeance_id;

  return null;
end;
$$;

create trigger paiements_recalcul_echeance
  after insert or update or delete on public.paiements
  for each row execute function public.recalculer_echeance();

-- Positionne le statut à la création et à chaque modification du montant,
-- du montant payé ou de la date d'échéance.
create or replace function public.echeance_statut_auto()
returns trigger
language plpgsql
as $$
begin
  new.statut := public.calculer_statut_echeance(
    new.montant, new.montant_paye, new.date_echeance);
  return new;
end;
$$;

create trigger echeances_statut_auto
  before insert or update of montant, montant_paye, date_echeance
  on public.echeances
  for each row execute function public.echeance_statut_auto();

-- Le passage « a_jour »/« partiel » -> « en_retard » dépend de la date du
-- jour : à appeler une fois par jour (pg_cron ou Edge Function planifiée).
create or replace function public.rafraichir_statuts_echeances()
returns integer
language sql
as $$
  with maj as (
    update public.echeances e
       set statut = public.calculer_statut_echeance(
             e.montant, e.montant_paye, e.date_echeance)
     where e.statut <> public.calculer_statut_echeance(
             e.montant, e.montant_paye, e.date_echeance)
    returning 1
  )
  select count(*)::integer from maj;
$$;

comment on function public.rafraichir_statuts_echeances is
  'A planifier quotidiennement : fait basculer en en_retard les echeances arrivees a terme et non soldees.';

-- ---------------------------------------------------------------------
-- 11. RLS : activation deny-all (SECURITY_RULES.md §8, invariant 1)
-- Aucune policy à ce stade -> aucune ligne lisible ni modifiable par les
-- rôles anon et authenticated. Les policies par rôle arrivent à l'étape B.
-- ---------------------------------------------------------------------

alter table public.ecoles         enable row level security;
alter table public.profils        enable row level security;
alter table public.eleves         enable row level security;
alter table public.parents_eleves enable row level security;
alter table public.echeances      enable row level security;
alter table public.paiements      enable row level security;
alter table public.absences       enable row level security;

-- Défense en profondeur : aucune de ces tables ne concerne un visiteur non
-- authentifié. On retire le privilège au rôle anon, en plus de la RLS.
revoke all on table public.ecoles         from anon;
revoke all on table public.profils        from anon;
revoke all on table public.eleves         from anon;
revoke all on table public.parents_eleves from anon;
revoke all on table public.echeances      from anon;
revoke all on table public.paiements      from anon;
revoke all on table public.absences       from anon;
