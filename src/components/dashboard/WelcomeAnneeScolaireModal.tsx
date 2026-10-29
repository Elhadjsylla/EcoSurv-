import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  anneeScolaireSuggeree,
  getAnneeScolaireOptions,
} from '../../lib/constants/scolaire';
import { updateAnneeScolaireEcole } from '../../lib/ecole';

export interface WelcomeAnneeScolaireModalProps {
  /** Permet à la carte « Pour démarrer » de rouvrir explicitement la fenêtre. */
  forceOpen?: boolean;
  onCloseForceOpen?: () => void;
  /** Appelé après confirmation réussie en base (pour afficher le toast et rafraîchir). */
  onConfirmed?: (anneeScolaire: string) => void;
}

function readDismissedForSession(storageKey: string): boolean {
  if (!storageKey) return false;
  try {
    return window.sessionStorage.getItem(storageKey) === '1';
  } catch {
    return false;
  }
}

function writeDismissedForSession(storageKey: string): void {
  if (!storageKey) return;
  try {
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
    // Fonctionne en mémoire même si sessionStorage est indisponible
  }
}

export const WelcomeAnneeScolaireModal: React.FC<
  WelcomeAnneeScolaireModalProps
> = ({ forceOpen = false, onCloseForceOpen, onConfirmed }) => {
  const authUser = useAuthStore((s) => s.user);
  const authProfile = useAuthStore((s) => s.profile);
  const authEcole = useAuthStore((s) => s.ecole);

  const isDirecteur = authProfile?.role === 'directeur';
  const ecoleId = authProfile?.ecole_id || authEcole?.id || '';
  const userId = authProfile?.id || '';
  const signInStamp = authUser?.last_sign_in_at || 'current';
  const currentAnnee = authEcole?.annee_scolaire?.trim() || '';

  const storageKey = useMemo(
    () =>
      ecoleId && userId
        ? `ecosurv:welcome-annee:${ecoleId}:${userId}:${signInStamp}`
        : '',
    [ecoleId, userId, signInStamp]
  );

  const [dismissedInSession, setDismissedInSession] = useState<boolean>(false);
  const [selectedAnnee, setSelectedAnnee] = useState<string>(() =>
    anneeScolaireSuggeree()
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{
    code: string;
    message: string;
  } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const options = useMemo(() => getAnneeScolaireOptions(), []);

  useEffect(() => {
    if (!isDirecteur || !storageKey) {
      setDismissedInSession(false);
      return;
    }
    setDismissedInSession(readDismissedForSession(storageKey));
  }, [isDirecteur, storageKey]);

  const isOpen = Boolean(
    isDirecteur &&
      authEcole &&
      ecoleId &&
      !currentAnnee &&
      (forceOpen || !dismissedInSession)
  );

  // Réinitialiser la sélection sur l'année suggérée et effacer l'erreur à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSelectedAnnee(anneeScolaireSuggeree());
      setErrorInfo(null);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    if (isSubmitting) return;
    setDismissedInSession(true);
    writeDismissedForSession(storageKey);
    setErrorInfo(null);
    if (onCloseForceOpen) {
      onCloseForceOpen();
    }
  };

  // Piège de focus (focus trap), touche Échap et restauration du focus à la fermeture
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const rafId = window.requestAnimationFrame(() => {
      selectRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!isSubmitting) {
          handleDismiss();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'select:not([disabled]), button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === first || !dialogRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !dialogRef.current.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function'
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !ecoleId) return;

    setIsSubmitting(true);
    setErrorInfo(null);

    const result = await updateAnneeScolaireEcole(ecoleId, selectedAnnee);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorInfo({
        code: result.error?.code || 'BDD',
        message:
          result.error?.message ||
          "Impossible d'enregistrer l'année scolaire.",
      });
      return;
    }

    if (onCloseForceOpen) {
      onCloseForceOpen();
    }
    if (onConfirmed) {
      onConfirmed(result.data?.annee_scolaire || selectedAnnee);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-annee-modal-title"
        aria-describedby="welcome-annee-modal-desc"
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <h2
            id="welcome-annee-modal-title"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
          >
            Bienvenue
          </h2>
          <p
            id="welcome-annee-modal-desc"
            className="text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            Quelle année scolaire gérez-vous ?
          </p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-5">
          <div>
            <label
              htmlFor="welcome-annee-scolaire-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Année scolaire
            </label>
            <select
              ref={selectRef}
              id="welcome-annee-scolaire-select"
              value={selectedAnnee}
              disabled={isSubmitting}
              onChange={(e) => setSelectedAnnee(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] cursor-pointer disabled:opacity-60"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {errorInfo && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  Erreur ({errorInfo.code})
                </p>
                <p>{errorInfo.message}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDismiss}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Plus tard
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#1D4ED8] hover:bg-blue-800 text-white border border-[#1D4ED8] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Confirmer l'année</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

