import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { DURATION, EASE, useMotionPrefs } from '../../lib/motion';
import { formatPeriode } from '../../lib/declarationsAbsence';
import {
  DejaTraiteeError,
  LIMITE_REPONSE,
  traiterDeclaration,
  type DeclarationEcole,
} from '../../lib/declarationsEcole';

export type ActionTraitement = 'acceptee' | 'refusee';

interface Props {
  declaration: DeclarationEcole | null;
  action: ActionTraitement;
  onClose: () => void;
  /** La base a confirmé le traitement (ligne retournée). */
  onTraitee: () => void;
  /** La base n'a modifié aucune ligne : déjà traitée ou plus modifiable. */
  onDejaTraitee: (message: string) => void;
}

const TITRE: Record<ActionTraitement, string> = {
  acceptee: 'Accepter cette déclaration ?',
  refusee: 'Refuser cette déclaration ?',
};

export const TraiterDeclarationModal: React.FC<Props> = ({ declaration, action, onClose, onTraitee, onDejaTraitee }) => {
  const { reduce } = useMotionPrefs();
  return createPortal(
    <AnimatePresence>
      {declaration && (
        <motion.div
          key="traiter-overlay"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out }}
        >
          <Contenu
            key={declaration.id + action}
            declaration={declaration}
            action={action}
            onClose={onClose}
            onTraitee={onTraitee}
            onDejaTraitee={onDejaTraitee}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const Contenu: React.FC<Omit<Props, 'declaration'> & { declaration: DeclarationEcole }> = ({
  declaration,
  action,
  onClose,
  onTraitee,
  onDejaTraitee,
}) => {
  const { reduce } = useMotionPrefs();
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const [mot, setMot] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    const origine = document.activeElement as HTMLElement | null;
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      mounted.current = false;
      document.body.style.overflow = avant;
      origine?.focus?.({ preventScroll: true });
    };
  }, []);

  const etat = useRef({ enCours, onClose });
  etat.current = { enCours, onClose };
  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !etat.current.enCours) etat.current.onClose();
    };
    window.addEventListener('keydown', surEchap);
    return () => window.removeEventListener('keydown', surEchap);
  }, []);

  useEffect(() => {
    if (erreur) panelRef.current?.focus({ preventScroll: true });
  }, [erreur]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled])'));
    if (f.length === 0) return;
    if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === panelRef.current)) {
      e.preventDefault();
      f[f.length - 1].focus();
    } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
      e.preventDefault();
      f[0].focus();
    }
  };

  const confirmer = async () => {
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      await traiterDeclaration(declaration.id, action, mot);
      if (mounted.current) onTraitee();
    } catch (e) {
      if (!mounted.current) return;
      if (e instanceof DejaTraiteeError) {
        onDejaTraitee(e.message);
        return;
      }
      setErreur(e instanceof Error && e.message ? e.message : 'Le traitement n’a pas pu être enregistré.');
      setEnCours(false);
    }
  };

  const nom = declaration.eleve ? `${declaration.eleve.prenom} ${declaration.eleve.nom}` : 'cet élève';
  const accepter = action === 'acceptee';

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-t`}
      aria-describedby={`${uid}-d`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out }}
      className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-subtle bg-surface-elevated p-5 shadow-elevated focus:outline-none"
    >
      <h2 id={`${uid}-t`} className="text-base font-bold text-main">
        {TITRE[action]}
      </h2>
      <p id={`${uid}-d`} className="mt-2 text-sm text-secondary">
        {nom} : {formatPeriode(declaration.date_debut, declaration.date_fin)}.{' '}
        {accepter ? 'Le parent verra que l’absence est acceptée.' : 'Le parent verra que la déclaration est refusée.'}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={`${uid}-mot`} className="text-xs font-semibold text-secondary">
            Mot pour le parent <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <span className="text-[11px] tabular-nums text-muted">
            {mot.length}/{LIMITE_REPONSE}
          </span>
        </div>
        <textarea
          id={`${uid}-mot`}
          rows={3}
          maxLength={LIMITE_REPONSE}
          value={mot}
          disabled={enCours}
          onChange={(e) => setMot(e.target.value)}
          className="w-full resize-none rounded-md border border-default bg-surface-input px-3 py-2 text-sm text-main focus-halo focus:border-primary disabled:opacity-60"
        />
      </div>

      {erreur && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface px-3 py-2 text-sm text-danger-text">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={enCours}>
          Annuler
        </Button>
        <Button onClick={() => void confirmer()} loading={enCours} loadingText="Enregistrement…">
          {erreur ? 'Réessayer' : accepter ? 'Accepter la déclaration' : 'Refuser la déclaration'}
        </Button>
      </div>
    </motion.div>
  );
};
