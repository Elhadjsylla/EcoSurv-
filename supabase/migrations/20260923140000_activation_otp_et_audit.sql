-- =====================================================================
-- Migration : Codes d'activation OTP par email & Table Audit Logs
-- Date : 2026-09-23
-- Objet : Permet l'auto-activation des écoles via code email (SHA-256, 15 min)
--         et la journalisation des événements système (audit_logs).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table audit_logs (Traçabilité & Événements Système)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  TEXT,
  action_type  TEXT NOT NULL,
  target_id    TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_type_idx ON public.audit_logs (action_type);

-- RLS sur audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les super_admin peuvent lire les audit logs
CREATE POLICY "super_admin_select_audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profils
      WHERE profils.id = auth.uid()
        AND profils.role = 'super_admin'
    )
  );

-- Insertion autorisée pour tout utilisateur authentifié (ou fonctions système)
CREATE POLICY "authenticated_insert_audit_logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 2. Table codes_activation (Codes OTP sécurisés pour les écoles)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codes_activation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id        UUID NOT NULL REFERENCES public.ecoles(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  code_hash       TEXT NOT NULL,
  tentatives      INT NOT NULL DEFAULT 0,
  max_tentatives  INT NOT NULL DEFAULT 5,
  expire_a        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  utilise         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS codes_activation_ecole_id_idx ON public.codes_activation (ecole_id, utilise);

ALTER TABLE public.codes_activation ENABLE ROW LEVEL SECURITY;

-- Les directeurs peuvent lire et manipuler leurs propres codes d'activation
CREATE POLICY "codes_activation_policy"
  ON public.codes_activation
  FOR ALL
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profils
      WHERE profils.id = auth.uid()
        AND (profils.ecole_id = codes_activation.ecole_id OR profils.role = 'super_admin')
    )
  );

-- ---------------------------------------------------------------------
-- 3. Fonction RPC : Enregistrer un nouveau code OTP (Hash SHA-256)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enregistrer_code_activation(
  p_ecole_id UUID,
  p_email TEXT,
  p_code_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_recent_count INT;
BEGIN
  -- Anti-spam : pas plus de 3 codes par heure pour la même école
  SELECT COUNT(*) INTO v_recent_count
  FROM public.codes_activation
  WHERE ecole_id = p_ecole_id
    AND created_at > (now() - interval '1 hour');

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Trop de tentatives. Veuillez patienter 1 heure avant de redemander un code.';
  END IF;

  -- Invalider tous les anciens codes actifs pour cette école
  UPDATE public.codes_activation
  SET utilise = true
  WHERE ecole_id = p_ecole_id AND utilise = false;

  -- Insérer le nouveau code avec expiration 15 min
  INSERT INTO public.codes_activation (
    ecole_id,
    email,
    code_hash,
    expire_a,
    created_at
  )
  VALUES (
    p_ecole_id,
    p_email,
    p_code_hash,
    now() + interval '15 minutes',
    now()
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enregistrer_code_activation(UUID, TEXT, TEXT) TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 4. Fonction RPC : Valider le code OTP et Activer l'école
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verifier_et_activer_ecole_otp(
  p_ecole_id UUID,
  p_code_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Recherche du code actif le plus récent pour cette école
  SELECT * INTO v_code
  FROM public.codes_activation
  WHERE ecole_id = p_ecole_id
    AND utilise = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'aucun_code',
      'message', 'Aucun code d''activation en attente ou le code a déjà été utilisé.'
    );
  END IF;

  -- Vérifier la date d'expiration
  IF v_code.expire_a < now() THEN
    UPDATE public.codes_activation SET utilise = true WHERE id = v_code.id;
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'expire',
      'message', 'Ce code a expiré (validité 15 minutes). Veuillez en demander un nouveau.'
    );
  END IF;

  -- Vérifier le nombre max de tentatives (5)
  IF v_code.tentatives >= v_code.max_tentatives THEN
    UPDATE public.codes_activation SET utilise = true WHERE id = v_code.id;
    RETURN jsonb_build_object(
      'succes', false,
      'code_erreur', 'tentatives_max',
      'message', 'Nombre maximal de tentatives dépassé. Veuillez demander un nouveau code.'
    );
  END IF;

  -- Vérifier le hash du code
  IF v_code.code_hash <> p_code_hash THEN
    -- Incrémenter les tentatives
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

  -- SI LE CODE EST BON :
  -- 1. Marquer le code comme utilisé
  UPDATE public.codes_activation
  SET utilise = true
  WHERE id = v_code.id;

  -- 2. Activer l'école automatiquement
  UPDATE public.ecoles
  SET statut_activation = 'active',
      updated_at = now()
  WHERE id = p_ecole_id;

  -- 3. Activer le profil du directeur si besoin
  UPDATE public.profils
  SET actif = true,
      updated_at = now()
  WHERE id = v_user_id AND (ecole_id = p_ecole_id OR ecole_id IS NULL);

  -- 4. Journaliser l'événement dans audit_logs
  INSERT INTO public.audit_logs (
    actor_id,
    actor_email,
    action_type,
    target_id,
    metadata,
    created_at
  )
  VALUES (
    v_user_id,
    COALESCE(v_user_email, v_code.email),
    'school.self_activated',
    p_ecole_id::text,
    jsonb_build_object(
      'method', 'email_otp',
      'activated_at', now(),
      'email', v_code.email
    ),
    now()
  );

  RETURN jsonb_build_object(
    'succes', true,
    'message', 'École activée avec succès.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifier_et_activer_ecole_otp(UUID, TEXT) TO authenticated, anon;
