-- =====================================================================
--  ███  SUPPRESSION DÉFINITIVE — À LIRE EN ENTIER AVANT D'EXÉCUTER  ███
--
-- EcoSurv — Purge de l'école de démonstration : ÉTAPE 2, DONNÉES
--
-- Supprime l'école de démonstration 11111111-1111-1111-1111-111111111111
-- et toutes les lignes qui lui sont rattachées, table par table, enfants
-- avant parents. Aucun DROP, aucun TRUNCATE, aucun DELETE sans clause
-- WHERE sur cet identifiant précis : le schéma, les policies et les
-- données de toute autre école ne sont pas touchés.
--
-- Les 6 comptes Supabase Auth de démo sont traités à l'étape 3
-- (03_purge_comptes_auth_demo.sql), APRÈS ce script.
--
-- ---------------------------------------------------------------------
-- MODE D'EMPLOI
--
--   1. Exécuter 01_verification.sql. Lire tout le résultat.
--   2. Renseigner les constantes du bloc « À RENSEIGNER » ci-dessous :
--        c_nom_ecole  : le nom exact affiché en A (ligne « École ciblée »)
--        c_attendu    : la valeur de la ligne E, telle quelle
--   3. Exécuter ce script AVEC c_executer = false (SIMULATION).
--      Il fait réellement toutes les suppressions et tous les contrôles,
--      puis ANNULE TOUT. Il se termine donc volontairement par une
--      « erreur » qui commence par « SIMULATION RÉUSSIE » et donne le
--      bilan : c'est le résultat attendu, rien n'a été supprimé.
--      Tout autre message d'erreur = un garde-fou a refusé : lire le
--      message, ne pas forcer.
--   4. Passer c_executer à true et exécuter à nouveau. Succès = la
--      dernière requête affiche 0 partout.
--
-- Tout le travail est fait dans un seul bloc DO : si un seul contrôle
-- échoue, PostgreSQL annule l'intégralité des suppressions. Il n'existe
-- pas d'état « à moitié purgé ».
--
-- GARDE-FOUS (le script refuse et n'efface rien si l'un échoue)
--   - l'école ciblée existe ET porte exactement le nom c_nom_ecole ;
--   - aucun profil de démo n'est référencé par une autre école ;
--   - aucun compte autre que les 5 comptes de démo n'est rattaché à
--     l'école de démo (sauf s'il est listé dans
--     c_autres_comptes_autorises) ;
--   - il restera au moins un super_admin actif après la purge ;
--   - en mode réel : le nombre de lignes supprimées dans chaque table est
--     EXACTEMENT celui validé à l'étape 1 (c_attendu) ;
--   - l'empreinte (md5) de toutes les lignes des AUTRES écoles est
--     identique avant et après : preuve qu'aucune n'a été modifiée ni
--     supprimée ;
--   - plus aucune ligne rattachée à l'école de démo ne subsiste.
--
-- À exécuter dans le SQL Editor Supabase (rôle postgres, propriétaire des
-- tables). Les tables concernées sont verrouillées en écriture pendant
-- les quelques millisecondes de l'opération ; si l'application écrit à
-- ce moment-là, le script abandonne après 5 s sans rien effacer :
-- relancer simplement.
-- =====================================================================

do $purge$
declare
  -- ===================== À RENSEIGNER ==============================
  -- Identifiant de l'école de démonstration (seed 01_donnees_test.sql).
  c_ecole_id    constant uuid    := '11111111-1111-1111-1111-111111111111';
  -- Nom EXACT lu à l'étape 1 (ligne A « École ciblée »).
  c_nom_ecole   constant text    := '[DÉMO] Groupe Scolaire Al Anwar';
  -- Ligne E de l'étape 1, recopiée telle quelle entre apostrophes.
  -- Laissée à NULL, seule la simulation est possible.
  c_attendu     constant jsonb   := null;
  -- false = SIMULATION (tout est annulé). true = SUPPRESSION RÉELLE.
  c_executer    constant boolean := false;
  -- Emails de comptes NON-démo rattachés à l'école de démo (garde-fou C
  -- « Comptes de l'école démo qui ne sont PAS des comptes de démo ») dont
  -- vous confirmez la suppression. Vide par défaut.
  c_autres_comptes_autorises constant text[] := '{}';
  -- ================================================================

  c_email_super_admin_demo constant text := 'superadmin.demo@ecosurv.test';
  c_emails_ecole_demo constant text[] := array[
    'directeur.demo@ecosurv.test',
    'enseignant.demo@ecosurv.test',
    'caissier.demo@ecosurv.test',
    'parent1.demo@ecosurv.test',
    'parent2.demo@ecosurv.test'];

  -- Tables dont l'empreinte des lignes HORS démo est comparée avant/après.
  c_tables constant text[] := array[
    'ecoles', 'profils', 'eleves', 'parents_eleves', 'echeances',
    'paiements', 'absences', 'affectations_enseignants',
    'notifications', 'clotures_caisse'];

  v_profils       uuid[];   -- profils qui seront supprimés
  v_super_admin   uuid;     -- profil super_admin de démo (ecole_id NULL)
  v_bilan         jsonb := '{}';
  v_n             bigint;
  v_liste         text;
  v_table         text;
  v_filtre        text;
  v_empreinte_avant jsonb := '{}';
  v_empreinte_apres jsonb := '{}';
  v_empreinte     text;
begin
  -- -------------------------------------------------------------------
  -- 0. Verrouillage : personne n'écrit pendant la purge. Lectures
  --    toujours permises. Abandon propre si l'application est en train
  --    d'écrire.
  -- -------------------------------------------------------------------
  perform set_config('lock_timeout', '5s', true);
  lock table public.ecoles, public.profils, public.eleves,
             public.parents_eleves, public.echeances, public.paiements,
             public.absences, public.affectations_enseignants
    in share row exclusive mode;
  if to_regclass('public.notifications') is not null then
    execute 'lock table public.notifications in share row exclusive mode';
  end if;
  if to_regclass('public.clotures_caisse') is not null then
    execute 'lock table public.clotures_caisse in share row exclusive mode';
  end if;

  -- -------------------------------------------------------------------
  -- 1. Garde-fous
  -- -------------------------------------------------------------------

  -- 1a. La bonne école, et elle seule.
  if not exists (select 1 from public.ecoles
                  where id = c_ecole_id and nom = c_nom_ecole) then
    raise exception 'REFUS : aucune école % portant exactement le nom « % ». Rien n''a été supprimé.',
      c_ecole_id, c_nom_ecole
      using hint = 'Relancer 01_verification.sql et recopier le nom exact.';
  end if;

  -- 1b. Mode réel : les comptes validés à l'étape 1 sont obligatoires.
  if c_executer and c_attendu is null then
    raise exception 'REFUS : c_attendu est vide. Recopier la ligne E de 01_verification.sql avant la suppression réelle.';
  end if;

  -- 1c. Profils visés : ceux de l'école, plus le super_admin de démo
  --     identifié par l'email de son compte Auth ET son rôle.
  select p.id into v_super_admin
    from public.profils p
    join auth.users u on u.id = p.id
   where p.ecole_id is null
     and p.role = 'super_admin'
     and u.email = c_email_super_admin_demo;

  select coalesce(array_agg(p.id), '{}') into v_profils
    from public.profils p
   where p.ecole_id = c_ecole_id;
  if v_super_admin is not null then
    v_profils := v_profils || v_super_admin;
  end if;

  -- 1d. Aucun compte réel ne doit disparaître par erreur.
  select string_agg(coalesce(u.email, p.email, p.id::text), ', ') into v_liste
    from public.profils p
    left join auth.users u on u.id = p.id
   where p.ecole_id = c_ecole_id
     and coalesce(u.email, '') <> all (c_emails_ecole_demo)
     and coalesce(u.email, '') <> all (c_autres_comptes_autorises);
  if v_liste is not null then
    raise exception 'REFUS : comptes non-démo rattachés à l''école de démo : %. Rien n''a été supprimé.', v_liste
      using hint = 'Les rattacher à la vraie école, ou les lister dans c_autres_comptes_autorises si leur suppression est voulue.';
  end if;

  -- 1e. Aucune autre école ne référence un profil de démo.
  select count(*) into v_n from public.parents_eleves
   where parent_id = any (v_profils) and ecole_id <> c_ecole_id;
  if v_n > 0 then
    raise exception 'REFUS : % lien(s) parent-élève d''une autre école pointent un profil de démo. Rien n''a été supprimé.', v_n;
  end if;
  select count(*) into v_n from public.paiements
   where encaisse_par = any (v_profils) and ecole_id <> c_ecole_id;
  if v_n > 0 then
    raise exception 'REFUS : % paiement(s) d''une autre école encaissés par un profil de démo. Rien n''a été supprimé.', v_n;
  end if;
  select count(*) into v_n from public.absences
   where saisie_par = any (v_profils) and ecole_id <> c_ecole_id;
  if v_n > 0 then
    raise exception 'REFUS : % absence(s) d''une autre école saisies par un profil de démo. Rien n''a été supprimé.', v_n;
  end if;

  -- 1f. Il restera un super_admin actif.
  if not exists (select 1 from public.profils
                  where role = 'super_admin' and actif
                    and id <> all (v_profils)) then
    raise exception 'REFUS : aucun super_admin actif ne resterait après la purge. Rien n''a été supprimé.'
      using hint = 'Créer d''abord le vrai compte super_admin (profils.role = super_admin, ecole_id NULL).';
  end if;

  -- -------------------------------------------------------------------
  -- 2. Empreinte des lignes HORS démo, avant
  -- -------------------------------------------------------------------
  foreach v_table in array c_tables loop
    continue when to_regclass('public.' || v_table) is null;
    v_filtre := case v_table
      when 'ecoles'  then 'id <> $1'
      when 'profils' then 'id <> all ($2)'
      else                'ecole_id <> $1'
    end;
    execute format('select coalesce(md5(string_agg(md5(t::text), '''' order by t.id)), ''vide'')
                      from public.%I t where %s', v_table, v_filtre)
      into v_empreinte using c_ecole_id, v_profils;
    v_empreinte_avant := v_empreinte_avant || jsonb_build_object(v_table, v_empreinte);
  end loop;

  -- -------------------------------------------------------------------
  -- 3. Suppressions, enfants avant parents
  --
  -- Chaque DELETE porte explicitement « ecole_id = c_ecole_id » (ou
  -- l'identifiant exact du profil super_admin de démo). L'ordre évite
  -- aussi deux effets de bord des triggers :
  --   - les clôtures partent en premier : elles verrouillent les
  --     paiements de leurs journées et référencent les caissiers en
  --     ON DELETE RESTRICT ;
  --   - les liens parent-élève partent avant les paiements : supprimer
  --     un paiement recalcule l'échéance, qui pourrait basculer en retard
  --     et notifier un parent. Sans lien, aucun parent n'est trouvé.
  -- -------------------------------------------------------------------

  -- 3.1 Clôtures de caisse (table de la PR #11, peut-être absente)
  if to_regclass('public.clotures_caisse') is not null then
    delete from public.clotures_caisse where ecole_id = c_ecole_id;
    get diagnostics v_n = row_count;
  else
    v_n := 0;
  end if;
  v_bilan := v_bilan || jsonb_build_object('clotures_caisse', v_n);

  -- 3.2 Notifications (table de la PR #11, peut-être absente)
  if to_regclass('public.notifications') is not null then
    delete from public.notifications where ecole_id = c_ecole_id;
    get diagnostics v_n = row_count;
  else
    v_n := 0;
  end if;
  v_bilan := v_bilan || jsonb_build_object('notifications', v_n);

  -- 3.3 Liens parent-élève
  delete from public.parents_eleves where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('parents_eleves', v_n);

  -- 3.4 Affectations des enseignants
  delete from public.affectations_enseignants where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('affectations_enseignants', v_n);

  -- 3.5 Absences
  delete from public.absences where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('absences', v_n);

  -- 3.6 Paiements (avant les échéances qu'ils référencent)
  delete from public.paiements where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('paiements', v_n);

  -- 3.7 Échéances (avant les élèves qu'elles référencent)
  delete from public.echeances where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('echeances', v_n);

  -- 3.8 Élèves
  delete from public.eleves where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('eleves', v_n);

  -- 3.9 Profils de l'école (les comptes Auth restent jusqu'à l'étape 3)
  delete from public.profils where ecole_id = c_ecole_id;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('profils_ecole', v_n);

  -- 3.10 Profil super_admin de démo : par son identifiant exact
  if v_super_admin is not null then
    delete from public.profils
     where id = v_super_admin and ecole_id is null and role = 'super_admin';
    get diagnostics v_n = row_count;
  else
    v_n := 0;
  end if;
  v_bilan := v_bilan || jsonb_build_object('profil_super_admin', v_n);

  -- 3.11 L'école elle-même, en dernier
  delete from public.ecoles where id = c_ecole_id and nom = c_nom_ecole;
  get diagnostics v_n = row_count;
  v_bilan := v_bilan || jsonb_build_object('ecoles', v_n);

  -- -------------------------------------------------------------------
  -- 4. Contrôles après suppression
  -- -------------------------------------------------------------------

  -- 4a. Plus rien de rattaché à l'école de démo (y compris ce qu'un
  --     trigger aurait pu recréer pendant l'opération).
  foreach v_table in array c_tables loop
    continue when to_regclass('public.' || v_table) is null;
    execute format('select count(*) from public.%I where %s', v_table,
                   case v_table when 'ecoles' then 'id = $1' else 'ecole_id = $1' end)
      into v_n using c_ecole_id;
    if v_n > 0 then
      raise exception 'ANNULÉ : % ligne(s) de l''école de démo subsistent dans %. Rien n''a été supprimé.', v_n, v_table;
    end if;
  end loop;
  if exists (select 1 from public.profils where id = any (v_profils)) then
    raise exception 'ANNULÉ : un profil de démo subsiste. Rien n''a été supprimé.';
  end if;

  -- 4b. Les autres écoles sont intactes, ligne pour ligne.
  foreach v_table in array c_tables loop
    continue when to_regclass('public.' || v_table) is null;
    v_filtre := case v_table
      when 'ecoles'  then 'id <> $1'
      when 'profils' then 'id <> all ($2)'
      else                'ecole_id <> $1'
    end;
    execute format('select coalesce(md5(string_agg(md5(t::text), '''' order by t.id)), ''vide'')
                      from public.%I t where %s', v_table, v_filtre)
      into v_empreinte using c_ecole_id, v_profils;
    v_empreinte_apres := v_empreinte_apres || jsonb_build_object(v_table, v_empreinte);
  end loop;
  if v_empreinte_apres <> v_empreinte_avant then
    raise exception 'ANNULÉ : les données d''une autre école auraient été modifiées. Rien n''a été supprimé. Avant : % / Après : %',
      v_empreinte_avant, v_empreinte_apres;
  end if;

  -- 4c. Exactement ce qui a été validé à l'étape 1 (obligatoire en mode
  --     réel, vérifié aussi en simulation dès que c_attendu est rempli).
  if c_attendu is not null and v_bilan <> c_attendu then
    raise exception 'ANNULÉ : les suppressions ne correspondent pas aux chiffres validés. Rien n''a été supprimé. Validé : % / Constaté : %',
      c_attendu, v_bilan
      using hint = 'Les données ont changé depuis l''étape 1 : relancer 01_verification.sql et revalider.';
  end if;

  -- -------------------------------------------------------------------
  -- 5. Simulation : tout annuler, en donnant le bilan
  -- -------------------------------------------------------------------
  if not c_executer then
    raise exception 'SIMULATION RÉUSSIE — rien n''a été supprimé (annulation volontaire). Tous les garde-fous sont passés, les autres écoles sont intactes. Lignes qui seraient supprimées : % — %', v_bilan,
      case when c_attendu is null then 'c_attendu pas encore renseigné'
           else 'conforme à c_attendu' end
      using hint = 'Comparer avec la ligne E de 01_verification.sql, la recopier dans c_attendu, puis passer c_executer à true.';
  end if;

  raise notice 'PURGE EFFECTUÉE : %', v_bilan;
end
$purge$;

-- ---------------------------------------------------------------------
-- Constat final (n'est atteint qu'après une suppression réelle réussie) :
-- tout doit être à 0, sauf les comptes Auth, traités à l'étape 3.
-- ---------------------------------------------------------------------
select 'ecoles (école démo)' as controle,
       (select count(*) from public.ecoles where id = '11111111-1111-1111-1111-111111111111') as restant
union all select 'eleves',    (select count(*) from public.eleves    where ecole_id = '11111111-1111-1111-1111-111111111111')
union all select 'echeances', (select count(*) from public.echeances where ecole_id = '11111111-1111-1111-1111-111111111111')
union all select 'paiements', (select count(*) from public.paiements where ecole_id = '11111111-1111-1111-1111-111111111111')
union all select 'absences',  (select count(*) from public.absences  where ecole_id = '11111111-1111-1111-1111-111111111111')
union all select 'profils (école démo + super_admin démo)',
  (select count(*) from public.profils p left join auth.users u on u.id = p.id
    where p.ecole_id = '11111111-1111-1111-1111-111111111111'
       or (p.role = 'super_admin' and u.email = 'superadmin.demo@ecosurv.test'))
union all select 'comptes Auth de démo (étape 3 à faire)',
  (select count(*) from auth.users where email in (
     'superadmin.demo@ecosurv.test', 'directeur.demo@ecosurv.test', 'enseignant.demo@ecosurv.test',
     'caissier.demo@ecosurv.test', 'parent1.demo@ecosurv.test', 'parent2.demo@ecosurv.test'));
