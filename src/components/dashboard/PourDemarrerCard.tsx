import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Circle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { supabase } from '../../lib/supabase';

export type OnboardingStepId =
  | 'profil'
  | 'classes'
  | 'frais'
  | 'eleve'
  | 'personnel'
  | 'paiement';

const VALID_STEP_IDS: OnboardingStepId[] = [
  'profil',
  'classes',
  'frais',
  'eleve',
  'personnel',
  'paiement',
];

export const CONFIG_SCROLL_TARGET_KEY = 'ecosurv:config-scroll-target';

interface StepCounts {
  classesActives: number;
  baremesAnnee: number;
  elevesActifs: number;
  personnel: number;
  paiements: number;
}

interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  actionLabel: string;
  completed: boolean;
  onAction: () => void;
}

function readIgnoredSteps(storageKey: string): OnboardingStepId[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is OnboardingStepId =>
      VALID_STEP_IDS.includes(id as OnboardingStepId)
    );
  } catch {
    return [];
  }
}

function writeIgnoredSteps(storageKey: string, stepIds: OnboardingStepId[]): void {
  try {
    if (stepIds.length === 0) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(stepIds));
    }
  } catch {
    // Fonctionne en mémoire même si localStorage est indisponible
  }
}

export const PourDemarrerCard: React.FC = () => {
  const authProfile = useAuthStore((s) => s.profile);
  const authEcole = useAuthStore((s) => s.ecole);
  const navigate = useNavigationStore((s) => s.navigate);

  const isDirecteur = authProfile?.role === 'directeur';
  const ecoleId = authProfile?.ecole_id || '';
  const userId = authProfile?.id || '';

  const storageKey = useMemo(
    () => (ecoleId && userId ? `ecosurv:demarrer:${ecoleId}:${userId}` : ''),
    [ecoleId, userId]
  );

  const [ignoredStepIds, setIgnoredStepIds] = useState<OnboardingStepId[]>([]);
  const [counts, setCounts] = useState<StepCounts | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Charger les étapes ignorées depuis localStorage
  useEffect(() => {
    if (!isDirecteur || !storageKey) {
      setIgnoredStepIds([]);
      return;
    }
    setIgnoredStepIds(readIgnoredSteps(storageKey));
  }, [isDirecteur, storageKey]);

  const anneeScolaire = authEcole?.annee_scolaire?.trim() || '';

  // Requêtes légères de comptage (une par table, filtrées sur ecole_id)
  const fetchStepCounts = useCallback(async () => {
    if (!isDirecteur || !ecoleId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const [classesRes, baremesRes, elevesRes, profilsRes, paiementsRes] =
        await Promise.all([
          supabase
            .from('classes_ecole')
            .select('id', { count: 'exact', head: true })
            .eq('ecole_id', ecoleId)
            .eq('actif', true),
          supabase
            .from('baremes_echeances')
            .select('id', { count: 'exact', head: true })
            .eq('ecole_id', ecoleId)
            .eq('annee_scolaire', anneeScolaire),
          supabase
            .from('eleves')
            .select('id', { count: 'exact', head: true })
            .eq('ecole_id', ecoleId)
            .eq('actif', true),
          supabase
            .from('profils')
            .select('id', { count: 'exact', head: true })
            .eq('ecole_id', ecoleId)
            .in('role', ['caissier', 'enseignant']),
          supabase
            .from('paiements')
            .select('id', { count: 'exact', head: true })
            .eq('ecole_id', ecoleId),
        ]);

      const queryChecks = [
        { table: 'classes_ecole', error: classesRes.error },
        { table: 'baremes_echeances', error: baremesRes.error },
        { table: 'eleves', error: elevesRes.error },
        { table: 'profils', error: profilsRes.error },
        { table: 'paiements', error: paiementsRes.error },
      ];

      const failed = queryChecks.find((item) => item.error !== null);
      if (failed && failed.error) {
        console.error(
          `[PourDemarrerCard] Erreur de comptage sur ${failed.table} (code: ${failed.error.code || 'inconnu'}): ${failed.error.message}`
        );
        setHasError(true);
        setCounts(null);
        setIsLoading(false);
        return;
      }

      setCounts({
        classesActives: classesRes.count ?? 0,
        baremesAnnee: anneeScolaire ? (baremesRes.count ?? 0) : 0,
        elevesActifs: elevesRes.count ?? 0,
        personnel: profilsRes.count ?? 0,
        paiements: paiementsRes.count ?? 0,
      });
    } catch (err: any) {
      console.error(
        `[PourDemarrerCard] Exception lors du comptage (code: ${err?.code || 'inconnu'}): ${err?.message || String(err)}`
      );
      setHasError(true);
      setCounts(null);
    } finally {
      setIsLoading(false);
    }
  }, [isDirecteur, ecoleId, anneeScolaire]);

  useEffect(() => {
    if (!isDirecteur || !ecoleId) return;
    fetchStepCounts();

    const handleRefresh = () => {
      fetchStepCounts();
    };

    window.addEventListener('ecosurv:classes-changed', handleRefresh);
    window.addEventListener('ecosurv:finances-updated', handleRefresh);
    window.addEventListener('ecosurv:pending-payments-changed', handleRefresh);
    return () => {
      window.removeEventListener('ecosurv:classes-changed', handleRefresh);
      window.removeEventListener('ecosurv:finances-updated', handleRefresh);
      window.removeEventListener('ecosurv:pending-payments-changed', handleRefresh);
    };
  }, [isDirecteur, ecoleId, fetchStepCounts]);

  const navigateToConfigSection = useCallback(
    (sectionId: string) => {
      try {
        window.sessionStorage.setItem(CONFIG_SCROLL_TARGET_KEY, sectionId);
      } catch {
        // Ignorer si sessionStorage est indisponible
      }
      navigate('config');
    },
    [navigate]
  );

  const isProfilDone = Boolean(
    authEcole?.annee_scolaire?.trim() &&
      authEcole?.ville?.trim() &&
      authEcole?.telephone?.trim()
  );

  const steps: OnboardingStep[] = useMemo(() => {
    if (!counts) return [];
    return [
      {
        id: 'profil',
        title: "Profil de l'école",
        description:
          "Renseignez l'année scolaire, la ville et le téléphone de l'établissement.",
        actionLabel: 'Compléter le profil',
        completed: isProfilDone,
        onAction: () => navigateToConfigSection('section-profil-ecole'),
      },
      {
        id: 'classes',
        title: 'Classes',
        description:
          'Ajoutez au moins une classe active pour organiser vos élèves.',
        actionLabel: 'Configurer les classes',
        completed: counts.classesActives >= 1,
        onAction: () => navigateToConfigSection('section-classes-ecole'),
      },
      {
        id: 'frais',
        title: 'Frais de scolarité',
        description:
          "Créez au moins un barème d'échéances pour l'année scolaire de l'école.",
        actionLabel: 'Définir les frais',
        completed: Boolean(anneeScolaire) && counts.baremesAnnee >= 1,
        onAction: () => navigate('echeances'),
      },
      {
        id: 'eleve',
        title: 'Premier élève',
        description:
          'Inscrivez votre premier élève actif dans le registre scolaire.',
        actionLabel: 'Inscrire un élève',
        completed: counts.elevesActifs >= 1,
        onAction: () => navigate('eleves'),
      },
      {
        id: 'personnel',
        title: 'Personnel',
        description:
          'Invitez au moins un caissier ou un enseignant dans votre établissement.',
        actionLabel: 'Gérer le personnel',
        completed: counts.personnel >= 1,
        onAction: () => navigateToConfigSection('section-personnel-ecole'),
      },
      {
        id: 'paiement',
        title: 'Premier paiement',
        description:
          "Enregistrez un premier paiement de scolarité pour l'établissement.",
        actionLabel: 'Ouvrir les échéances',
        completed: counts.paiements >= 1,
        onAction: () => navigate('echeances'),
      },
    ];
  }, [counts, isProfilDone, anneeScolaire, navigate, navigateToConfigSection]);

  const handleIgnoreStep = (stepId: OnboardingStepId) => {
    setIgnoredStepIds((prev) => {
      if (prev.includes(stepId)) return prev;
      const next = [...prev, stepId];
      if (storageKey) {
        writeIgnoredSteps(storageKey, next);
      }
      return next;
    });
  };

  const handleShowIgnoredSteps = () => {
    setIgnoredStepIds([]);
    if (storageKey) {
      writeIgnoredSteps(storageKey, []);
    }
  };

  // Visible uniquement pour le directeur ; masquée pendant le chargement ou en cas d'erreur de requête
  if (!isDirecteur || !ecoleId || isLoading || hasError || !counts) {
    return null;
  }

  // La carte disparaît quand chaque étape est soit terminée soit ignorée
  const allDoneOrIgnored = steps.every(
    (step) => step.completed || ignoredStepIds.includes(step.id)
  );
  if (allDoneOrIgnored) {
    return null;
  }

  const completedCount = steps.filter((step) => step.completed).length;
  const ignoredPendingSteps = steps.filter(
    (step) => !step.completed && ignoredStepIds.includes(step.id)
  );
  const visibleSteps = steps.filter(
    (step) => step.completed || !ignoredStepIds.includes(step.id)
  );
  const firstPendingStep = visibleSteps.find((step) => !step.completed);
  const progressPercent = Math.round((completedCount / 6) * 100);

  return (
    <section
      aria-label="Pour démarrer"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5"
    >
      {/* En-tête et barre de progression */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Pour démarrer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Configurez les éléments essentiels de votre établissement.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            {completedCount} étapes sur 6
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={6}
          aria-label={`${completedCount} étapes sur 6`}
          className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-[#1D4ED8] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Liste des étapes */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800">
        {visibleSteps.map((step) => {
          const isPrimaryAction =
            !step.completed && firstPendingStep?.id === step.id;

          return (
            <div
              key={step.id}
              className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                    step.completed
                      ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                  }`}
                  aria-hidden="true"
                >
                  {step.completed ? (
                    <Check className="h-3 w-3 stroke-[2.5]" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {step.completed ? 'Terminée' : 'À faire'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                {!step.completed && (
                  <button
                    type="button"
                    onClick={() => handleIgnoreStep(step.id)}
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline px-2 py-2 cursor-pointer"
                  >
                    Ignorer
                  </button>
                )}

                <button
                  type="button"
                  onClick={step.onAction}
                  className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isPrimaryAction
                      ? 'bg-[#1D4ED8] hover:bg-blue-800 text-white border border-[#1D4ED8]'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {step.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lien discret pour réafficher les étapes ignorées */}
      {ignoredPendingSteps.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleShowIgnoredSteps}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer py-1"
          >
            Afficher les étapes ignorées
          </button>
        </div>
      )}
    </section>
  );
};

