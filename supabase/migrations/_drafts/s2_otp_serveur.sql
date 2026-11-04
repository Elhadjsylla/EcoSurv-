-- =====================================================================
-- LOT S2 : activation d'école côté serveur
-- BROUILLON : à relire et exécuter par Elhadj. Ne pas committer (dossier _drafts).
--
-- Hypothèses NON VÉRIFIÉES sans accès à la base réelle (les migrations du dépôt
-- sont en retard sur la base) :
--   - colonnes ecoles.statut_activation, ecoles.updated_at, profils.actif, profils.updated_at
--   - table codes_activation (id, ecole_id, email, code_hash, tentatives, max_tentatives,
--     expire_a, utilise, created_at) et table audit_logs (actor_id, actor_email,
--     action_type, target_id, metadata, created_at)
--   - la politique profils_update_soi_meme existe sous ce nom, et profils_update_directeur aussi
--   - la fonction sha256(bytea) est disponible (PostgreSQL 11 ou plus, sans extension)
-- Compare avec la définition actuelle de verifier_et_activer_ecole_otp dans ta base avant d'exécuter.
--
-- ORDRE D'EXÉCUTION
--   1. BLOC A (nouvelle fonction verifier_code_activation) : sans risque, s'ajoute à l'existant.
--   2. Déployer la Edge Function send-activation-otp, invite-staff-member et le front.
--   3. BLOC C (mon_profil_actif + politique profils_update_soi_meme) : APRÈS le déploiement de
--      invite-staff-member (qui crée désormais les profils avec actif = true) et du front
--      (qui n'écrit plus profils.actif). Avant cela, une invitation en attente
--      (profil actif = false) ne pourrait plus s'activer.
--      Les profils du personnel déjà invités et encore inactifs doivent être passés à actif = true
--      par toi (UPDATE ciblé) avant le bloc C, sinon ils resteront bloqués.
--   4. BLOC B (retrait des anciennes RPC) : UNIQUEMENT après le déploiement du front.
--      Sinon l'ancien front, encore en ligne, ne pourrait plus activer d'école.
--   5. BLOC D (profils_update_directeur) : optionnel, voir le commentaire.
-- =====================================================================


-- ---------------------------------------------------------------------
-- BLOC A : verifier_code_activation(p_code text)
-- L'école vient de la session (profil du directeur), jamais d'un paramètre.
-- Le hash est calculé ici : sha256(ecole_id::text || ':' || code), en hexadécimal,
-- identique à celui calculé par la fonction Edge send-activation-otp.
-- Retour arrière : DROP FUNCTION public.verifier_code_activation(text);
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verifier_code_activation(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_user_email text;
  v_ecole_id   uuid;
  v_role       text;
  v_statut     text;
  v_code       public.codes_activation%ROWTYPE;
  v_hash       text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = '28000';
  END IF;

  -- Directeur de son école uniquement
  SELECT ecole_id, role::text INTO v_ecole_id, v_role
  FROM public.profils
  WHERE id = v_user_id;

  IF v_ecole_id IS NULL OR v_role IS DISTINCT FROM 'directeur' THEN
    RAISE EXCEPTION 'Action réservée au directeur de l''établissement' USING ERRCODE = '42501';
  END IF;

  SELECT statut_activation::text INTO v_statut
  FROM public.ecoles
  WHERE id = v_ecole_id;

  IF v_statut IS DISTINCT FROM 'en_attente' THEN
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'ecole_non_en_attente',
      'message', 'Cet établissement n''est pas en attente d''activation.'
    );
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Format du code : 6 chiffres exactement
  IF p_code IS NULL OR p_code !~ '^[0-9]{6}$' THEN
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'format_invalide',
      'message', 'Le code doit comporter 6 chiffres.'
    );
  END IF;

  -- Verrou sur le code actif le plus récent : deux essais simultanés ne contournent pas le compteur
  SELECT * INTO v_code
  FROM public.codes_activation
  WHERE ecole_id = v_ecole_id
    AND utilise = false
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'aucun_code',
      'message', 'Aucun code d''activation en attente ou le code a déjà été utilisé.'
    );
  END IF;

  IF v_code.expire_a < now() THEN
    UPDATE public.codes_activation SET utilise = true WHERE id = v_code.id;
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'expire',
      'message', 'Ce code a expiré (validité 15 minutes). Veuillez en demander un nouveau.'
    );
  END IF;

  IF v_code.tentatives >= v_code.max_tentatives THEN
    UPDATE public.codes_activation SET utilise = true WHERE id = v_code.id;
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'tentatives_max',
      'message', 'Nombre maximal de tentatives dépassé. Veuillez demander un nouveau code.'
    );
  END IF;

  v_hash := encode(sha256(convert_to(v_ecole_id::text || ':' || p_code, 'UTF8')), 'hex');

  IF v_code.code_hash <> v_hash THEN
    UPDATE public.codes_activation
    SET tentatives = tentatives + 1
    WHERE id = v_code.id;

    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'code_incorrect',
      'tentatives_restantes', (v_code.max_tentatives - (v_code.tentatives + 1)),
      'message', 'Code de vérification incorrect. ' || (v_code.max_tentatives - (v_code.tentatives + 1)) || ' tentative(s) restante(s).'
    );
  END IF;

  -- Code bon : consommer le code, activer l'école, activer le profil du directeur
  UPDATE public.codes_activation SET utilise = true WHERE id = v_code.id;

  UPDATE public.ecoles
  SET statut_activation = 'active',
      updated_at = now()
  WHERE id = v_ecole_id;

  UPDATE public.profils
  SET actif = true,
      updated_at = now()
  WHERE id = v_user_id;

  INSERT INTO public.audit_logs (actor_id, actor_email, action_type, target_id, metadata, created_at)
  VALUES (
    v_user_id,
    COALESCE(v_user_email, v_code.email),
    'school.self_activated',
    v_ecole_id::text,
    jsonb_build_object('method', 'email_otp', 'activated_at', now(), 'email', v_code.email),
    now()
  );

  RETURN jsonb_build_object('succes', true, 'message', 'École activée avec succès.');
END;
$$;

REVOKE ALL ON FUNCTION public.verifier_code_activation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verifier_code_activation(text) TO authenticated;


-- ---------------------------------------------------------------------
-- BLOC C : un utilisateur ne peut plus modifier sa propre colonne actif
-- mon_profil_actif() lit l'état ACTUEL du profil (SECURITY DEFINER, STABLE : lit l'instantané
-- du début de l'instruction, donc la valeur AVANT la mise à jour en cours).
-- La politique compare la nouvelle valeur d'actif à l'ancienne.
-- Les écritures du super administrateur (profils_update_super_admin) et des Edge Functions
-- (clé service) ne sont pas concernées.
-- Retour arrière : recréer profils_update_soi_meme avec la définition d'origine
--   (migration 20260908100000_rls_policies.sql, lignes 364-367) puis
--   DROP FUNCTION public.mon_profil_actif();
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mon_profil_actif()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT actif FROM public.profils WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.mon_profil_actif() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_profil_actif() TO authenticated;

DROP POLICY IF EXISTS profils_update_soi_meme ON public.profils;
CREATE POLICY profils_update_soi_meme ON public.profils
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND actif IS NOT DISTINCT FROM (SELECT public.mon_profil_actif())
  );
-- Le trigger profils_protege_role_ecole continue de bloquer role et ecole_id.


-- ---------------------------------------------------------------------
-- BLOC B : retrait des anciennes RPC pour les utilisateurs
-- À exécuter UNIQUEMENT après le déploiement du front de ce lot.
-- Retour arrière :
--   GRANT EXECUTE ON FUNCTION public.enregistrer_code_activation(uuid, text, text) TO authenticated;
--   GRANT EXECUTE ON FUNCTION public.verifier_et_activer_ecole_otp(uuid, text) TO authenticated;
-- (signatures de la migration 20260923140000 ; vérifier celles de la base réelle)
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.enregistrer_code_activation(uuid, text, text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verifier_et_activer_ecole_otp(uuid, text) FROM authenticated, anon, PUBLIC;


-- ---------------------------------------------------------------------
-- BLOC D (OPTIONNEL, à décider) : même garde-fou sur profils_update_directeur
-- Constat dans le dépôt (migration 20260908100000, lignes 374-379) : cette politique permet
-- au directeur de modifier tout profil de son école, y compris le sien. Sans ce bloc, un
-- directeur peut encore se mettre actif = true lui-même, ce qui contourne le bloc C.
-- Ce bloc interdit seulement de changer SON PROPRE actif ; il peut toujours gérer celui du personnel.
-- À adapter si ta base réelle diffère. Retour arrière : recréer la politique d'origine.
-- ---------------------------------------------------------------------
-- DROP POLICY IF EXISTS profils_update_directeur ON public.profils;
-- CREATE POLICY profils_update_directeur ON public.profils
--   FOR UPDATE TO authenticated
--   USING ((SELECT public.mon_role()) = 'directeur'
--          AND ecole_id = (SELECT public.mon_ecole_id()))
--   WITH CHECK (ecole_id = (SELECT public.mon_ecole_id())
--               AND role <> 'super_admin'
--               AND (id <> (SELECT auth.uid())
--                    OR actif IS NOT DISTINCT FROM (SELECT public.mon_profil_actif())));
