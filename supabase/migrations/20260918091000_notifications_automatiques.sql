-- =====================================================================
-- EcoSurv — Notifications émises par la base
--
-- Deux événements financiers notifient les parents de l'élève concerné,
-- au moment où la base les constate plutôt que depuis un écran qu'on
-- pourrait oublier de brancher :
--   paiement_confirme : un paiement passe au statut 'confirme'
--                       (encaissement espèces au guichet, ou webhook)
--   echeance_retard   : une échéance bascule en 'en_retard'
--                       (rafraichir_statuts_echeances, ou annulation
--                       d'un paiement sur une échéance échue)
--
-- Règle de robustesse : une notification ne doit JAMAIS faire échouer
-- l'écriture financière qui la déclenche. Les triggers attrapent donc
-- toute erreur d'envoi et la remontent en WARNING dans les logs Postgres.
--
-- Limite connue : seuls les parents dont profils.ecole_id est l'école de
-- l'élève sont notifiés. Un parent rattaché principalement à une autre
-- école (enfants dans deux écoles, §5.1) ne l'est pas : la FK composite
-- de notifications l'interdit, et c'est voulu (une notification de
-- l'école B n'a pas à être lisible depuis une session de l'école A).
-- =====================================================================

-- Montant lisible : 15000 -> '15 000', 1500.5 -> '1 500.50'.
create or replace function public.formater_mru(p_montant numeric)
returns text
language sql
immutable
as $$
  select replace(
           to_char(p_montant,
                   case when p_montant = trunc(p_montant)
                        then 'FM999,999,999,990'
                        else 'FM999,999,999,990.00' end),
           ',', ' ');
$$;

-- ---------------------------------------------------------------------
-- 1. Paiement confirmé -> parents de l'élève
-- ---------------------------------------------------------------------

create or replace function public.notifier_paiement_confirme()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Seulement à l'entrée dans l'état confirmé, pas à chaque UPDATE d'un
  -- paiement déjà confirmé (ex. modification de la note).
  if tg_op = 'UPDATE' and old.statut = 'confirme' then
    return null;
  end if;

  begin
    insert into public.notifications (ecole_id, user_id, eleve_id, type, message)
    select new.ecole_id,
           pr.id,
           el.id,
           'paiement_confirme',
           format('Paiement de %s MRU confirmé pour %s %s (%s).',
                  public.formater_mru(new.montant), el.prenom, el.nom, e.libelle)
      from public.echeances e
      join public.eleves el
        on el.ecole_id = e.ecole_id and el.id = e.eleve_id
      join public.parents_eleves pe
        on pe.eleve_id = el.id
      join public.profils pr
        on pr.id = pe.parent_id
       and pr.ecole_id = new.ecole_id
       and pr.role = 'parent'
       and pr.actif
     where e.ecole_id = new.ecole_id
       and e.id = new.echeance_id;
  exception when others then
    raise warning 'notifier_paiement_confirme (paiement %) : % [%]',
      new.id, sqlerrm, sqlstate;
  end;

  return null;
end;
$$;

create trigger paiements_notifier_confirmation
  after insert or update of statut on public.paiements
  for each row
  when (new.statut = 'confirme')
  execute function public.notifier_paiement_confirme();

-- ---------------------------------------------------------------------
-- 2. Échéance passée en retard -> parents de l'élève
--
-- AFTER UPDATE sans liste de colonnes, filtré par WHEN : le statut est
-- souvent modifié par le trigger BEFORE echeances_statut_auto (suite à
-- un recalcul de montant_paye), et un trigger « UPDATE OF statut » ne se
-- déclencherait pas dans ce cas, statut n'étant pas dans le SET.
-- Pas de notification à l'INSERT : une échéance saisie déjà échue (reprise
-- d'historique) inonderait les parents.
-- ---------------------------------------------------------------------

create or replace function public.notifier_echeance_retard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    insert into public.notifications (ecole_id, user_id, eleve_id, type, message)
    select new.ecole_id,
           pr.id,
           el.id,
           'echeance_retard',
           format('Échéance « %s » de %s %s en retard : %s MRU restent à régler (échue le %s).',
                  new.libelle, el.prenom, el.nom,
                  public.formater_mru(new.montant - new.montant_paye),
                  to_char(new.date_echeance, 'DD/MM/YYYY'))
      from public.eleves el
      join public.parents_eleves pe
        on pe.eleve_id = el.id
      join public.profils pr
        on pr.id = pe.parent_id
       and pr.ecole_id = new.ecole_id
       and pr.role = 'parent'
       and pr.actif
     where el.ecole_id = new.ecole_id
       and el.id = new.eleve_id;
  exception when others then
    raise warning 'notifier_echeance_retard (echeance %) : % [%]',
      new.id, sqlerrm, sqlstate;
  end;

  return null;
end;
$$;

create trigger echeances_notifier_retard
  after update on public.echeances
  for each row
  when (new.statut = 'en_retard' and old.statut is distinct from 'en_retard')
  execute function public.notifier_echeance_retard();

-- Fonctions de trigger : aucune raison d'être appelées directement.
revoke execute on function public.notifier_paiement_confirme() from public, anon, authenticated;
revoke execute on function public.notifier_echeance_retard()   from public, anon, authenticated;
