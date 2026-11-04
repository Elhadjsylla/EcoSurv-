import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CalendarPlus, FileText, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../admin/adminUi';
import { cn } from '../../lib/utils';
import { DURATION, EASE, staggerDelay, useMotionPrefs } from '../../lib/motion';
import {
  MOTIFS,
  STATUT_LABEL,
  formatPeriode,
  listerDeclarations,
  retirerDeclaration,
  type DeclarationAbsence,
  type StatutDeclaration,
} from '../../lib/declarationsAbsence';

interface MesDeclarationsProps {
  eleveId: string;
  eleveNom: string;
  /** Change à chaque envoi réussi : force le rechargement depuis la base. */
  rechargement: number;
  onDeclarer: () => void;
  onNotice: (message: string, type: 'success' | 'error') => void;
}

const PASTILLE: Record<StatutDeclaration, string> = {
  en_attente: 'border-warning-border bg-warning-surface text-warning-text',
  acceptee: 'border-success-border bg-success-surface text-success-text',
  refusee: 'border-danger-border bg-danger-surface text-danger-text',
};

const motifLabel = (m: string) => MOTIFS.find((x) => x.value === m)?.label ?? m;

export const MesDeclarations: React.FC<MesDeclarationsProps> = ({
  eleveId,
  eleveNom,
  rechargement,
  onDeclarer,
  onNotice,
}) => {
  const { reduce } = useMotionPrefs();
  const [etat, setEtat] = useState<'chargement' | 'pret' | 'erreur'>('chargement');
  const [erreur, setErreur] = useState('');
  const [liste, setListe] = useState<DeclarationAbsence[]>([]);
  const [aRetirer, setARetirer] = useState<DeclarationAbsence | null>(null);
  const derniereRequete = useRef(0);

  const charger = useCallback(
    async (silencieux = false) => {
      const numero = ++derniereRequete.current;
      if (!silencieux) setEtat('chargement');
      try {
        const lignes = await listerDeclarations(eleveId);
        if (numero !== derniereRequete.current) return; // une requête plus récente a pris le relais
        setListe(lignes);
        setEtat('pret');
      } catch (e) {
        if (numero !== derniereRequete.current) return;
        setErreur(e instanceof Error ? e.message : 'Impossible de charger les déclarations pour le moment.');
        setEtat('erreur');
      }
    },
    [eleveId]
  );

  useEffect(() => {
    void charger();
  }, [charger, rechargement]);

  return (
    <Card className="rounded-md p-5 sm:p-6" aria-labelledby="mes-declarations-titre" role="region">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-subtle pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-subtle bg-surface-subtle text-primary-text">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 id="mes-declarations-titre" className="text-base font-bold text-main">
              Mes déclarations
            </h3>
            <p className="truncate text-xs text-muted">Absences que vous avez signalées pour {eleveNom}</p>
          </div>
        </div>
      </div>

      {etat === 'chargement' && (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des déclarations">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md border border-subtle p-4">
              <Skeleton className="mb-3 h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {etat === 'erreur' && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-danger-border bg-danger-surface p-4">
          <div className="flex items-start gap-2 text-sm text-danger-text">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{erreur}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void charger()}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Réessayer
          </Button>
        </div>
      )}

      {etat === 'pret' && liste.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
          <p className="text-sm font-semibold text-main">Aucune déclaration pour le moment</p>
          <p className="max-w-xs text-xs text-muted">
            Si {eleveNom} doit s’absenter, prévenez l’école ici : elle recevra votre déclaration.
          </p>
          <Button size="sm" onClick={onDeclarer}>
            <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Déclarer une absence
          </Button>
        </div>
      )}

      {etat === 'pret' && liste.length > 0 && (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {liste.map((d, i) => (
              <motion.li
                key={d.id}
                layout={reduce ? false : 'position'}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: reduce ? 0 : DURATION.fast } }}
                transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out, delay: reduce ? 0 : staggerDelay(i) }}
                className="rounded-md border border-subtle bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-main">{capitaliser(formatPeriode(d.date_debut, d.date_fin))}</p>
                    <p className="mt-0.5 text-xs text-muted">Motif : {motifLabel(d.motif)}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      PASTILLE[d.statut]
                    )}
                  >
                    {STATUT_LABEL[d.statut] ?? d.statut}
                  </span>
                </div>

                {d.commentaire && (
                  <p className="mt-3 break-words text-sm text-secondary">{d.commentaire}</p>
                )}

                {d.reponse && (
                  <div className="mt-3 rounded-md border border-subtle bg-surface-subtle px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Réponse de l’école</p>
                    <p className="mt-0.5 break-words text-sm text-main">{d.reponse}</p>
                  </div>
                )}

                {d.statut === 'en_attente' && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setARetirer(d)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Retirer
                    </Button>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ConfirmerRetrait
        declaration={aRetirer}
        onAnnuler={() => setARetirer(null)}
        onRetirer={async (d) => {
          await retirerDeclaration(d.id);
          setARetirer(null);
          await charger(true);
          onNotice('Déclaration retirée.', 'success');
        }}
        onDejaTraitee={async (message) => {
          setARetirer(null);
          await charger(true);
          onNotice(message, 'error');
        }}
      />
    </Card>
  );
};

const capitaliser = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

interface ConfirmerRetraitProps {
  declaration: DeclarationAbsence | null;
  onAnnuler: () => void;
  onRetirer: (d: DeclarationAbsence) => Promise<void>;
  onDejaTraitee: (message: string) => Promise<void>;
}

/** Petite fenêtre de confirmation (aucun window.confirm). */
const ConfirmerRetrait: React.FC<ConfirmerRetraitProps> = ({ declaration, onAnnuler, onRetirer, onDejaTraitee }) => {
  const { reduce } = useMotionPrefs();
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setEnCours(false);
    setErreur(null);
  }, [declaration?.id]);

  useEffect(() => {
    if (!declaration) return;
    const origine = document.activeElement as HTMLElement | null;
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = avant;
      origine?.focus?.({ preventScroll: true });
    };
  }, [declaration]);

  const confirmer = async () => {
    if (!declaration || enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      await onRetirer(declaration);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Le retrait n’a pas pu être effectué.';
      setErreur(message);
      setEnCours(false);
      // Ligne absente : la déclaration a changé de statut. On rafraîchit la liste en arrière-plan.
      if (message.startsWith('Cette déclaration n’est plus en attente')) void onDejaTraitee(message);
    }
  };

  const annulerRef = useRef({ enCours, onAnnuler });
  annulerRef.current = { enCours, onAnnuler };
  useEffect(() => {
    if (!declaration) return;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !annulerRef.current.enCours) annulerRef.current.onAnnuler();
    };
    window.addEventListener('keydown', surEchap);
    return () => window.removeEventListener('keydown', surEchap);
  }, [declaration]);

  useEffect(() => {
    if (erreur) panelRef.current?.focus({ preventScroll: true });
  }, [erreur]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && panelRef.current) {
      const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (f.length === 0) return;
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault();
        f[0].focus();
      }
    }
  };

  return createPortal(
    <AnimatePresence>
      {declaration && (
        <motion.div
          key="retrait-overlay"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out }}
        >
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${uid}-t`}
            aria-describedby={`${uid}-d`}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : DURATION.base, ease: EASE.out }}
            className="w-full max-w-sm rounded-lg border border-subtle bg-surface-elevated p-5 shadow-elevated focus:outline-none"
          >
            <h2 id={`${uid}-t`} className="text-base font-bold text-main">
              Retirer cette déclaration ?
            </h2>
            <p id={`${uid}-d`} className="mt-2 text-sm text-secondary">
              {formatPeriode(declaration.date_debut, declaration.date_fin)} : l’école ne la verra plus. Vous pourrez en faire une nouvelle.
            </p>
            {erreur && (
              <div role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface px-3 py-2 text-sm text-danger-text">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{erreur}</span>
              </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onAnnuler} disabled={enCours}>
                Garder la déclaration
              </Button>
              <Button variant="danger" onClick={() => void confirmer()} loading={enCours} loadingText="Retrait…">
                {erreur ? 'Réessayer' : 'Retirer'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
