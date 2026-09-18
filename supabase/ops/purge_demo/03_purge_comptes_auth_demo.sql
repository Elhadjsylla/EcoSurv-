-- =====================================================================
--  ███  SUPPRESSION DÉFINITIVE — À LIRE EN ENTIER AVANT D'EXÉCUTER  ███
--
-- EcoSurv — Purge de l'école de démonstration : ÉTAPE 3, COMPTES AUTH
--
-- Supprime les 6 comptes Supabase Auth de démonstration, désignés par
-- leur email EXACT (aucun motif LIKE : un vrai compte ne peut pas être
-- attrapé par erreur). À exécuter APRÈS 02_purge_donnees_demo.sql : le
-- script refuse tant qu'un de ces comptes a encore un profil applicatif.
--
-- Supabase supprime en cascade, avec chaque compte, ses identités, ses
-- sessions et ses jetons de rafraîchissement : une session de démo encore
-- ouverte cesse de pouvoir se renouveler. (Même sans cette étape, un
-- compte de démo n'a déjà plus aucun accès aux données après l'étape 2 :
-- sans profil, aucune policy RLS ne le laisse passer.)
--
-- ALTERNATIVE ÉQUIVALENTE : Authentication > Users dans le dashboard,
-- supprimer les 6 comptes à la main (voie officielle Supabase). Dans ce
-- cas, ne pas exécuter ce fichier ; relancer seulement 01_verification.sql
-- pour constater « 0 / 6 ».
--
-- MODE D'EMPLOI : exécuter une fois avec c_executer = false (SIMULATION :
-- se termine par une « erreur » commençant par « SIMULATION RÉUSSIE »,
-- rien n'est supprimé), puis avec c_executer = true.
-- =====================================================================

do $comptes$
declare
  -- false = SIMULATION (tout est annulé). true = SUPPRESSION RÉELLE.
  c_executer constant boolean := false;

  c_emails constant text[] := array[
    'superadmin.demo@ecosurv.test',
    'directeur.demo@ecosurv.test',
    'enseignant.demo@ecosurv.test',
    'caissier.demo@ecosurv.test',
    'parent1.demo@ecosurv.test',
    'parent2.demo@ecosurv.test'];

  v_trouves  bigint;
  v_supprimes bigint;
  v_liste    text;
begin
  -- 1. L'étape 2 doit être faite : plus aucun profil pour ces comptes.
  select string_agg(u.email, ', ') into v_liste
    from auth.users u
    join public.profils p on p.id = u.id
   where u.email = any (c_emails);
  if v_liste is not null then
    raise exception 'REFUS : ces comptes ont encore un profil applicatif : %. Exécuter d''abord 02_purge_donnees_demo.sql. Rien n''a été supprimé.', v_liste;
  end if;

  -- 2. Suppression, par email exact.
  select count(*) into v_trouves from auth.users where email = any (c_emails);

  delete from auth.users where email = any (c_emails);
  get diagnostics v_supprimes = row_count;

  if v_supprimes <> v_trouves or v_supprimes > 6 then
    raise exception 'ANNULÉ : % compte(s) supprimé(s) pour % attendu(s). Rien n''a été supprimé.', v_supprimes, v_trouves;
  end if;

  if not c_executer then
    raise exception 'SIMULATION RÉUSSIE — rien n''a été supprimé (annulation volontaire). Comptes de démo qui seraient supprimés : % / 6.', v_supprimes
      using hint = 'Passer c_executer à true pour supprimer réellement.';
  end if;

  raise notice 'COMPTES SUPPRIMÉS : % / 6', v_supprimes;
end
$comptes$;

-- Constat final (atteint seulement après une suppression réelle) : 0.
select count(*) as comptes_demo_restants
  from auth.users
 where email in ('superadmin.demo@ecosurv.test', 'directeur.demo@ecosurv.test',
                 'enseignant.demo@ecosurv.test', 'caissier.demo@ecosurv.test',
                 'parent1.demo@ecosurv.test', 'parent2.demo@ecosurv.test');
