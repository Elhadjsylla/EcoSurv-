-- Reproduction minimale de l'environnement Supabase pour valider les
-- migrations dans un Postgres nu. Fichier de test, jamais deploye.

create role anon          nologin noinherit;
create role authenticated nologin noinherit;
create role service_role  nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

create schema if not exists auth;

-- Sous-ensemble des colonnes de auth.users utilisées par le schéma :
-- raw_user_meta_data (données d'inscription, trigger
-- inscrire_ecole_depuis_compte) et email_confirmed_at (ecoles_en_attente).
create table auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  raw_user_meta_data  jsonb,
  email_confirmed_at  timestamptz
);

-- auth.uid() / auth.jwt() : versions de test renvoyant le claim du JWT
-- simule via le parametre de session request.jwt.claims.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.role', true), '');
$$;
