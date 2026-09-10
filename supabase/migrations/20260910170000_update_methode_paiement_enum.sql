-- =============================================================================
-- Migration : Mise à jour de l'enum methode_paiement
-- EcoSurv - Restriction aux 4 modes officiels :
--   - 'especes' : Espèces (Comptant)
--   - 'bankily' : Bankily (BPM)
--   - 'masrvi'  : Masrvi (BMCI)
--   - 'cheque'  : Chèque
-- Retrait des valeurs 'sedad' et 'virement'.
-- =============================================================================

-- 1. Sécurisation des données existantes éventuelles : migration des anciennes méthodes
update public.paiements
set methode = 'masrvi'::public.methode_paiement
where methode::text = 'sedad';

update public.paiements
set methode = 'cheque'::public.methode_paiement
where methode::text = 'virement';

-- 2. Détachement temporaire du type enum sur la colonne methode
alter table public.paiements alter column methode type text using methode::text;

-- 3. Suppression de l'ancien type enum
drop type public.methode_paiement;

-- 4. Création du nouveau type enum épuré
create type public.methode_paiement as enum (
  'especes',
  'bankily',
  'masrvi',
  'cheque'
);

-- 5. Réapplication du type enum sur la table paiements
alter table public.paiements
  alter column methode type public.methode_paiement
  using methode::public.methode_paiement;
