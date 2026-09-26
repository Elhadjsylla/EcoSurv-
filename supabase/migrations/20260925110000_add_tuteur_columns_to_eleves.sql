-- =====================================================================
-- Migration 20260925110000_add_tuteur_columns_to_eleves.sql
-- Ajout des colonnes coordonnées du tuteur sur la table public.eleves
-- =====================================================================

alter table public.eleves
  add column if not exists nom_tuteur text,
  add column if not exists telephone_tuteur text,
  add column if not exists email_tuteur text,
  add column if not exists adresse_tuteur text,
  add column if not exists lien_parente text default 'pere';

comment on column public.eleves.nom_tuteur is 'Nom complet du tuteur légal déclaré à l inscription';
comment on column public.eleves.telephone_tuteur is 'Numéro de téléphone du tuteur (appels et alertes SMS)';
comment on column public.eleves.email_tuteur is 'Adresse email du tuteur utilisée pour le compte Espace Famille';
comment on column public.eleves.adresse_tuteur is 'Adresse physique du tuteur légal';
