import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  FileText,
  Pause,
  Play,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { LogoIcone } from '../ui/Logo';

interface SceneStep {
  id: number;
  stepLabel: string;
  roleBadge: string;
  floatingPill: {
    text: string;
    tone: 'blue' | 'amber' | 'emerald';
  };
}

const SCENE_STEPS: SceneStep[] = [
  {
    id: 0,
    stepLabel: '1. Guichet',
    roleBadge: 'Accès Caissier',
    floatingPill: {
      text: 'Référence Bankily saisie',
      tone: 'blue',
    },
  },
  {
    id: 1,
    stepLabel: '2. En attente',
    roleBadge: 'Guichet • Statut',
    floatingPill: {
      text: 'Paiement en attente',
      tone: 'amber',
    },
  },
  {
    id: 2,
    stepLabel: '3. Validation',
    roleBadge: 'Accès Directeur',
    floatingPill: {
      text: 'Confirmé par le directeur',
      tone: 'blue',
    },
  },
  {
    id: 3,
    stepLabel: '4. Reçu PDF',
    roleBadge: 'Dossier élève à jour',
    floatingPill: {
      text: 'Reçu généré',
      tone: 'emerald',
    },
  },
];

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const LandingMockupPreview: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // En mouvement réduit, afficher directement l'état final (étape 4 : reçu généré)
  const [currentStep, setCurrentStep] = useState<number>(() =>
    shouldReduceMotion ? 3 : 0
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(true);

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrentStep(3);
    }
  }, [shouldReduceMotion]);

  // Lecture automatique uniquement lorsque la scène est visible à l'écran
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Boucle lente en 4 temps (arrêtée si pause, hors écran ou prefers-reduced-motion)
  useEffect(() => {
    if (shouldReduceMotion || isPaused || !isInView) return;

    const timer = window.setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % SCENE_STEPS.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, isPaused, isInView]);

  const activeScene = SCENE_STEPS[currentStep] ?? SCENE_STEPS[3];

  const pillToneClasses = {
    blue: 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-800 text-[#1D4ED8] dark:text-blue-300',
    amber:
      'bg-warning-surface border-warning-border text-warning-text',
    emerald:
      'bg-success-surface border-success-border text-success-text',
  }[activeScene.floatingPill.tone];

  return (
    <div
      ref={containerRef}
      aria-label="Scène animée illustrant un encaissement dans EcoSurv (Exemple fictif)"
      className="relative w-full rounded-3xl border border-subtle bg-surface shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      {/* Barre supérieure du cadre d'écran */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-subtle bg-surface-subtle">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 mr-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-border-default" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-default" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-default" />
          </div>
          <LogoIcone size={22} />
          <div>
            <span className="text-sm font-bold text-main block leading-tight">
              EcoSurv
            </span>
            <span className="text-xs text-muted block leading-tight">
              Parcours d'un encaissement scolaire
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-subtle bg-surface text-xs font-semibold text-secondary">
            Exemple fictif
          </span>

          <button
            type="button"
            aria-pressed={isPaused}
            aria-label={
              isPaused
                ? "Reprendre l'animation de démonstration"
                : "Mettre en pause l'animation de démonstration"
            }
            onClick={() => setIsPaused((prev) => !prev)}
            className="min-h-[36px] px-3 py-1.5 rounded-full border border-default bg-surface hover:bg-surface-subtle text-xs font-bold text-main inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 text-[#1D4ED8]" />
                <span>Lecture</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-secondary" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barre des 4 temps du scénario */}
      <div
        role="tablist"
        aria-label="Étapes de la scène de démonstration"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2.5 bg-page-bg border-b border-subtle"
      >
        {SCENE_STEPS.map((step) => {
          const isCurrent = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => {
                setCurrentStep(step.id);
                setIsPaused(true);
              }}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${
                isCurrent
                  ? 'bg-[#1D4ED8] text-white'
                  : isDone
                    ? 'bg-surface text-primary-text border border-subtle'
                    : 'bg-surface-subtle text-muted hover:text-main'
              }`}
            >
              <span className="truncate">{step.stepLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Corps de la scène animée avec pastille flottante */}
      <div className="relative p-4 sm:p-6 bg-surface min-h-[340px] flex flex-col justify-between space-y-4">
        {/* En-tête de contexte + pastille flottante qui apparaît à chaque temps */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-subtle text-xs font-bold text-secondary">
            <User className="h-3.5 w-3.5 text-primary-text" />
            <span>{activeScene.roleBadge}</span>
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={`pill-${activeScene.id}`}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 10, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: -8, scale: 0.96 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.35,
                ease: SMOOTH_EASE,
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-bold shadow-[0_6px_16px_rgba(15,23,42,0.06)] ${pillToneClasses}`}
            >
              {activeScene.id === 1 ? (
                <Clock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{activeScene.floatingPill.text}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fiche de l'élève générique commune aux 4 temps */}
        <div className="rounded-2xl border border-subtle bg-page-bg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center shrink-0">
              ET
            </div>
            <div>
              <p className="text-sm font-bold text-main">
                Élève Test (Exemple)
              </p>
              <p className="text-xs text-muted tabular-nums">
                Classe Démo • Mensualité : 15 000 MRU
              </p>
            </div>
          </div>

          <div className="text-xs font-bold tabular-nums">
            {currentStep === 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface border border-default text-secondary">
                Échéance à régler
              </span>
            )}
            {currentStep === 1 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning-surface border border-warning-border text-warning-text">
                <Clock className="h-3.5 w-3.5" />
                En attente de confirmation
              </span>
            )}
            {currentStep === 2 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-[#1D4ED8] dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Vérification directeur
              </span>
            )}
            {currentStep === 3 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-surface border border-success-border text-success-text">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Solde à jour : 0 MRU
              </span>
            )}
          </div>
        </div>

        {/* Zone centrale qui évolue selon le temps 1, 2, 3 ou 4 */}
        <div className="min-h-[168px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="scene-step-0"
                initial={
                  shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: -10 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  ease: SMOOTH_EASE,
                }}
                className="rounded-2xl border border-subtle bg-surface p-4 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-main flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-primary-text" />
                    Canal choisi au guichet
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-[#1D4ED8] text-white font-bold">
                    Bankily
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-subtle text-xs">
                  <span className="text-muted font-medium">
                    Référence de l'opérateur :
                  </span>
                  <span className="font-bold text-main tabular-nums">
                    TX-BKL-00412 (Exemple)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted">Montant saisi :</span>
                  <span className="font-extrabold text-main tabular-nums">
                    15 000 MRU
                  </span>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="scene-step-1"
                initial={
                  shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: -10 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  ease: SMOOTH_EASE,
                }}
                className="rounded-2xl border border-warning-border bg-warning-surface p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-warning-text flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" />
                    Paiement hors espèces enregistré
                  </span>
                  <span className="text-xs font-bold text-warning-text tabular-nums">
                    15 000 MRU
                  </span>
                </div>
                <p className="text-xs text-main leading-relaxed">
                  Le règlement Bankily (réf.{' '}
                  <strong className="tabular-nums">TX-BKL-00412</strong>) passe
                  automatiquement en statut « en attente de confirmation » pour
                  le directeur.
                </p>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="scene-step-2"
                initial={
                  shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: -10 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  ease: SMOOTH_EASE,
                }}
                className="rounded-2xl border border-subtle bg-surface p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-main flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary-text" />
                    Tableau du directeur • Paiements en attente
                  </span>
                  <span className="text-muted tabular-nums">TX-BKL-00412</span>
                </div>

                <div className="p-3 rounded-xl bg-surface-subtle border border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-main">
                      Élève Test • Bankily • 15 000 MRU
                    </p>
                    <p className="text-muted">
                      Vérification de la référence opérateur
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmé
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="scene-step-3"
                initial={
                  shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: -10 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  ease: SMOOTH_EASE,
                }}
                className="rounded-2xl border border-success-border bg-success-surface p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-success-text flex items-center gap-1.5">
                    <FileText className="h-4 w-4 shrink-0" />
                    Reçu PDF numéroté N° REC-DEMO-001
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-main font-bold tabular-nums">
                    15 000 MRU
                  </span>
                </div>
                <p className="text-xs text-main leading-relaxed">
                  Le paiement est validé, le solde de l'échéance est mis à jour
                  et le reçu PDF numéroté (exemple) est prêt à être remis ou
                  téléchargé.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Barre de progression basse entre les 4 étapes */}
        <div className="pt-2 border-t border-subtle flex items-center justify-between gap-3 text-xs text-muted">
          <span>
            Étape {currentStep + 1} sur {SCENE_STEPS.length}
          </span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {SCENE_STEPS.map((s) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === s.id
                    ? 'w-6 bg-[#1D4ED8]'
                    : 'w-2 bg-border-default'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingMockupPreview;
