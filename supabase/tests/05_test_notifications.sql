-- =====================================================================
-- Table notifications — assertions RLS par rôle et émission automatique.
-- Prérequis : 03_harnais_assertions.sql. Transaction annulée.
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

\set C   '''c0000000-0000-0000-0000-00000000000c'''
\set pC1 '''0000000c-0000-0000-0000-0000000000f1'''
\set pC2 '''0000000c-0000-0000-0000-0000000000f2'''
\set pD  '''0000000c-0000-0000-0000-0000000000f3'''

-- ---------------------------------------------------------------------
-- 1. Création : réservée au serveur
-- ---------------------------------------------------------------------
-- Deux couches : exécution révoquée, ET fonctions SECURITY INVOKER (un
-- grant d'exécution accordé par erreur resterait sans effet, l'INSERT
-- interne étant refusé à authenticated). On vérifie les deux.
select tests.egal(
  (select count(*) from pg_proc
    where oid in ('public.notifier_utilisateur(uuid, uuid, public.type_notification, text, uuid)'::regprocedure,
                  'public.notifier_role(uuid, public.role_utilisateur, public.type_notification, text, uuid)'::regprocedure)
      and not prosecdef
      and not has_function_privilege('authenticated', oid, 'execute')
      and not has_function_privilege('anon', oid, 'execute')
      and has_function_privilege('service_role', oid, 'execute')),
  2::bigint, 'structure : fonctions de creation invoker, executables par le seul service_role');

select tests.session_serveur();
select tests.egal(
  public.notifier_utilisateur(:C::uuid, :pC1::uuid, 'echeance_retard', 'Message direct parent C1') is not null,
  true, 'serveur : notifier_utilisateur cree une notification');
select tests.egal(
  public.notifier_role(:C::uuid, 'caissier', 'echeance_retard', 'Relance du jour a traiter'),
  2, 'serveur : notifier_role eclate sur les 2 caissiers actifs de C');
select tests.egal(
  public.notifier_role(:C::uuid, 'directeur', 'paiement_confirme', 'Info direction'),
  1, 'serveur : notifier_role sur le directeur de C');
select tests.echoue(format($$select public.notifier_utilisateur(%L, %L, 'echeance_retard', 'Fuite')$$,
                           'c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f3'),
                    '23503', 'serveur : destinataire d une autre ecole rejete par la FK composite');
select tests.echoue($$select public.notifier_utilisateur('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f1', 'echeance_retard', '   ')$$,
                    '23514', 'serveur : message vide rejete');
select tests.egal(public.notifier_role(:C::uuid, 'super_admin', 'echeance_retard', 'X'), 0,
                  'serveur : aucun super_admin ne recoit de notification d ecole');

-- Un caissier désactivé ne reçoit plus les envois de rôle.
reset role;
update public.profils set actif = false where id = '0000000c-0000-0000-0000-0000000000c2';
select tests.session_serveur();
select tests.egal(public.notifier_role(:C::uuid, 'caissier', 'echeance_retard', 'Apres desactivation'), 1,
                  'serveur : notifier_role ignore les comptes desactives');
reset role;
update public.profils set actif = true where id = '0000000c-0000-0000-0000-0000000000c2';

-- Aucun utilisateur ne peut créer de notification, pour lui ni pour un autre.
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.echoue($$insert into public.notifications (ecole_id, user_id, type, message) values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f1', 'echeance_retard', 'Faux rappel')$$,
                    '42501', 'directeur : INSERT direct refuse');
select tests.echoue($$select public.notifier_utilisateur('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f1', 'echeance_retard', 'Faux rappel')$$,
                    '42501', 'directeur : fonction serveur non executable');
select tests.echoue($$select public.notifier_role('c0000000-0000-0000-0000-00000000000c', 'parent', 'echeance_retard', 'Spam')$$,
                    '42501', 'directeur : notifier_role non executable');
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.echoue($$insert into public.notifications (ecole_id, user_id, type, message) values ('c0000000-0000-0000-0000-00000000000c', '0000000c-0000-0000-0000-0000000000f1', 'paiement_confirme', 'Je me notifie')$$,
                    '42501', 'parent : s auto-notifier refuse');

-- ---------------------------------------------------------------------
-- 2. Lecture : ses propres notifications, dans son école
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.notifications', 1, 'parent C1 : sa seule notification');
select tests.session('0000000c-0000-0000-0000-0000000000f2');
select tests.voit('select 1 from public.notifications', 0, 'parent C2 : rien (pas celles de C1)');
select tests.session('0000000c-0000-0000-0000-0000000000c1');
select tests.voit('select 1 from public.notifications', 2, 'caissier C1 : ses 2 copies d envoi de role');
select tests.voit($$select 1 from public.notifications where role_cible = 'caissier'$$, 2, 'caissier C1 : role_cible trace');
select tests.session('0000000c-0000-0000-0000-0000000000d1');
select tests.voit('select 1 from public.notifications', 1,
                  'directeur C : ses notifications seulement, pas celles des parents ni caissiers');
select tests.session('0000000c-0000-0000-0000-0000000000a0');
select tests.voit('select 1 from public.notifications', 0, 'super_admin : aucune (correspondance personnelle)');
select tests.session('0000000c-0000-0000-0000-0000000000d2');
select tests.voit('select 1 from public.notifications', 0, 'directeur D : rien de l ecole C');
select tests.session('0000000c-0000-0000-0000-0000000000e1');
select tests.voit('select 1 from public.notifications', 0, 'enseignant C : rien');

-- ---------------------------------------------------------------------
-- 3. Mise à jour : seulement `lu`, seulement les siennes
-- ---------------------------------------------------------------------
select tests.session('0000000c-0000-0000-0000-0000000000c1');
select tests.touche('update public.notifications set lu = true', 2, 'caissier C1 : marque ses notifications lues');
select tests.echoue($$update public.notifications set message = 'Reecrit'$$, '42501', 'caissier C1 : reecrire le message');
select tests.echoue($$update public.notifications set user_id = '0000000c-0000-0000-0000-0000000000c2'$$, '42501', 'caissier C1 : changer de destinataire');
select tests.echoue('delete from public.notifications', '42501', 'caissier C1 : supprimer (piste conservee)');
select tests.session('0000000c-0000-0000-0000-0000000000c2');
select tests.voit('select 1 from public.notifications where not lu', 1,
                  'caissier C2 : sa copie reste non lue (etat lu non partage)');
select tests.session('0000000c-0000-0000-0000-0000000000f2');
select tests.touche('update public.notifications set lu = true', 0, 'parent C2 : marquer lues celles des autres (0 ligne)');

-- Compte désactivé : plus de lecture.
reset role;
update public.profils set actif = false where id = '0000000c-0000-0000-0000-0000000000f1';
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.notifications', 0, 'parent desactive : plus rien');
reset role;
update public.profils set actif = true where id = '0000000c-0000-0000-0000-0000000000f1';

select tests.session_anon();
select tests.echoue('select 1 from public.notifications', '42501', 'anon : aucun acces');
reset role;

-- ---------------------------------------------------------------------
-- 4. Émission automatique : paiement confirmé
-- ---------------------------------------------------------------------
delete from public.notifications;

-- Encaissement espèces au guichet -> parent C1 notifié, parent C2 non.
select tests.session('0000000c-0000-0000-0000-0000000000c1');
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par)
values (:C, '2000000c-0000-0000-0000-000000000001', 2500, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1');
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit($$select 1 from public.notifications where type = 'paiement_confirme'
                    and eleve_id = '1000000c-0000-0000-0000-000000000001'
                    and message = 'Paiement de 2 500 MRU confirmé pour Awa Diallo (Tranche 1).'$$,
                  1, 'auto : parent C1 notifie de l encaissement, message formate');
select tests.session('0000000c-0000-0000-0000-0000000000f2');
select tests.voit('select 1 from public.notifications', 0, 'auto : parent C2 non notifie (autre enfant)');

-- Chèque en attente : rien. Confirmation serveur : notification.
select tests.session('0000000c-0000-0000-0000-0000000000c1');
insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par, reference_transaction)
values (:C, '2000000c-0000-0000-0000-000000000001', 1000, 'cheque', 'en_attente', '0000000c-0000-0000-0000-0000000000c1', 'CHQ-05');
reset role;
select tests.egal((select count(*) from public.notifications), 1::bigint, 'auto : cheque en attente ne notifie pas');
select tests.session_serveur();
update public.paiements set statut = 'confirme', paye_le = now() where reference_transaction = 'CHQ-05';
reset role;
select tests.egal((select count(*) from public.notifications where message like 'Paiement de 1 000 MRU%'), 1::bigint,
                  'auto : confirmation serveur du cheque notifie');
update public.paiements set note = 'annotation' where reference_transaction = 'CHQ-05';
select tests.egal((select count(*) from public.notifications), 2::bigint,
                  'auto : modifier un paiement deja confirme ne renotifie pas');

-- ---------------------------------------------------------------------
-- 5. Émission automatique : échéance en retard
-- ---------------------------------------------------------------------
delete from public.notifications;

-- Échéance saisie déjà échue : en_retard dès l'INSERT, pas de notification.
insert into public.echeances (ecole_id, eleve_id, libelle, montant, date_echeance)
values (:C, '1000000c-0000-0000-0000-000000000002', 'Reprise historique', 9000, current_date - 40);
select tests.egal((select count(*) from public.notifications), 0::bigint, 'auto : pas de notification a l INSERT d une echeance echue');

-- Passage en retard par la tâche quotidienne rafraichir_statuts_echeances().
alter table public.echeances disable trigger echeances_statut_auto;
update public.echeances set date_echeance = current_date - 1
 where id = '2000000c-0000-0000-0000-000000000002';
alter table public.echeances enable trigger echeances_statut_auto;
select tests.egal(public.rafraichir_statuts_echeances() >= 1, true, 'auto : rafraichir bascule l echeance en retard');
select tests.session('0000000c-0000-0000-0000-0000000000f2');
select tests.voit(format($$select 1 from public.notifications where type = 'echeance_retard'
                    and message = 'Échéance « Tranche 1 » de Omar Ba en retard : 11 000 MRU restent à régler (échue le %s).'$$,
                    to_char(current_date - 1, 'DD/MM/YYYY')),
                  1, 'auto : parent C2 notifie du retard, reste du calcule');
select tests.session('0000000c-0000-0000-0000-0000000000f1');
select tests.voit('select 1 from public.notifications', 0, 'auto : parent C1 non notifie');
reset role;
select tests.egal(public.rafraichir_statuts_echeances(), 0, 'auto : second passage idempotent');
select tests.egal((select count(*) from public.notifications), 1::bigint, 'auto : pas de doublon au second passage');

-- ---------------------------------------------------------------------
-- 6. Robustesse : une notification en échec ne bloque pas le paiement
-- ---------------------------------------------------------------------
alter table public.notifications add constraint test_panne check (false) not valid;
select tests.session('0000000c-0000-0000-0000-0000000000c1');
select tests.touche($$insert into public.paiements (ecole_id, echeance_id, montant, methode, statut, encaisse_par)
                      values ('c0000000-0000-0000-0000-00000000000c', '2000000c-0000-0000-0000-000000000001', 500, 'especes', 'confirme', '0000000c-0000-0000-0000-0000000000c1')$$,
                    1, 'robustesse : l encaissement passe malgre l echec de la notification');
reset role;
alter table public.notifications drop constraint test_panne;

select tests.bilan('05_test_notifications');
rollback;
