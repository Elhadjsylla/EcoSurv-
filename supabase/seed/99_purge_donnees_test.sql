-- =====================================================================
--  ███  COMMANDE DESTRUCTRICE — À LIRE AVANT D'EXÉCUTER  ███
--
--  Supprime UNIQUEMENT l'école de démonstration
--  11111111-1111-1111-1111-111111111111 et, par cascade, ses 10 élèves,
--  leurs échéances, leurs paiements, leurs absences et les liens
--  parent-élève associés.
--
--  Le WHERE est volontairement limité à cet unique identifiant : aucune
--  autre école, aucune donnée réelle n'est touchée. Il n'y a ici ni DROP,
--  ni TRUNCATE, ni DELETE sans clause WHERE.
--
--  À N'EXÉCUTER QUE si vous voulez repartir d'un jeu de démonstration
--  vierge. 01_donnees_test.sql est de toute façon ré-exécutable sans
--  purge préalable (ON CONFLICT DO NOTHING) : cette purge ne sert que
--  pour remettre les compteurs de paiement à zéro.
--
--  Les comptes Auth de démonstration ne sont PAS supprimés ici, seulement
--  leurs profils applicatifs. Pour supprimer les comptes eux-mêmes,
--  passez par Authentication > Users dans le dashboard.
-- =====================================================================

begin;

-- 1. Les profils d'abord : ecoles.id est référencé par profils.ecole_id
--    en ON DELETE RESTRICT, précisément pour qu'une école ne puisse pas
--    être effacée tant que des comptes y sont rattachés.
delete from public.profils
 where ecole_id = '11111111-1111-1111-1111-111111111111';

-- 1bis. Le profil super_admin de démonstration a ecole_id = NULL (imposé
--    par profils_ecole_selon_role) : il échappe donc au filtre ci-dessus.
--    On le cible par son email de démonstration, jamais par son rôle —
--    supprimer « tous les super_admin » emporterait les vrais comptes.
delete from public.profils
 where email like '%.demo@ecosurv.test'
   and role = 'super_admin';

-- 2. L'école, qui emporte en cascade élèves, échéances, paiements,
--    absences, liens parent-élève et affectations d'enseignants.
delete from public.ecoles
 where id = '11111111-1111-1111-1111-111111111111';

-- 3. Contrôle avant validation : les trois compteurs doivent être à 0.
select
  (select count(*) from public.ecoles
    where id = '11111111-1111-1111-1111-111111111111') as ecoles_restantes,
  (select count(*) from public.eleves
    where matricule like 'DEMO-%')                     as eleves_demo_restants,
  (select count(*) from public.paiements
    where reference_transaction like 'DEMO-TRX-%')     as paiements_demo_restants,
  (select count(*) from public.profils
    where email like '%.demo@ecosurv.test')            as profils_demo_restants;

-- Si les compteurs sont bons :
commit;
-- Sinon, remplacez la ligne ci-dessus par : rollback;
