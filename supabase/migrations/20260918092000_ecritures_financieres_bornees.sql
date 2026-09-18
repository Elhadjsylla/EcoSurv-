-- =====================================================================
-- EcoSurv — Écritures financières bornées côté client
--
-- Le lot MVP a retiré l'UPDATE des colonnes financières au rôle
-- authenticated, mais l'INSERT est resté accordé au niveau table. Trois
-- conséquences, toutes contraires à BACKEND_AGENT.md §10 et à
-- SECURITY_RULES.md §6, et toutes exploitables dès que les écrans
-- écrivent réellement en base :
--
--  1. echeances.montant_paye était fixable à l'INSERT : un directeur
--     pouvait créer une échéance déjà « payée » sans aucun paiement.
--  2. paiements.statut/methode n'étaient pas bornés à l'INSERT : un
--     caissier pouvait enregistrer un paiement Bankily/Masrvi/chèque
--     directement 'confirme', sans confirmation serveur.
--  3. paiements.created_at et paye_le venaient du client : la date d'un
--     encaissement était déclarative, ce qui rendait toute clôture de
--     caisse contournable par antidatage.
--
-- Le frontend (src/data/paiements.ts, src/data/echeances.ts) respecte
-- déjà ces règles : cette migration les rend opposables à un client qui
-- ne les respecterait pas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Grants d'INSERT par colonne
--
-- Même motif que pour l'UPDATE (BACKEND_AGENT.md §6) : un privilège de
-- colonne ne peut pas entamer un privilège de table, donc REVOKE au
-- niveau table puis GRANT colonne par colonne. id, created_at,
-- updated_at prennent leur valeur par défaut, calculée par le serveur.
-- ---------------------------------------------------------------------

-- echeances : montant_paye et statut appartiennent aux triggers, dès
-- la création.
revoke insert on table public.echeances from authenticated;
grant insert (ecole_id, eleve_id, libelle, montant, date_echeance, annee_scolaire)
  on table public.echeances to authenticated;

-- paiements : created_at devient l'horodatage serveur de l'enregistrement,
-- base de la clôture de caisse. paye_le reste accepté (le frontend
-- l'envoie) mais est réécrit par le trigger ci-dessous.
revoke insert on table public.paiements from authenticated;
grant insert (ecole_id, echeance_id, montant, methode, statut,
              reference_transaction, encaisse_par, note, paye_le)
  on table public.paiements to authenticated;

-- ---------------------------------------------------------------------
-- 2. Horodatage serveur de paye_le pour les saisies client
--
-- Pour une saisie faite depuis l'application (rôle authenticated), le
-- moment du paiement est celui de l'enregistrement s'il est confirmé
-- (espèces remises en main propre), inconnu sinon : il sera fixé par le
-- serveur au moment de la confirmation. Le service_role (webhook,
-- reprise d'historique) garde la maîtrise de paye_le.
--
-- SECURITY INVOKER volontairement : current_user doit être le rôle de
-- l'appelant, pas le propriétaire de la fonction.
-- ---------------------------------------------------------------------

create or replace function public.paiements_horodatage_serveur()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user = 'authenticated' then
    new.paye_le := case when new.statut = 'confirme' then now() end;
  end if;
  return new;
end;
$$;

create trigger paiements_horodatage_serveur
  before insert on public.paiements
  for each row execute function public.paiements_horodatage_serveur();

-- ---------------------------------------------------------------------
-- 3. Statut et méthode d'un encaissement au guichet
--
-- BACKEND_AGENT.md §6 : « le caissier peut insérer un paiement confirme
-- (encaissement en espèces au guichet : il a l'argent en main) ». Seules
-- les espèces sont donc confirmées à la saisie ; tout autre moyen reste
-- 'en_attente' jusqu'à la confirmation serveur. Les statuts 'echoue',
-- 'annule' et 'rembourse' ne se créent jamais depuis le guichet.
-- Le super_admin n'est pas concerné (paiements_insert_super_admin).
-- ---------------------------------------------------------------------

alter policy paiements_insert_directeur on public.paiements
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id())
              and encaisse_par = (select auth.uid())
              and (statut = 'en_attente'
                   or (statut = 'confirme' and methode = 'especes')));

alter policy paiements_insert_caissier on public.paiements
  with check ((select public.mon_role()) = 'caissier'
              and ecole_id = (select public.mon_ecole_id())
              and encaisse_par = (select auth.uid())
              and (statut = 'en_attente'
                   or (statut = 'confirme' and methode = 'especes')));
