-- =====================================================================
-- EcoSurv — Row Level Security (étape B)
--
-- Traduit littéralement le tableau des rôles de SECURITY_RULES.md §2 :
--   super_admin : toutes les écoles
--   directeur   : uniquement les données de son école
--   enseignant  : uniquement les classes qui lui sont assignées, dans son école
--   parent      : uniquement les données de son/ses enfant(s)
--   caissier    : uniquement les paiements de son école
--
-- Principes appliqués :
--  1. Aucune table sans policy, et une policy par (table, action, rôle) —
--     nommée, donc auditable ligne par ligne.
--  2. Toutes les policies ciblent explicitement le rôle `authenticated`.
--     Le rôle `anon` n'a aucun privilège (révoqué en étape A).
--  3. Le rôle et l'ecole_id de l'appelant sont lus via des fonctions
--     SECURITY DEFINER : sans cela, une policy sur `profils` qui interroge
--     `profils` provoquerait une récursion infinie.
--  4. Les colonnes qui portent la vérité financière (echeances.montant_paye,
--     echeances.statut, paiements.statut) sont retirées au rôle
--     authenticated : seul le webhook côté serveur (service_role) peut
--     confirmer un paiement — SECURITY_RULES.md §6.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Prérequis : affectation des enseignants aux classes
--
-- SECURITY_RULES.md §2 restreint l'enseignant aux « classes qui lui sont
-- assignées ». Le schéma MVP n'a pas d'emploi du temps (V2), donc rien ne
-- permettait d'exprimer cette restriction. Cette table est le minimum
-- nécessaire pour ne pas élargir la policy à toute l'école.
-- ---------------------------------------------------------------------

-- Cible de la FK composite ci-dessous : un enseignant ne peut être affecté
-- qu'à une classe de sa propre école.
alter table public.profils
  add constraint profils_id_ecole_unique unique (ecole_id, id);

create table public.affectations_enseignants (
  id              uuid primary key default gen_random_uuid(),
  ecole_id        uuid not null,
  enseignant_id   uuid not null,
  classe          text not null,
  annee_scolaire  text,
  created_at      timestamptz not null default now(),

  constraint affectations_classe_non_vide check (length(btrim(classe)) > 0),
  constraint affectations_unique
    unique (enseignant_id, classe, annee_scolaire),
  constraint affectations_enseignant_fk
    foreign key (ecole_id, enseignant_id)
    references public.profils (ecole_id, id) on delete cascade
);

create index affectations_ecole_id_idx
  on public.affectations_enseignants (ecole_id);
create index affectations_enseignant_idx
  on public.affectations_enseignants (enseignant_id);
create index affectations_ecole_classe_idx
  on public.affectations_enseignants (ecole_id, classe);

alter table public.affectations_enseignants enable row level security;
revoke all on table public.affectations_enseignants from anon;

comment on table public.affectations_enseignants is
  'Classes assignees a un enseignant. Support de la restriction « ses classes uniquement » de SECURITY_RULES.md section 2.';

-- ---------------------------------------------------------------------
-- 1. Fonctions de contexte (SECURITY DEFINER)
--
-- Elles lisent public.profils en contournant la RLS (propriétaire de la
-- table), ce qui évite toute récursion de policy. Un profil inactif
-- renvoie NULL : aucune policy ne peut alors matcher, donc un compte
-- désactivé perd tout accès sans qu'on ait à le traiter policy par policy.
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
   where p.id = auth.uid()
     and p.actif;
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
   where p.id = auth.uid()
     and p.actif;
$$;

create or replace function public.est_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.profils p
     where p.id = auth.uid()
       and p.actif
       and p.role = 'super_admin'
  );
$$;

-- Le parent est-il tuteur déclaré de cet élève ? (table pivot parents_eleves)
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
     where pe.parent_id = auth.uid()
       and pe.eleve_id = p_eleve_id
  );
$$;

-- Même question, à partir d'une échéance (utilisé par les policies paiements).
create or replace function public.est_tuteur_de_echeance(p_echeance_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.echeances e
      join public.parents_eleves pe on pe.eleve_id = e.eleve_id
     where e.id = p_echeance_id
       and pe.parent_id = auth.uid()
  );
$$;

-- L'enseignant est-il affecté à cette classe, dans cette école ?
create or replace function public.enseigne_classe(p_ecole_id uuid, p_classe text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.affectations_enseignants a
     where a.enseignant_id = auth.uid()
       and a.ecole_id = p_ecole_id
       and a.classe = p_classe
  );
$$;

-- L'enseignant est-il affecté à la classe de cet élève ?
create or replace function public.enseigne_eleve(p_eleve_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.eleves el
      join public.affectations_enseignants a
        on a.ecole_id = el.ecole_id
       and a.classe = el.classe
     where el.id = p_eleve_id
       and a.enseignant_id = auth.uid()
  );
$$;

-- Ces fonctions ne doivent jamais être appelables sans session.
revoke execute on function public.mon_role()                       from public, anon;
revoke execute on function public.mon_ecole_id()                   from public, anon;
revoke execute on function public.est_super_admin()                from public, anon;
revoke execute on function public.est_tuteur_de(uuid)              from public, anon;
revoke execute on function public.est_tuteur_de_echeance(uuid)     from public, anon;
revoke execute on function public.enseigne_classe(uuid, text)      from public, anon;
revoke execute on function public.enseigne_eleve(uuid)             from public, anon;

grant execute on function public.mon_role()                   to authenticated;
grant execute on function public.mon_ecole_id()               to authenticated;
grant execute on function public.est_super_admin()            to authenticated;
grant execute on function public.est_tuteur_de(uuid)          to authenticated;
grant execute on function public.est_tuteur_de_echeance(uuid) to authenticated;
grant execute on function public.enseigne_classe(uuid, text)  to authenticated;
grant execute on function public.enseigne_eleve(uuid)         to authenticated;

-- ---------------------------------------------------------------------
-- 2. Garde-fou anti-escalade de privilèges sur profils
--
-- Une policy RLS ne sait pas restreindre un UPDATE à certaines colonnes.
-- Sans ce trigger, un enseignant autorisé à modifier son propre profil
-- (nom, téléphone) pourrait y écrire role = 'directeur' et changer de
-- périmètre. Le rôle et l'école ne sont donc modifiables que par un
-- super_admin ou par le directeur de l'école concernée.
-- ---------------------------------------------------------------------

create or replace function public.profils_protege_role_ecole()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     or new.ecole_id is distinct from old.ecole_id then

    if public.est_super_admin() then
      return new;
    end if;

    if public.mon_role() = 'directeur'
       and old.ecole_id = public.mon_ecole_id()
       and new.ecole_id = public.mon_ecole_id()
       and new.role <> 'super_admin' then
      return new;
    end if;

    raise exception
      'Modification du role ou de l''ecole interdite : reservee au super_admin ou au directeur de l''ecole concernee'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profils_protege_role_ecole
  before update on public.profils
  for each row execute function public.profils_protege_role_ecole();

-- ---------------------------------------------------------------------
-- 3. Privilèges de colonnes
--
-- La RLS dit QUELLES LIGNES sont accessibles ; les grants de colonnes
-- disent QUELS CHAMPS sont modifiables. Les deux sont nécessaires ici :
-- l'état financier ne doit pas pouvoir être écrit à la main depuis le
-- client, même par un directeur légitime sur sa propre école.
-- ---------------------------------------------------------------------

grant select, insert, update, delete on table public.ecoles         to authenticated;
grant select, insert, update, delete on table public.profils        to authenticated;
grant select, insert, update, delete on table public.eleves         to authenticated;
grant select, insert, update, delete on table public.parents_eleves to authenticated;
grant select, insert, update, delete on table public.echeances      to authenticated;
grant select, insert, update, delete on table public.paiements      to authenticated;
grant select, insert, update, delete on table public.absences       to authenticated;
grant select, insert, update, delete on table public.affectations_enseignants
  to authenticated;

-- echeances : montant_paye et statut sont la propriété des triggers, pas
-- du client. Retirer l'UPDATE au niveau table puis le rendre colonne par
-- colonne (un REVOKE de colonne ne peut pas entamer un grant table-level).
revoke update on table public.echeances from authenticated;
grant update (libelle, montant, date_echeance, annee_scolaire)
  on table public.echeances to authenticated;

-- paiements : le statut ne se modifie jamais depuis le client. Confirmer,
-- annuler ou rembourser un paiement passe par une Edge Function en
-- service_role, déclenchée par le webhook de l'opérateur (SECURITY_RULES §6).
-- Seule l'annotation libre reste modifiable.
revoke update on table public.paiements from authenticated;
grant update (note) on table public.paiements to authenticated;

-- ecoles : le statut d'abonnement est du ressort de la console super admin
-- (§5.9), jamais d'un directeur. Aucune colonne d'abonnement n'est ouverte
-- au rôle authenticated ; la gestion passe par le service_role.
revoke update on table public.ecoles from authenticated;
grant update (nom, ville, adresse, telephone, email, annee_scolaire)
  on table public.ecoles to authenticated;

-- =====================================================================
-- 4. POLICIES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4.1 ecoles
-- Le super_admin gère le parc. Tout membre d'une école lit la fiche de SON
-- école (nom affiché, année scolaire) et rien d'autre : c'est ce qui évite
-- qu'une école puisse ne serait-ce que deviner l'existence d'une autre.
-- ---------------------------------------------------------------------

create policy ecoles_select_super_admin on public.ecoles
  for select to authenticated
  using (public.est_super_admin());

create policy ecoles_select_membre on public.ecoles
  for select to authenticated
  using (id = (select public.mon_ecole_id()));

create policy ecoles_insert_super_admin on public.ecoles
  for insert to authenticated
  with check (public.est_super_admin());

-- Colonnes d'abonnement déjà hors de portée (grants ci-dessus) : le
-- directeur ne peut ici corriger que les coordonnées de son école.
create policy ecoles_update_super_admin on public.ecoles
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy ecoles_update_directeur on public.ecoles
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and id = (select public.mon_ecole_id()))
  with check (id = (select public.mon_ecole_id()));

-- Supprimer une école détruirait en cascade élèves, échéances et paiements.
create policy ecoles_delete_super_admin on public.ecoles
  for delete to authenticated
  using (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 4.2 profils
-- Chacun voit son propre profil. Le directeur voit et gère le personnel et
-- les parents de son école (§5.1 : « le directeur peut inviter son
-- personnel »). Enseignant, parent et caissier ne voient qu'eux-mêmes.
-- ---------------------------------------------------------------------

create policy profils_select_soi_meme on public.profils
  for select to authenticated
  using (id = (select auth.uid()));

create policy profils_select_super_admin on public.profils
  for select to authenticated
  using (public.est_super_admin());

create policy profils_select_directeur on public.profils
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy profils_insert_super_admin on public.profils
  for insert to authenticated
  with check (public.est_super_admin());

-- Le directeur crée des comptes dans SON école et ne peut pas fabriquer un
-- super_admin : ce serait une escalade vers le parc entier.
create policy profils_insert_directeur on public.profils
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id())
              and role <> 'super_admin');

-- Le changement de role/ecole_id reste bloqué par le trigger
-- profils_protege_role_ecole, y compris sur son propre profil.
create policy profils_update_soi_meme on public.profils
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profils_update_super_admin on public.profils
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy profils_update_directeur on public.profils
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id())
              and role <> 'super_admin');

create policy profils_delete_super_admin on public.profils
  for delete to authenticated
  using (public.est_super_admin());

create policy profils_delete_directeur on public.profils
  for delete to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id())
         and role <> 'super_admin'
         and id <> (select auth.uid()));

-- ---------------------------------------------------------------------
-- 4.3 eleves
-- Le caissier a besoin de lire les élèves de son école pour rattacher un
-- encaissement au bon dossier ; il n'a aucun droit d'écriture.
-- L'enseignant est borné à ses classes, le parent à ses enfants.
-- ---------------------------------------------------------------------

create policy eleves_select_super_admin on public.eleves
  for select to authenticated
  using (public.est_super_admin());

create policy eleves_select_directeur on public.eleves
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy eleves_select_caissier on public.eleves
  for select to authenticated
  using ((select public.mon_role()) = 'caissier'
         and ecole_id = (select public.mon_ecole_id()));

create policy eleves_select_enseignant on public.eleves
  for select to authenticated
  using ((select public.mon_role()) = 'enseignant'
         and ecole_id = (select public.mon_ecole_id())
         and public.enseigne_classe(ecole_id, classe));

create policy eleves_select_parent on public.eleves
  for select to authenticated
  using ((select public.mon_role()) = 'parent'
         and public.est_tuteur_de(id));

create policy eleves_insert_super_admin on public.eleves
  for insert to authenticated
  with check (public.est_super_admin());

create policy eleves_insert_directeur on public.eleves
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id()));

create policy eleves_update_super_admin on public.eleves
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

-- WITH CHECK verrouille l'ecole_id d'arrivée : un directeur ne peut pas
-- « pousser » un de ses élèves vers une autre école.
create policy eleves_update_directeur on public.eleves
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id()));

-- Pas de DELETE pour le directeur : la cascade emporterait échéances,
-- paiements et absences, donc la piste financière de l'élève. Une sortie
-- d'élève se traite avec actif = false.
create policy eleves_delete_super_admin on public.eleves
  for delete to authenticated
  using (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 4.4 parents_eleves
-- Table pivot : c'est elle qui définit le périmètre du rôle parent, donc
-- seuls le directeur et le super_admin peuvent y écrire. Un parent qui
-- pourrait s'y ajouter une ligne s'octroierait l'accès à n'importe quel élève.
-- ---------------------------------------------------------------------

create policy parents_eleves_select_super_admin on public.parents_eleves
  for select to authenticated
  using (public.est_super_admin());

create policy parents_eleves_select_directeur on public.parents_eleves
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy parents_eleves_select_parent on public.parents_eleves
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy parents_eleves_insert_super_admin on public.parents_eleves
  for insert to authenticated
  with check (public.est_super_admin());

create policy parents_eleves_insert_directeur on public.parents_eleves
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id()));

create policy parents_eleves_update_super_admin on public.parents_eleves
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy parents_eleves_update_directeur on public.parents_eleves
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id()));

create policy parents_eleves_delete_super_admin on public.parents_eleves
  for delete to authenticated
  using (public.est_super_admin());

create policy parents_eleves_delete_directeur on public.parents_eleves
  for delete to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

-- ---------------------------------------------------------------------
-- 4.5 echeances
-- Données financières : ni lues ni écrites par l'enseignant. Le caissier
-- lit celles de son école (pour encaisser) mais n'établit pas l'échéancier.
-- ---------------------------------------------------------------------

create policy echeances_select_super_admin on public.echeances
  for select to authenticated
  using (public.est_super_admin());

create policy echeances_select_directeur on public.echeances
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy echeances_select_caissier on public.echeances
  for select to authenticated
  using ((select public.mon_role()) = 'caissier'
         and ecole_id = (select public.mon_ecole_id()));

create policy echeances_select_parent on public.echeances
  for select to authenticated
  using ((select public.mon_role()) = 'parent'
         and public.est_tuteur_de(eleve_id));

create policy echeances_insert_super_admin on public.echeances
  for insert to authenticated
  with check (public.est_super_admin());

create policy echeances_insert_directeur on public.echeances
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id()));

create policy echeances_update_super_admin on public.echeances
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy echeances_update_directeur on public.echeances
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id()));

create policy echeances_delete_super_admin on public.echeances
  for delete to authenticated
  using (public.est_super_admin());

-- Le directeur peut supprimer une échéance saisie par erreur, mais plus dès
-- qu'un paiement confirmé s'y rattache : la cascade effacerait ce paiement.
create policy echeances_delete_directeur on public.echeances
  for delete to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id())
         and montant_paye = 0);

-- ---------------------------------------------------------------------
-- 4.6 paiements
-- Le parent LIT l'historique de ses enfants (§5.8) mais n'insère rien :
-- un paiement mobile money est créé puis confirmé côté serveur par
-- l'Edge Function du webhook opérateur (SECURITY_RULES.md §6). Sans cela,
-- un parent pourrait déclarer lui-même un paiement et se marquer à jour.
-- ---------------------------------------------------------------------

create policy paiements_select_super_admin on public.paiements
  for select to authenticated
  using (public.est_super_admin());

create policy paiements_select_directeur on public.paiements
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy paiements_select_caissier on public.paiements
  for select to authenticated
  using ((select public.mon_role()) = 'caissier'
         and ecole_id = (select public.mon_ecole_id()));

create policy paiements_select_parent on public.paiements
  for select to authenticated
  using ((select public.mon_role()) = 'parent'
         and public.est_tuteur_de_echeance(echeance_id));

create policy paiements_insert_super_admin on public.paiements
  for insert to authenticated
  with check (public.est_super_admin());

-- Encaissement au guichet : le caissier et le directeur saisissent le
-- paiement reçu, tracé par encaisse_par = leur propre identifiant.
create policy paiements_insert_directeur on public.paiements
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id())
              and encaisse_par = (select auth.uid()));

create policy paiements_insert_caissier on public.paiements
  for insert to authenticated
  with check ((select public.mon_role()) = 'caissier'
              and ecole_id = (select public.mon_ecole_id())
              and encaisse_par = (select auth.uid()));

-- Seule la colonne `note` est ouverte à l'UPDATE (grants §3) : le statut
-- d'un paiement ne se requalifie jamais depuis le client.
create policy paiements_update_super_admin on public.paiements
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy paiements_update_directeur on public.paiements
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id()));

-- Un paiement ne se supprime pas : il s'annule ou se rembourse côté
-- serveur, pour garder la trace comptable.
create policy paiements_delete_super_admin on public.paiements
  for delete to authenticated
  using (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 4.7 absences
-- Saisie par l'enseignant (ses classes) ou le personnel administratif
-- (§5.4). Le caissier n'a rien à voir ici : hors de son périmètre.
-- ---------------------------------------------------------------------

create policy absences_select_super_admin on public.absences
  for select to authenticated
  using (public.est_super_admin());

create policy absences_select_directeur on public.absences
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy absences_select_enseignant on public.absences
  for select to authenticated
  using ((select public.mon_role()) = 'enseignant'
         and ecole_id = (select public.mon_ecole_id())
         and public.enseigne_eleve(eleve_id));

create policy absences_select_parent on public.absences
  for select to authenticated
  using ((select public.mon_role()) = 'parent'
         and public.est_tuteur_de(eleve_id));

create policy absences_insert_super_admin on public.absences
  for insert to authenticated
  with check (public.est_super_admin());

create policy absences_insert_directeur on public.absences
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id()));

create policy absences_insert_enseignant on public.absences
  for insert to authenticated
  with check ((select public.mon_role()) = 'enseignant'
              and ecole_id = (select public.mon_ecole_id())
              and public.enseigne_eleve(eleve_id));

create policy absences_update_super_admin on public.absences
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy absences_update_directeur on public.absences
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id()));

create policy absences_update_enseignant on public.absences
  for update to authenticated
  using ((select public.mon_role()) = 'enseignant'
         and ecole_id = (select public.mon_ecole_id())
         and public.enseigne_eleve(eleve_id))
  with check (ecole_id = (select public.mon_ecole_id())
              and public.enseigne_eleve(eleve_id));

create policy absences_delete_super_admin on public.absences
  for delete to authenticated
  using (public.est_super_admin());

create policy absences_delete_directeur on public.absences
  for delete to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy absences_delete_enseignant on public.absences
  for delete to authenticated
  using ((select public.mon_role()) = 'enseignant'
         and ecole_id = (select public.mon_ecole_id())
         and public.enseigne_eleve(eleve_id));

-- ---------------------------------------------------------------------
-- 4.8 affectations_enseignants
-- C'est cette table qui définit le périmètre de l'enseignant : lui-même ne
-- peut donc que la lire. Seul le directeur affecte les classes.
-- ---------------------------------------------------------------------

create policy affectations_select_super_admin on public.affectations_enseignants
  for select to authenticated
  using (public.est_super_admin());

create policy affectations_select_directeur on public.affectations_enseignants
  for select to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));

create policy affectations_select_enseignant on public.affectations_enseignants
  for select to authenticated
  using (enseignant_id = (select auth.uid()));

create policy affectations_insert_super_admin on public.affectations_enseignants
  for insert to authenticated
  with check (public.est_super_admin());

create policy affectations_insert_directeur on public.affectations_enseignants
  for insert to authenticated
  with check ((select public.mon_role()) = 'directeur'
              and ecole_id = (select public.mon_ecole_id()));

create policy affectations_update_super_admin on public.affectations_enseignants
  for update to authenticated
  using (public.est_super_admin())
  with check (public.est_super_admin());

create policy affectations_update_directeur on public.affectations_enseignants
  for update to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()))
  with check (ecole_id = (select public.mon_ecole_id()));

create policy affectations_delete_super_admin on public.affectations_enseignants
  for delete to authenticated
  using (public.est_super_admin());

create policy affectations_delete_directeur on public.affectations_enseignants
  for delete to authenticated
  using ((select public.mon_role()) = 'directeur'
         and ecole_id = (select public.mon_ecole_id()));
