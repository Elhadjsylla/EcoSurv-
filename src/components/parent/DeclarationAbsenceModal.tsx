import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CalendarCheck, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DateField } from '../ui/DateField';
import { cn } from '../../lib/utils';
import { DURATION, EASE, useMotionPrefs } from '../../lib/motion';
import {
  LIMITES,
  MOTIFS,
  aujourdhuiLocal,
  ajouterJours,
  bornes,
  creerDeclaration,
  ecartJours,
  validerDeclaration,
  type ChampsDeclaration,
  type MotifAbsence,
} from '../../lib/declarationsAbsence';

export interface EnfantDeclarable {
  id: string;
  prenom: string;
  nom: string;
  classe: string;
}

interface DeclarationAbsenceModalProps {
  open: boolean;
  enfants: EnfantDeclarable[];
  /** Enfant affiché dans la page : présélectionné à l'ouverture. */
  eleveIdInitial: string;
  onClose: () => void;
  /** Appelée uniquement après que la base a confirmé l'insertion. */
  onSent: (eleveId: string) => void;
}

const labelClass = 'mb-1.5 block text-xs font-semibold text-secondary';
const errorClass = 'mt-1.5 flex items-start gap-1.5 text-xs text-danger-text';

export const DeclarationAbsenceModal: React.FC<DeclarationAbsenceModalProps> = (props) => {
  const { reduce } = useMotionPrefs();
  return createPortal(
    <AnimatePresence>
      {props.open && (
        <motion.div
          key="declaration-overlay"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out }}
        >
          <ModalContent {...props} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const ModalContent: React.FC<DeclarationAbsenceModalProps> = ({ enfants, eleveIdInitial, onClose, onSent }) => {
  const { reduce } = useMotionPrefs();
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  // Date du jour dans le fuseau local, calculée une fois à l'ouverture.
  const aujourdhui = useMemo(() => aujourdhuiLocal(), []);
  const { debutMin, finMax } = useMemo(() => bornes(aujourdhui), [aujourdhui]);

  const [eleveId, setEleveId] = useState(
    enfants.some((e) => e.id === eleveIdInitial) ? eleveIdInitial : enfants[0]?.id ?? ''
  );
  const [champs, setChamps] = useState<ChampsDeclaration>({
    date_debut: aujourdhui,
    date_fin: aujourdhui,
    motif: '',
    commentaire: '',
  });
  const [finSuitDebut, setFinSuitDebut] = useState(true);
  const [touches, setTouches] = useState<Partial<Record<keyof ChampsDeclaration, boolean>>>({});
  const [tentative, setTentative] = useState(false);
  const [envoi, setEnvoi] = useState<'repos' | 'envoi' | 'echec'>('repos');
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  const enCours = envoi === 'envoi';
  const erreurs = validerDeclaration(champs, aujourdhui);
  const visible = (k: keyof ChampsDeclaration) => (tentative || touches[k] ? erreurs[k] : undefined);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Focus à l'ouverture, retour du focus au bouton d'origine à la fermeture, défilement d'arrière-plan bloqué.
  useEffect(() => {
    const origine = document.activeElement as HTMLElement | null;
    const overflowAvant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflowAvant;
      origine?.focus?.({ preventScroll: true });
    };
  }, []);

  const fermer = () => {
    if (!enCours) onClose();
  };

  // Échap ferme la fenêtre (écouteur global : le focus peut être sur le corps de page après un bouton désactivé).
  const fermerRef = useRef(fermer);
  fermerRef.current = fermer;
  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // Si un menu de choix est ouvert, Échap ne ferme que ce menu.
      if (panelRef.current?.querySelector('[aria-expanded="true"]')) return;
      fermerRef.current();
    };
    window.addEventListener('keydown', surEchap);
    return () => window.removeEventListener('keydown', surEchap);
  }, []);

  // Après un échec, le bouton d'envoi était désactivé : on rend le focus à la fenêtre.
  useEffect(() => {
    if (envoi === 'echec') panelRef.current?.focus({ preventScroll: true });
  }, [envoi]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) return;
    const premier = focusables[0];
    const dernier = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === premier || document.activeElement === panelRef.current)) {
      e.preventDefault();
      dernier.focus();
    } else if (!e.shiftKey && document.activeElement === dernier) {
      e.preventDefault();
      premier.focus();
    }
  };

  const changerDebut = (v: string) => {
    setTouches((t) => ({ ...t, date_debut: true }));
    setChamps((c) => {
      const suit = finSuitDebut || (v !== '' && c.date_fin !== '' && c.date_fin < v);
      return { ...c, date_debut: v, date_fin: suit && v ? v : c.date_fin };
    });
  };

  const changerFin = (v: string) => {
    setFinSuitDebut(false);
    setTouches((t) => ({ ...t, date_fin: true }));
    setChamps((c) => ({ ...c, date_fin: v }));
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enCours) return;
    setTentative(true);
    if (Object.keys(erreurs).length > 0 || !eleveId || !champs.motif) {
      panelRef.current?.querySelector<HTMLElement>('[data-erreur="true"]')?.scrollIntoView({ block: 'center' });
      return;
    }
    setEnvoi('envoi');
    setErreurServeur(null);
    try {
      await creerDeclaration({
        eleve_id: eleveId,
        date_debut: champs.date_debut,
        date_fin: champs.date_fin,
        motif: champs.motif as MotifAbsence,
        commentaire: champs.commentaire,
      });
      if (mounted.current) onSent(eleveId);
    } catch (err) {
      if (!mounted.current) return;
      setErreurServeur(err instanceof Error ? err.message : 'La déclaration n’a pas pu être enregistrée.');
      setEnvoi('echec');
    }
  };

  const enfant = enfants.find((e) => e.id === eleveId);
  const finMaxEffectif = (() => {
    if (!champs.date_debut) return finMax;
    const plafond = ajouterJours(champs.date_debut, LIMITES.ecartMaxJours);
    return plafond < finMax ? plafond : finMax;
  })();
  const jours = champs.date_debut && champs.date_fin ? ecartJours(champs.date_debut, champs.date_fin) + 1 : 0;
  const reste = LIMITES.commentaire - champs.commentaire.length;

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-titre`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out }}
      className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-lg border border-subtle bg-surface-elevated shadow-elevated focus:outline-none sm:max-h-[92dvh] sm:max-w-lg sm:rounded-lg"
    >
      <div className="flex items-start justify-between gap-3 border-b border-subtle px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-subtle bg-surface-subtle text-primary-text">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={`${uid}-titre`} className="text-base font-bold text-main">
              Déclarer une absence
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {enfant ? `Pour ${enfant.prenom} ${enfant.nom}` : 'Choisissez un enfant'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fermer}
          disabled={enCours}
          aria-label="Fermer"
          className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-subtle hover:text-main focus-halo disabled:opacity-50"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={soumettre} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {enfants.length > 1 && (
            <div>
              <label htmlFor={`${uid}-enfant`} className={labelClass}>
                Enfant concerné
              </label>
              <Select
                id={`${uid}-enfant`}
                value={eleveId}
                onChange={setEleveId}
                options={enfants.map((e) => ({ value: e.id, label: `${e.prenom} ${e.nom}` }))}
                size="md"
                triggerClassName="w-full"
                disabled={enCours}
              />
            </div>
          )}

          <div className="grid gap-5">
            <div data-erreur={visible('date_debut') ? 'true' : undefined}>
              <span id={`${uid}-du`} className={labelClass}>
                Du
              </span>
              <DateField
                id={`${uid}-debut`}
                groupLabel="Premier jour d’absence"
                value={champs.date_debut}
                onChange={changerDebut}
                minDate={debutMin}
                maxDate={finMax}
                disabled={enCours}
                error={visible('date_debut')}
              />
            </div>
            <div data-erreur={visible('date_fin') ? 'true' : undefined}>
              <span id={`${uid}-au`} className={labelClass}>
                Au <span className="font-normal text-muted">(même jour si l’absence ne dure qu’un jour)</span>
              </span>
              <DateField
                id={`${uid}-fin`}
                groupLabel="Dernier jour d’absence"
                value={champs.date_fin}
                onChange={changerFin}
                minDate={champs.date_debut || debutMin}
                maxDate={finMaxEffectif}
                disabled={enCours}
                error={visible('date_fin')}
              />
              {jours > 0 && !erreurs.date_fin && (
                <p className="mt-1.5 text-xs text-muted">
                  {jours === 1 ? '1 jour' : `${jours} jours`}
                </p>
              )}
            </div>
          </div>

          <fieldset data-erreur={visible('motif') ? 'true' : undefined} disabled={enCours}>
            <legend className={labelClass}>Motif</legend>
            <div role="radiogroup" aria-label="Motif de l’absence" className="grid grid-cols-2 gap-2">
              {MOTIFS.map((m) => {
                const actif = champs.motif === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={actif}
                    onClick={() => setChamps((c) => ({ ...c, motif: m.value }))}
                    className={cn(
                      'min-h-[44px] rounded-md border px-3 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 focus-halo active:scale-[0.98] disabled:opacity-50',
                      actif
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-default bg-surface text-secondary hover:bg-surface-subtle hover:text-main'
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            {visible('motif') && (
              <p className={errorClass}>
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{erreurs.motif}</span>
              </p>
            )}
          </fieldset>

          <div data-erreur={visible('commentaire') ? 'true' : undefined}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor={`${uid}-commentaire`} className="text-xs font-semibold text-secondary">
                Commentaire <span className="font-normal text-muted">(facultatif)</span>
              </label>
              <span
                className={cn('text-[11px] tabular-nums', reste < 0 ? 'text-danger-text' : 'text-muted')}
                aria-live="off"
              >
                {champs.commentaire.length}/{LIMITES.commentaire}
              </span>
            </div>
            <textarea
              id={`${uid}-commentaire`}
              rows={3}
              maxLength={LIMITES.commentaire}
              value={champs.commentaire}
              disabled={enCours}
              onChange={(e) => setChamps((c) => ({ ...c, commentaire: e.target.value }))}
              onBlur={() => setTouches((t) => ({ ...t, commentaire: true }))}
              className="w-full resize-none rounded-md border border-default bg-surface-input px-3 py-2 text-sm text-main focus-halo focus:border-primary disabled:opacity-60"
            />
            {visible('commentaire') && (
              <p className={errorClass}>
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{erreurs.commentaire}</span>
              </p>
            )}
          </div>

          {envoi === 'echec' && erreurServeur && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface px-3 py-2.5 text-sm text-danger-text"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{erreurServeur}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-subtle px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={fermer} disabled={enCours}>
            Annuler
          </Button>
          <Button type="submit" loading={enCours} loadingText="Envoi en cours…">
            {envoi === 'echec' ? 'Réessayer' : 'Envoyer la déclaration'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
