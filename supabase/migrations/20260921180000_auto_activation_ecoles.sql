-- =====================================================================
-- Migration : Auto-activation des écoles lors de l'inscription
--
-- Modifie le trigger inscrire_ecole_depuis_compte pour créer les nouvelles
-- écoles directement en statut_activation = 'active' (statut_abonnement = 'essai').
-- Le Super Admin conserve la possibilité de suspendre/réactiver n'importe
-- quelle école via la RPC changer_statut_activation_ecole.
-- =====================================================================

create or replace function public.inscrire_ecole_depuis_compte()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nom_ecole text  := nullif(btrim(v_meta ->> 'nom_ecole'), '');
  v_nom       text  := nullif(btrim(v_meta ->> 'nom'), '');
  v_prenom    text  := nullif(btrim(v_meta ->> 'prenom'), '');
  v_telephone text  := nullif(btrim(v_meta ->> 'telephone'), '');
  v_ville     text  := nullif(btrim(v_meta ->> 'ville'), '');
  v_ecole_id  uuid;
begin
  if v_meta ->> 'type_inscription' is distinct from 'ecole' then
    return new;
  end if;

  if new.email is null then
    raise exception 'Inscription d''école : une adresse email est requise'
      using errcode = '22023';
  end if;
  if v_nom_ecole is null or length(v_nom_ecole) > 150 then
    raise exception 'Inscription d''école : nom_ecole requis (150 caractères au plus)'
      using errcode = '22023';
  end if;
  if v_nom is null or length(v_nom) > 100
     or length(coalesce(v_prenom, '')) > 100
     or length(coalesce(v_telephone, '')) > 30
     or length(coalesce(v_ville, '')) > 100 then
    raise exception 'Inscription d''école : nom requis ; prenom, ville (100), telephone (30) trop longs'
      using errcode = '22023';
  end if;

  -- Création de l'école directement en statut 'active' pour accès immédiat au portail
  insert into public.ecoles (nom, ville, telephone, email, statut_activation, statut_abonnement)
  values (v_nom_ecole, v_ville, v_telephone, new.email, 'active', 'essai')
  returning id into v_ecole_id;

  insert into public.profils (id, ecole_id, role, nom, prenom, telephone, email)
  values (new.id, v_ecole_id, 'directeur', v_nom, v_prenom, v_telephone, new.email);

  return new;
end;
$$;

revoke execute on function public.inscrire_ecole_depuis_compte() from public, anon, authenticated;

-- Passer toutes les écoles existantes en attente à active
update public.ecoles
set statut_activation = 'active'
where statut_activation = 'en_attente';
