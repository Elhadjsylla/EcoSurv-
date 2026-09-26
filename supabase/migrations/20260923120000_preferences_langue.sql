-- Migration : Préférence de langue pour les utilisateurs et contacts parents
-- Date : 2026-09-23
-- Objet : Permet de stocker la langue choisie par l'utilisateur connecté (profils)
--         et la langue préférée des parents pour les communications WhatsApp/SMS (eleves).

-- 1. Ajout de la colonne langue_preferee sur la table profils
ALTER TABLE public.profils 
ADD COLUMN IF NOT EXISTS langue_preferee TEXT DEFAULT 'fr' 
CHECK (langue_preferee IN ('fr', 'ar', 'en'));

COMMENT ON COLUMN public.profils.langue_preferee IS 
'Langue d''interface choisie par l''utilisateur (fr = Français, ar = Arabe, en = Anglais)';

-- 2. Ajout de la colonne langue_parent sur la table eleves
ALTER TABLE public.eleves 
ADD COLUMN IF NOT EXISTS langue_parent TEXT DEFAULT 'fr' 
CHECK (langue_parent IN ('fr', 'ar', 'en'));

COMMENT ON COLUMN public.eleves.langue_parent IS 
'Langue de communication préférée pour les notifications WhatsApp et SMS destinées aux tuteurs/parents';

-- 3. Fonction RPC sécurisée pour mettre à jour la langue de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.mettre_a_jour_langue_profil(p_langue TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_langue NOT IN ('fr', 'ar', 'en') THEN
    RAISE EXCEPTION 'Code de langue non supporté : %', p_langue;
  END IF;

  UPDATE public.profils
  SET langue_preferee = p_langue,
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mettre_a_jour_langue_profil(TEXT) TO authenticated;
