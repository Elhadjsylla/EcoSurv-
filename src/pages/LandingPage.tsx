import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import {
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  AlertCircle,
  Clock,
  Calculator,
  Users,
  CreditCard,
  Receipt,
  Check,
  ArrowRight,
  Pause,
  Play,
  FileText,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { Logo } from '../components/ui/Logo';
import { LandingMockupPreview } from '../components/landing/LandingMockupPreview';
import bankilyLogo from '../assets/payments/bankily.jpg';
import masrviLogo from '../assets/payments/masrvi.png';
import sedadLogo from '../assets/payments/sedad.png';

type SectionId = 'constat' | 'solution' | 'tarifs' | 'questions';

const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: 'constat', label: 'Le constat' },
  { id: 'solution', label: 'La solution' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'questions', label: 'Questions' },
];

const HERO_TYPED_PHRASES = [
  'du guichet au reçu PDF.',
  "avec la référence de l'opérateur.",
  'confirmé par le directeur.',
] as const;

// Phrase la plus longue : sa copie invisible réserve la hauteur de la ligne tapée,
// pour que le titre ne change jamais de hauteur pendant la frappe.
const HERO_LONGEST_PHRASE = HERO_TYPED_PHRASES.reduce<string>(
  (longest, phrase) => (phrase.length > longest.length ? phrase : longest),
  ''
);

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// 3 cartes « Le constat » : titre court + UNE phrase de 15 mots maximum chacune
const CONSTAT_CARDS = [
  {
    icon: AlertCircle,
    title: "Savoir qui doit encore de l'argent",
    description:
      'Les acomptes notés sur cahier compliquent la lecture immédiate du solde de chaque élève.',
  },
  {
    icon: Clock,
    title: 'Relancer les familles sans trace',
    description:
      'Sans reçu numéroté par échéance, vérifier les règlements déjà versés prend du temps.',
  },
  {
    icon: Calculator,
    title: 'Le bilan de fin de mois',
    description:
      'Additionner les souches papier et pointer les références mobiles alourdit chaque arrêté de caisse.',
  },
];

// 3 cartes « La solution » : titre court + UNE phrase de 15 mots maximum chacune
const SOLUTION_CARDS = [
  {
    icon: CreditCard,
    title: 'Encaisser et valider les paiements',
    description:
      'Enregistrez espèces, chèque, Bankily, Masrvi et Sedad avec référence opérateur et confirmation du directeur.',
  },
  {
    icon: Receipt,
    title: 'Reçus PDF numérotés et clôture de caisse',
    description:
      'Émettez un reçu PDF numéroté par règlement et clôturez la caisse du jour.',
  },
  {
    icon: Users,
    title: 'Élèves, classes, barèmes et absences',
    description:
      'Gérez vos classes, barèmes en MRU, échéances, absences et notifications sur quatre accès distincts.',
  },
];

// 3 cartes numérotées « Prêt en trois étapes » : une phrase chacune, aucune durée annoncée
const THREE_STEPS = [
  {
    number: '1',
    title: 'Créez votre école',
    description:
      "Renseignez le nom, la ville, le téléphone (+222) et l'année scolaire.",
  },
  {
    number: '2',
    title: 'Configurez vos classes et vos frais',
    description:
      'Créez vos classes, définissez vos barèmes en MRU et inscrivez vos élèves.',
  },
  {
    number: '3',
    title: 'Encaissez et suivez',
    description:
      'Enregistrez les paiements au guichet, émettez les reçus PDF et suivez les absences.',
  },
];

// Fonctions listées dans les cartes de tarifs : chaque ligne correspond à une fonction présente
// dans le code (preuves fichier et lignes dans le rapport du lot G8). Mêmes fonctions partout.
const PLAN_FEATURES_CORE = [
  "Espèces, chèque, Bankily, Masrvi et Sedad avec référence de l'opérateur",
  'Confirmation ou rejet des paiements en attente par le directeur',
  'Reçus PDF numérotés et clôture de caisse',
  'Absences, notifications et quatre accès (directeur, caissier, enseignant, parent)',
];
const PLAN_FEATURES_ESSENTIEL = [
  "Élèves et classes de l'école",
  'Barèmes de frais et échéances en MRU',
  ...PLAN_FEATURES_CORE,
];

const PRICING_PLANS = [
  {
    name: 'Essentiel',
    capacity: "Jusqu'à 150 élèves",
    price: '1 200 MRU',
    period: '/ mois',
    audience: 'Pour une école qui démarre',
    features: PLAN_FEATURES_ESSENTIEL,
    highlighted: false,
  },
  {
    name: 'Établissement',
    capacity: "Jusqu'à 500 élèves",
    price: '2 500 MRU',
    period: '/ mois',
    audience: 'Pour une école qui grandit',
    features: [
      "Toutes les fonctions de l'Essentiel",
      "Capacité jusqu'à 500 élèves",
      ...PLAN_FEATURES_CORE,
    ],
    highlighted: true,
  },
  {
    name: 'Réseau',
    capacity: 'Plus de 500 élèves ou plusieurs établissements',
    price: 'Sur mesure',
    period: '',
    audience: 'Pour une école de plus de 500 élèves',
    features: [
      'Plus de 500 élèves ou plusieurs établissements',
      'Prix adapté à la taille de votre réseau',
      ...PLAN_FEATURES_CORE,
    ],
    highlighted: false,
  },
];

// Bloc « Comment lire ces prix » : uniquement ces quatre idées
const PRICING_READING_NOTES = [
  'Prix en MRU (nouvelle ouguiya), par mois et par école.',
  'Les trois formules donnent accès aux mêmes fonctions.',
  "Seule la capacité en nombre d'élèves change.",
  "L'essai est gratuit.",
];

// Pastilles flottantes du hero et cartes flottantes autour de la scène :
// libellés vrais uniquement, sans chiffre ni nom.
const HERO_FLOATING_PILLS = [
  { text: 'Reçu PDF numéroté', icon: FileText, className: 'left-0 top-[44%]' },
  { text: "Référence de l'opérateur", icon: Smartphone, className: 'right-0 top-[28%]' },
  { text: 'Validé par le directeur', icon: ShieldCheck, className: 'right-[4%] bottom-[22%]' },
];

const SCENE_FLOATING_CARDS = [
  { title: 'Paiement en attente', text: 'Confirmé ou rejeté par le directeur', className: 'right-[calc(100%-24px)] top-[38%]' },
  { title: 'Clôture de caisse', text: 'La caisse du jour est arrêtée au guichet', className: 'left-[calc(100%-24px)] bottom-[14%]' },
];

// Les 6 étapes réelles de la carte « Pour démarrer »
// (src/components/dashboard/PourDemarrerCard.tsx, lignes 220 à 279)
const POUR_DEMARRER_STEPS = [
  "Profil de l'école",
  'Classes',
  'Frais de scolarité',
  'Premier élève',
  'Personnel',
  'Premier paiement',
];

// 6 lignes maximum dans « Inclus dans toutes les formules »
const INCLUDED_IN_ALL_PLANS = [
  "Inscriptions des élèves et classes propres à l'école",
  'Barèmes de frais en MRU et génération des échéances',
  'Paiements espèces, chèque, Bankily, Masrvi et Sedad avec référence opérateur',
  'Validation des paiements en attente par le directeur',
  'Reçus PDF numérotés et clôture de la caisse du jour',
  'Suivi des absences, notifications et quatre accès (directeur, caissier, enseignant, parent)',
];

// 5 questions maximum
const FAQ_ITEMS = [
  {
    id: 'faq-paiements',
    question: 'Quels modes de paiement peut-on enregistrer dans EcoSurv ?',
    answer:
      "Vous enregistrez au guichet les espèces, les chèques ainsi que Bankily, Masrvi et Sedad avec la référence de l'opérateur.",
  },
  {
    id: 'faq-validation',
    question: 'Comment sont validés les paiements mobiles et hors espèces ?',
    answer:
      'Tout paiement hors espèces est créé en statut en attente avec sa référence, puis confirmé ou rejeté par le directeur.',
  },
  {
    id: 'faq-roles',
    question: "Quels sont les quatre accès proposés par l'application ?",
    answer:
      "Chaque école dispose d'accès dédiés pour le directeur, le caissier, les enseignants et les parents d'élèves.",
  },
  {
    id: 'faq-demarrage',
    question: "Comment se passe la mise en route après la création de l'école ?",
    answer:
      "La carte « Pour démarrer » sur le tableau de bord du directeur guide pas à pas la configuration de l'école.",
  },
  {
    id: 'faq-isolation',
    question:
      'Les données de notre établissement sont-elles séparées des autres écoles ?',
    answer:
      'Oui. Chaque école voit uniquement ses propres classes, élèves, barèmes, échéances, paiements et absences, sur téléphone et ordinateur.',
  },
];

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  staggerIndex?: number;
  startAt?: number;
  endAt?: number;
  testId?: string;
}

/**
 * Bloc dont l'apparition (fondu 0 -> 1 et montée 32 px -> 0) est liée
 * progressivement à la position de défilement dans la fenêtre.
 * En prefers-reduced-motion : fondu d'opacité seul (aucune translation).
 */
const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  staggerIndex = 0,
  startAt = 0.96,
  endAt = 0.66,
  testId,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = Boolean(useReducedMotion());

  const startOffset = Math.max(0.55, Number((startAt - staggerIndex * 0.04).toFixed(2)));
  const endOffset = Math.max(0.35, Number((endAt - staggerIndex * 0.04).toFixed(2)));

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start ${startOffset}`, `start ${endOffset}`],
  });

  // Courbe douce progressive liée au défilement : montée de 48 px et échelle 0,96 vers 1
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.55, 1]);
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [shouldReduceMotion ? 0 : 48, 0]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [shouldReduceMotion ? 1 : 0.96, 1]
  );

  return (
    <motion.div
      ref={ref}
      data-testid={testId}
      data-reveal=""
      style={{ opacity, y, scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Lumière douce : disque bleu uni (#1D4ED8, sans dégradé CSS) adouci par un
 * flou fixe. Seuls transform et opacity sont animés, en dérive très lente.
 */
const SoftLight: React.FC<{
  className: string;
  opacity: number;
  drift: { x: number[]; y: number[] };
  duration: number;
}> = ({ className, opacity, drift, duration }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  return (
    <motion.div
      aria-hidden="true"
      data-testid="soft-light"
      className={`pointer-events-none absolute rounded-full bg-[#1D4ED8] blur-[100px] will-change-transform ${className}`}
      initial={{ opacity: 0 }}
      animate={
        shouldReduceMotion
          ? { opacity }
          : { opacity: [opacity, opacity * 0.8, opacity], x: drift.x, y: drift.y }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.6 }
          : { duration, repeat: Infinity, ease: 'easeInOut' }
      }
    />
  );
};

/** Élément qui flotte verticalement en boucle (immobile en mouvement réduit). */
const Floating: React.FC<{
  children: React.ReactNode;
  className?: string;
  index: number;
}> = ({ children, className = '', index }) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  return (
    <motion.div
      aria-hidden="true"
      data-testid="floating-item"
      className={className}
      initial={{ opacity: 0 }}
      animate={
        shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: [0, -10, 0] }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.6 }
          : {
              opacity: { duration: 0.6, delay: 0.4 + index * 0.15 },
              y: {
                duration: 6 + index,
                delay: index * 1.3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
      }
    >
      {children}
    </motion.div>
  );
};

const POUR_DEMARRER_TICK_MS = 1200;
const POUR_DEMARRER_HOLD_MS = 2600;

/**
 * Carte animée de la fin de page : les 6 étapes de « Pour démarrer » se
 * cochent une par une, en boucle. Pause/Lecture, arrêt hors écran, et état
 * final figé en mouvement réduit (même mécanisme que la scène produit).
 */
const PourDemarrerPreview: React.FC = () => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const total = POUR_DEMARRER_STEPS.length;

  const [checkedCount, setCheckedCount] = useState<number>(() =>
    shouldReduceMotion ? total : 0
  );
  const [isPaused, setIsPaused] = useState<boolean>(() => shouldReduceMotion);
  const [isInView, setIsInView] = useState<boolean>(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setCheckedCount(total);
      setIsPaused(true);
    }
  }, [shouldReduceMotion, total]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused || !isInView) return;
    const timer = window.setTimeout(
      () => setCheckedCount((prev) => (prev >= total ? 0 : prev + 1)),
      checkedCount >= total ? POUR_DEMARRER_HOLD_MS : POUR_DEMARRER_TICK_MS
    );
    return () => window.clearTimeout(timer);
  }, [isPaused, isInView, checkedCount, total]);

  return (
    <div
      ref={containerRef}
      data-testid="pour-demarrer-preview"
      data-checked={checkedCount}
      data-is-paused={String(isPaused)}
      className="relative w-full max-w-md mx-auto lg:ml-auto rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-5 sm:p-6 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-extrabold">Pour démarrer</p>
          <p className="text-xs font-semibold text-slate-500 tabular-nums">
            {checkedCount} étapes sur {total}
          </p>
        </div>
        <button
          type="button"
          data-testid="pour-demarrer-play-pause"
          aria-pressed={isPaused}
          aria-label={
            isPaused
              ? "Lancer la lecture de l'animation « Pour démarrer »"
              : "Mettre en pause l'animation « Pour démarrer »"
          }
          onClick={() => setIsPaused((prev) => !prev)}
          className="min-h-[44px] px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
        >
          {isPaused ? (
            <>
              <Play className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>Lecture</span>
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5 text-slate-500" />
              <span>Pause</span>
            </>
          )}
        </button>
      </div>

      <div
        aria-hidden="true"
        className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden"
      >
        <motion.div
          className="h-full bg-[#1D4ED8] origin-left"
          initial={false}
          animate={{ scaleX: checkedCount / total }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: SMOOTH_EASE }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {POUR_DEMARRER_STEPS.map((label, idx) => {
          const isDone = idx < checkedCount;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors duration-300 ${isDone
                  ? 'border-[#1D4ED8]/30 bg-blue-50'
                  : 'border-slate-200 bg-white'
                }`}
            >
              <span
                className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300 ${isDone
                    ? 'bg-[#1D4ED8] text-white'
                    : 'border-2 border-slate-300 text-transparent'
                  }`}
              >
                <motion.span
                  initial={false}
                  animate={
                    isDone
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: shouldReduceMotion ? 1 : 0.6 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                  className="inline-flex"
                >
                  <Check className="h-3.5 w-3.5" />
                </motion.span>
              </span>
              <span
                className={`text-sm font-semibold ${isDone ? 'text-slate-900' : 'text-slate-500'}`}
              >
                {label}
              </span>
              <span className="sr-only">{isDone ? ' (faite)' : ' (à faire)'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const navigateToLogin = useNavigationStore((s) => s.navigateToLogin);
  const navigateToRegister = useNavigationStore((s) => s.navigateToRegister);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  // État de la seconde ligne du titre d'accroche (frappe lettre par lettre, une seule fois)
  const [typedLine, setTypedLine] = useState<string>(
    shouldReduceMotion ? HERO_TYPED_PHRASES[0] : ''
  );
  const [showCursor, setShowCursor] = useState<boolean>(!shouldReduceMotion);

  // Thème clair par défaut à l'ouverture si l'utilisateur n'a pas explicitement choisi un thème
  useEffect(() => {
    try {
      const userExplicit = window.localStorage.getItem(
        'ecosurv_theme_explicit'
      );
      if (!userExplicit) {
        setTheme('light');
      }
    } catch {
      setTheme('light');
    }
  }, [setTheme]);

  // Titre et meta description cohérents en français
  useEffect(() => {
    document.documentElement.lang = 'fr';
    document.title =
      'EcoSurv — Gestion de scolarité et des encaissements pour les écoles en Mauritanie';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        "EcoSurv permet aux écoles en Mauritanie d'inscrire leurs élèves, définir leurs barèmes en MRU, enregistrer les paiements (espèces, chèque, Bankily, Masrvi, Sedad), émettre des reçus PDF numérotés et suivre les absences."
      );
    }
  }, []);

  // Frappe unique de la seconde ligne du titre : passe par les 3 phrases vraies et s'arrête sur la première
  useEffect(() => {
    if (shouldReduceMotion) {
      setTypedLine(HERO_TYPED_PHRASES[0]);
      setShowCursor(false);
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    const sequence = [
      HERO_TYPED_PHRASES[0],
      HERO_TYPED_PHRASES[1],
      HERO_TYPED_PHRASES[2],
      HERO_TYPED_PHRASES[0],
    ];

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(resolve, ms);
      });

    const runTypewriter = async () => {
      setShowCursor(true);
      for (let s = 0; s < sequence.length; s++) {
        const phrase = sequence[s];
        const isLast = s === sequence.length - 1;

        for (let i = 1; i <= phrase.length; i++) {
          if (cancelled) return;
          setTypedLine(phrase.slice(0, i));
          await sleep(22);
        }

        if (isLast) {
          await sleep(350);
          if (!cancelled) {
            setShowCursor(false);
          }
          return;
        }

        await sleep(420);

        for (let i = phrase.length - 1; i >= 0; i--) {
          if (cancelled) return;
          setTypedLine(phrase.slice(0, i));
          await sleep(10);
        }

        await sleep(120);
      }
    };

    runTypewriter();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldReduceMotion]);

  // Suivi de la section visible au défilement pour souligner le lien correspondant
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      let current: SectionId | null = null;

      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = link.id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermeture du menu mobile avec la touche Échap
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleToggleTheme = () => {
    try {
      window.localStorage.setItem('ecosurv_theme_explicit', '1');
    } catch {
      // Ignorer si localStorage est indisponible
    }
    toggleTheme();
  };

  // Classes partagées pour les cartes arrondies (24 px) : levée de 3 px et bordure bleue au survol.
  // Elles s'appliquent à l'élément intérieur, jamais au ScrollReveal qui porte l'animation de défilement.
  const cardHoverClass = `transition-[translate,box-shadow,border-color] duration-200 ease-out ${shouldReduceMotion
      ? ''
      : 'hover:-translate-y-[3px] focus-within:-translate-y-[3px]'
    } hover:border-[#1D4ED8]/50 dark:hover:border-blue-400/60 focus-within:border-[#1D4ED8]/50 hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.48)] focus-within:shadow-[0_16px_36px_rgba(15,23,42,0.09)]`;
  const softCardInteractiveClass = `h-full rounded-3xl bg-surface border border-subtle shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${cardHoverClass}`;

  return (
    <div className="relative min-h-screen bg-page-bg text-main font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-x-clip">
      {/* Motif de grille SVG très discret sur le fond gris-bleu très pâle (aucun dégradé CSS) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full z-0 text-[#0F172A]/[0.035] dark:text-[#F8FAFC]/[0.04]"
      >
        <defs>
          <pattern
            id="ecosurv-subtle-grid"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 44 0 L 0 0 0 44"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ecosurv-subtle-grid)" />
      </svg>

      {/* Lien d'évitement en tout premier */}
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-[#1D4ED8] focus:text-white focus:text-sm focus:font-semibold"
      >
        Aller au contenu
      </a>

      {/* Fine ligne de progression de lecture de 2 px (bleue) en haut de page */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#1D4ED8] z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* a) Barre de navigation en pilule flottante */}
      <header className="sticky top-3 sm:top-4 z-40 px-3 sm:px-6">
        <div className="mx-auto max-w-[1100px] rounded-full bg-surface border border-subtle shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo à gauche */}
          <a
            href="#"
            aria-label="EcoSurv — Accueil"
            className="inline-flex items-center py-1 shrink-0 focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-full"
          >
            <Logo
              variant={theme === 'dark' ? 'inverse' : 'couleur'}
              height={26}
            />
          </a>

          {/* Liens au centre (ordinateur) : Le constat, La solution, Tarifs, Questions */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-6"
          >
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={`min-h-[44px] inline-flex items-center px-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-full ${isActive
                      ? 'font-bold text-primary-text underline decoration-[#1D4ED8] decoration-2 underline-offset-8'
                      : 'font-semibold text-secondary hover:text-primary-text'
                    }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Actions à droite (ordinateur) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Passer au thème clair'
                  : 'Passer au thème sombre'
              }
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-default bg-surface text-secondary hover:text-main hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={navigateToLogin}
              className="min-h-[44px] px-4 py-2 rounded-full border border-default bg-surface text-main hover:bg-surface-subtle text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            >
              Se connecter
            </button>

            <button
              type="button"
              onClick={navigateToRegister}
              className="min-h-[44px] px-5 py-2 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            >
              Créer mon école
            </button>
          </div>

          {/* Contrôles mobile & tablette */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Passer au thème clair'
                  : 'Passer au thème sombre'
              }
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-default bg-surface text-secondary hover:text-main transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="menu-mobile-navigation"
              aria-label={
                isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'
              }
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-default bg-surface text-main transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Liste déroulante mobile sous la pilule */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              id="menu-mobile-navigation"
              aria-label="Menu mobile"
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
              }
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              exit={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
              }
              transition={{
                duration: 0.25,
                ease: SMOOTH_EASE,
              }}
              className="lg:hidden mx-auto max-w-[1100px] mt-2 rounded-3xl bg-surface border border-subtle shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-4 space-y-1.5"
            >
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`min-h-[44px] flex items-center px-4 rounded-full text-base transition-colors ${isActive
                        ? 'font-bold text-primary-text bg-surface-subtle'
                        : 'font-medium text-main hover:bg-surface-subtle'
                      }`}
                  >
                    {link.label}
                  </a>
                );
              })}

              <div className="pt-3 mt-2 border-t border-subtle flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateToLogin();
                  }}
                  className="min-h-[44px] flex-1 px-4 py-2.5 rounded-full border border-default bg-surface text-main text-sm font-semibold text-center cursor-pointer"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateToRegister();
                  }}
                  className="min-h-[44px] flex-1 px-4 py-2.5 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold text-center cursor-pointer"
                >
                  Créer mon école
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="contenu-principal" className="relative z-10">
        {/* b) Accroche CENTRÉE + Scène de produit animée (max 960 px) */}
        <section className="relative overflow-x-clip pt-8 sm:pt-12 pb-16 sm:pb-24 border-b border-subtle">
          {/* Lumière douce bleue en arrière-plan du hero */}
          <SoftLight
            className="-top-48 -left-40 h-[560px] w-[560px]"
            opacity={0.1}
            drift={{ x: [0, 60, 0], y: [0, 40, 0] }}
            duration={26}
          />
          <SoftLight
            className="top-[32%] -right-48 h-[520px] w-[520px]"
            opacity={0.08}
            drift={{ x: [0, -50, 0], y: [0, -30, 0] }}
            duration={32}
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
            {/* Pastilles flottantes autour de l'accroche (grands écrans seulement) */}
            <div className="relative">
              {HERO_FLOATING_PILLS.map((pill, idx) => {
                const PillIcon = pill.icon;
                return (
                  <Floating
                    key={pill.text}
                    index={idx}
                    className={`hidden xl:block absolute z-10 ${pill.className}`}
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-subtle text-xs font-bold text-main shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                      <PillIcon className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-blue-300" />
                      {pill.text}
                    </span>
                  </Floating>
                );
              })}
            {/* Bloc texte centré */}
            <motion.div
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }
              }
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              transition={{ duration: 0.55, ease: SMOOTH_EASE }}
              className="max-w-3xl mx-auto text-center space-y-5"
            >
              <p className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-xs font-bold uppercase tracking-wider text-primary-text shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                Pensé pour les écoles en Mauritanie (MRU, +222)
              </p>

              <h1 className="text-[32px] leading-[38px] sm:text-[46px] sm:leading-[54px] lg:text-[52px] lg:leading-[60px] font-extrabold text-main tracking-tight">
                {/* Titre complet immédiatement lisible par les lecteurs d'écran */}
                <span className="sr-only">
                  Chaque paiement de scolarité suivi, du guichet au reçu PDF.
                </span>

                {/* Affichage visuel : ligne 1 fixe, ligne 2 frappée lettre par lettre en bleu uni */}
                <span aria-hidden="true" className="block">
                  <span className="block text-main">
                    Chaque paiement de scolarité suivi,
                  </span>
                  {/* Ligne tapée et copie invisible de la phrase la plus longue dans la même cellule de grille */}
                  <span className="grid text-[#1D4ED8] dark:text-[#60A5FA]">
                    <span
                      aria-hidden="true"
                      data-testid="hero-typed-ghost"
                      className="invisible pointer-events-none select-none [grid-area:1/1]"
                    >
                      {HERO_LONGEST_PHRASE}
                      <span className="inline-block w-[2px] h-[0.88em] ml-1 align-middle" />
                    </span>
                    <span data-testid="hero-typed-line" className="[grid-area:1/1]">
                      {typedLine}
                      {showCursor && (
                        <span className="inline-block w-[2px] h-[0.88em] bg-[#1D4ED8] dark:bg-[#60A5FA] ml-1 align-middle" />
                      )}
                    </span>
                  </span>
                </span>
              </h1>

              <p className="text-base text-secondary leading-relaxed max-w-2xl mx-auto">
                Inscrivez vos élèves par classe, suivez les échéances en MRU,
                encaissez au guichet et suivez les absences sur téléphone et
                ordinateur.
              </p>

              {/* Deux boutons centrés : Créer mon école + Se connecter */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="min-h-[48px] px-6 py-3 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-base font-bold transition-colors inline-flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
                >
                  <span>Créer mon école</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={navigateToLogin}
                  className="min-h-[48px] px-6 py-3 rounded-full border border-default bg-surface hover:bg-surface-subtle text-main text-base font-semibold transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
                >
                  Se connecter
                </button>
              </div>

              {/* Ligne discrète et centrée avec les logos de paiement et la mention de non-affiliation */}
              <div className="pt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="h-8 px-3 rounded-full bg-white border border-subtle inline-flex items-center justify-center">
                    <img
                      src={bankilyLogo}
                      alt="Bankily"
                      width={34}
                      height={22}
                      className="max-h-[20px] h-5 w-auto object-contain select-none"
                    />
                  </div>

                  <div className="h-8 px-3 rounded-full bg-white border border-subtle inline-flex items-center justify-center">
                    <img
                      src={masrviLogo}
                      alt="Masrvi"
                      width={22}
                      height={22}
                      className="max-h-[20px] h-5 w-auto object-contain select-none"
                    />
                  </div>

                  <div className="h-8 px-3 rounded-full bg-white border border-subtle inline-flex items-center justify-center">
                    <img
                      src={sedadLogo}
                      alt="Sedad"
                      width={44}
                      height={22}
                      className="max-h-[20px] h-5 w-auto object-contain select-none"
                    />
                  </div>

                  <span className="h-8 px-3.5 rounded-full bg-surface border border-subtle inline-flex items-center text-xs font-bold text-main">
                    Espèces
                  </span>

                  <span className="h-8 px-3.5 rounded-full bg-surface border border-subtle inline-flex items-center text-xs font-bold text-main">
                    Chèque
                  </span>
                </div>

                <p className="text-xs text-muted">
                  Logos et marques appartenant à leurs propriétaires respectifs.
                  EcoSurv n'est pas affilié à ces services.
                </p>
              </div>
            </motion.div>
            </div>

            {/* Scène de produit animée, grande et centrée (max 960 px) */}
            <motion.div
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }
              }
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              transition={{ duration: 0.65, delay: 0.1, ease: SMOOTH_EASE }}
              className="relative max-w-[960px] mx-auto"
            >
              <LandingMockupPreview />

              {/* Petites cartes flottantes autour de la scène (très grands écrans seulement) */}
              {SCENE_FLOATING_CARDS.map((card, idx) => (
                <Floating
                  key={card.title}
                  index={idx + 1}
                  className={`hidden min-[1360px]:block absolute z-10 w-[200px] ${card.className}`}
                >
                  <div className="rounded-2xl bg-surface border border-subtle p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.10)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.4)]">
                    <p className="text-xs font-extrabold text-main">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs text-secondary leading-snug">
                      {card.text}
                    </p>
                  </div>
                </Floating>
              ))}
            </motion.div>
          </div>
        </section>

        {/* c) « Le constat » : 3 cartes, titre court et UNE phrase de 15 mots maximum */}
        <section
          id="constat"
          className="scroll-mt-24 py-16 sm:py-24 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
            <ScrollReveal
              staggerIndex={0}
              testId="constat-header"
              className="text-center max-w-2xl mx-auto space-y-2.5"
            >
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-warning-surface border border-warning-border text-warning-text text-xs font-bold uppercase tracking-wider">
                Le constat
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                Trois difficultés du suivi sur cahier
              </h2>
              <p className="text-base text-secondary">
                Tenir les échéances et les reçus sur papier alourdit le
                quotidien de l'école.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CONSTAT_CARDS.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <ScrollReveal
                    key={card.title}
                    staggerIndex={idx + 1}
                    testId={`constat-card-${idx}`}
                    className="h-full"
                  >
                    <div className={`${softCardInteractiveClass} p-5 sm:p-6 space-y-3`}>
                      <div className="h-10 w-10 rounded-2xl bg-warning-surface border border-warning-border text-warning-text flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-main">
                        {card.title}
                      </h3>
                      <p className="text-[15px] leading-relaxed text-secondary">
                        {card.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* d) « La solution » : 3 cartes seulement, titre court + UNE phrase de 15 mots maximum */}
        <section
          id="solution"
          className="scroll-mt-24 py-16 sm:py-24 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
            <ScrollReveal
              staggerIndex={0}
              testId="solution-header"
              className="text-center max-w-2xl mx-auto space-y-2.5"
            >
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-[#1D4ED8] dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                La solution
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                Un outil structuré pour toute l'école
              </h2>
              <p className="text-base text-secondary">
                Quatre accès dédiés pour le directeur, le caissier, les
                enseignants et les parents.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SOLUTION_CARDS.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <ScrollReveal
                    key={card.title}
                    staggerIndex={idx + 1}
                    testId={`solution-card-${idx}`}
                    className="h-full"
                  >
                    <div className={`${softCardInteractiveClass} p-5 sm:p-6 space-y-3`}>
                      <div className="h-10 w-10 rounded-2xl bg-surface-subtle border border-subtle text-primary-text flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-main">
                        {card.title}
                      </h3>
                      <p className="text-[15px] leading-relaxed text-secondary">
                        {card.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* e) « Prêt en trois étapes » : 3 cartes numérotées, une ligne chacune, aucune durée annoncée */}
        <section
          id="etapes"
          className="scroll-mt-24 py-16 sm:py-24 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
            <ScrollReveal
              staggerIndex={0}
              testId="steps-header"
              className="text-center max-w-2xl mx-auto space-y-2.5"
            >
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                Mise en route
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                Prêt en trois étapes
              </h2>
              <p className="text-base text-secondary">
                La carte « Pour démarrer » vous guide pas à pas dès la création
                de votre école.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {THREE_STEPS.map((step, idx) => (
                <ScrollReveal
                  key={step.number}
                  staggerIndex={idx + 1}
                  testId={`step-card-${idx}`}
                  className="h-full"
                >
                  <div className={`${softCardInteractiveClass} p-5 sm:p-6 space-y-3`}>
                    <div className="h-10 w-10 rounded-full bg-[#1D4ED8] text-white font-extrabold text-sm flex items-center justify-center tabular-nums">
                      {step.number}
                    </div>
                    <h3 className="text-base font-extrabold text-main">
                      {step.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-secondary">
                      {step.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* f) « Tarifs » : les trois colonnes validées + encadré limité à 6 lignes maximum */}
        <section
          id="tarifs"
          className="scroll-mt-24 py-16 sm:py-24 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
            <ScrollReveal
              staggerIndex={0}
              testId="tarifs-header"
              className="text-center max-w-2xl mx-auto space-y-2.5"
            >
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                Tarifs
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                Trois formules selon la taille de votre établissement
              </h2>
              <p className="text-base text-secondary">
                Toutes les formules incluent l'ensemble des fonctionnalités.
                Seule la capacité change.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {PRICING_PLANS.map((plan, idx) => (
                <ScrollReveal
                  key={plan.name}
                  staggerIndex={idx + 1}
                  testId={`pricing-card-${idx}`}
                  className="h-full"
                >
                  <div
                    className={`h-full rounded-3xl bg-surface p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${cardHoverClass} flex flex-col justify-between space-y-5 ${plan.highlighted
                        ? 'border-2 border-[#1D4ED8]'
                        : 'border border-subtle'
                      }`}
                  >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-extrabold text-main">
                        {plan.name}
                      </h3>
                      <span className="px-3 py-0.5 rounded-full bg-surface-subtle border border-subtle text-xs font-bold text-primary-text">
                        Essai gratuit
                      </span>
                    </div>

                    <p className="text-[15px] font-semibold text-secondary">
                      {plan.capacity}
                    </p>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-[32px] sm:leading-[40px] font-extrabold text-main tabular-nums">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm font-semibold text-muted">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <p
                      data-testid={`pricing-audience-${idx}`}
                      className="text-sm text-muted"
                    >
                      {plan.audience}
                    </p>

                    {/* Ligne de séparation puis liste des fonctions */}
                    <ul
                      data-testid={`pricing-features-${idx}`}
                      className="pt-4 border-t border-subtle space-y-2.5 text-sm text-secondary"
                    >
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check
                            aria-hidden="true"
                            className="h-4 w-4 text-primary-text shrink-0 mt-0.5"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={navigateToRegister}
                    className={`min-h-[44px] w-full px-5 py-2.5 rounded-full text-sm font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${plan.highlighted
                        ? 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white'
                        : 'border border-default bg-surface hover:bg-surface-subtle text-main'
                      }`}
                  >
                    Créer mon école
                  </button>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Bloc « Comment lire ces prix » : il reprend la mention MRU, par mois et par école */}
            <ScrollReveal staggerIndex={1} testId="pricing-reading">
              <div className="max-w-3xl mx-auto rounded-3xl bg-surface-subtle border border-subtle p-5 sm:p-6">
                <h3 className="text-sm font-extrabold text-main">
                  Comment lire ces prix
                </h3>
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-secondary">
                  {PRICING_READING_NOTES.map((note) => (
                    <li key={note} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D4ED8]"
                      />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Encadré « Inclus dans toutes les formules » limité à 6 lignes */}
            <ScrollReveal
              staggerIndex={2}
              className="rounded-3xl bg-surface border border-subtle p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-3">
                <h3 className="text-base font-extrabold text-main">
                  Inclus dans toutes les formules
                </h3>
                <span className="px-3 py-0.5 rounded-full bg-surface-subtle border border-subtle text-xs font-bold text-primary-text">
                  Essai gratuit
                </span>
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[15px] text-secondary">
                {INCLUDED_IN_ALL_PLANS.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary-text shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>

        {/* g) « Questions » : 5 questions maximum */}
        <section
          id="questions"
          className="scroll-mt-24 py-16 sm:py-24 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
            <ScrollReveal
              staggerIndex={0}
              testId="questions-header"
              className="text-center max-w-2xl mx-auto space-y-2.5"
            >
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                Questions
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                Cinq réponses claires avant de démarrer
              </h2>
              <p className="text-base text-secondary">
                Tout ce qu'il faut savoir sur le fonctionnement réel d'EcoSurv.
              </p>
            </ScrollReveal>

            <ScrollReveal
              staggerIndex={1}
              className="max-w-3xl mx-auto divide-y divide-subtle border border-subtle bg-surface rounded-3xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-5 sm:px-7"
            >
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                const buttonId = `${faq.id}-btn`;
                const panelId = `${faq.id}-panel`;

                return (
                  <div key={faq.id}>
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full min-h-[52px] py-3.5 flex items-center justify-between gap-4 text-left text-[15px] sm:text-base font-bold text-main hover:text-primary-text transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-xl"
                      >
                        <span>{faq.question}</span>
                        <span
                          aria-hidden="true"
                          className="h-7 w-7 rounded-full border border-subtle bg-surface-subtle flex items-center justify-center shrink-0 text-primary-text"
                        >
                          <Plus
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''
                              }`}
                          />
                        </span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -6 }
                          }
                          animate={
                            shouldReduceMotion
                              ? { opacity: 1 }
                              : { opacity: 1, y: 0 }
                          }
                          exit={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -6 }
                          }
                          transition={{
                            duration: 0.25,
                            ease: SMOOTH_EASE,
                          }}
                          className="pb-4 pt-0.5 text-[15px] text-secondary leading-relaxed"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </ScrollReveal>
          </div>
        </section>

        {/* h) Section de fin sombre : titre, une phrase, bouton, et carte « Pour démarrer » animée */}
        <section
          data-testid="landing-final"
          className="relative overflow-hidden py-16 sm:py-24 bg-[#0F172A] text-white"
        >
          <SoftLight
            className="-bottom-56 -left-32 h-[560px] w-[560px]"
            opacity={0.12}
            drift={{ x: [0, 70, 0], y: [0, -40, 0] }}
            duration={28}
          />
          <SoftLight
            className="-top-40 right-[10%] h-[440px] w-[440px]"
            opacity={0.1}
            drift={{ x: [0, -40, 0], y: [0, 30, 0] }}
            duration={34}
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <ScrollReveal
              staggerIndex={0}
              startAt={0.98}
              endAt={0.78}
              className="text-center lg:text-left space-y-5"
            >
              <h2 className="text-[28px] leading-[36px] sm:text-[40px] sm:leading-[48px] font-extrabold text-white tracking-tight">
                Votre école sur EcoSurv, étape par étape
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-md mx-auto lg:mx-0">
                Créez l'espace de votre établissement. La carte « Pour démarrer »
                vous guide ensuite en six étapes.
              </p>
              <div>
                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="min-h-[48px] px-6 py-3 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-base font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>Créer mon école</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal staggerIndex={1} startAt={0.98} endAt={0.78}>
              <PourDemarrerPreview />
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* i) Pied de page : uniquement le logo et « © 2026 EcoSurv » (aucun lien répétant le menu) */}
      <footer className="relative z-10 bg-surface border-t border-subtle py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Logo
            variant={theme === 'dark' ? 'inverse' : 'couleur'}
            height={24}
          />
          <p className="text-sm text-muted">© 2026 EcoSurv</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
