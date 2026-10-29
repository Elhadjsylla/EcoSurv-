import React, { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useReducedMotion,
  type Variants,
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
  CalendarCheck,
  Compass,
  Smartphone,
  LayoutDashboard,
  Wallet,
  BookOpen,
  UserCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { Logo } from '../components/ui/Logo';
import { LandingMockupPreview } from '../components/landing/LandingMockupPreview';
import { HonestProductDemo } from '../components/landing/HonestProductDemo';
import bankilyLogo from '../assets/payments/bankily.jpg';
import masrviLogo from '../assets/payments/masrvi.png';
import sedadLogo from '../assets/payments/sedad.png';

type SectionId = 'constat' | 'solution' | 'demo' | 'tarifs' | 'questions';

const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: 'constat', label: 'Le constat' },
  { id: 'solution', label: 'La solution' },
  { id: 'demo', label: 'Démonstration' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'questions', label: 'Questions' },
];

const HERO_TYPED_PHRASES = [
  'du guichet au reçu PDF.',
  "avec la référence de l'opérateur.",
  'confirmé par le directeur.',
] as const;

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CONSTAT_CARDS = [
  {
    icon: AlertCircle,
    title: "Savoir qui doit encore de l'argent",
    description:
      "Entre les acomptes notés dans la marge, les ratures et les carnets séparés par classe, il est difficile de vérifier immédiatement quel élève est à jour et quel dossier présente un reste à payer.",
    consequence: 'Lecture lente des soldes par élève',
  },
  {
    icon: Clock,
    title: 'Relancer les familles sans trace',
    description:
      "Lorsqu'un règlement en espèces ou par transfert mobile n'est pas rattaché à une échéance précise avec un reçu numéroté, les échanges avec les parents manquent de repères clairs sur les versements déjà effectués.",
    consequence: 'Vérifications manuelles répétées au guichet',
  },
  {
    icon: Calculator,
    title: 'Le bilan de fin de mois',
    description:
      "Additionner les souches de reçus à la main et croiser le tiroir-caisse avec les références Bankily, Masrvi ou Sedad mobilise du temps administratif à chaque arrêté de caisse.",
    consequence: 'Pointage manuel en fin de journée et de mois',
  },
];

const SOLUTION_FEATURES = [
  {
    icon: Users,
    title: 'Inscriptions par classe et barèmes en MRU',
    description:
      "Créez les classes propres à votre établissement, inscrivez vos élèves, définissez vos barèmes de frais de scolarité en MRU et générez les échéances.",
  },
  {
    icon: CreditCard,
    title: 'Encaissements et validation des paiements',
    description:
      "Enregistrez les règlements en espèces, chèque, Bankily, Masrvi et Sedad avec la référence de l'opérateur. Le directeur confirme ou rejette les paiements en attente.",
  },
  {
    icon: Receipt,
    title: 'Reçus PDF numérotés et clôture de caisse',
    description:
      "Émettez un reçu PDF numéroté pour chaque paiement enregistré et clôturez la caisse du jour à partir du journal des opérations.",
  },
  {
    icon: CalendarCheck,
    title: 'Suivi des absences et notifications',
    description:
      "Les enseignants saisissent les absences de leurs classes, les parents peuvent déclarer une absence et chacun reçoit des notifications dans l'application.",
  },
  {
    icon: Compass,
    title: 'Carte « Pour démarrer » et données isolées',
    description:
      "Configurez votre école étape par étape grâce à la carte « Pour démarrer » sur le tableau de bord. Chaque école ne voit que ses propres données.",
  },
  {
    icon: Smartphone,
    title: 'Pensé pour la Mauritanie, sur téléphone et ordinateur',
    description:
      "Interface adaptée aux réalités locales (monnaie MRU, numéros +222), utilisable sur téléphone comme sur ordinateur.",
  },
];

const SOLUTION_ROLES = [
  {
    icon: LayoutDashboard,
    role: 'Directeur',
    summary: "Pilotage de l'établissement, des classes et des validations.",
    items: [
      'Suivre la mise en route avec la carte « Pour démarrer ».',
      'Définir les classes, les barèmes en MRU et générer les échéances.',
      'Inscrire les élèves et gérer les accès du personnel.',
      'Confirmer ou rejeter les paiements en attente et consulter les rapports.',
    ],
  },
  {
    icon: Wallet,
    role: 'Caissier',
    summary: 'Tenue quotidienne du guichet et arrêté de caisse.',
    items: [
      'Enregistrer les paiements (espèces, chèque, Bankily, Masrvi, Sedad) avec référence opérateur.',
      'Émettre les reçus PDF numérotés au guichet.',
      'Consulter le journal et clôturer la caisse du jour.',
    ],
  },
  {
    icon: BookOpen,
    role: 'Enseignant',
    summary: 'Appel et suivi de la présence dans ses classes.',
    items: [
      'Accéder à la liste des élèves des classes affectées.',
      'Saisir les absences depuis un téléphone ou un ordinateur.',
      'Recevoir des notifications dans l’application.',
    ],
  },
  {
    icon: UserCheck,
    role: 'Parent',
    summary: 'Consultation du dossier de scolarité et des absences.',
    items: [
      'Consulter les échéances en MRU et télécharger les reçus PDF validés.',
      'Voir les absences saisies en classe et déclarer une absence.',
      'Recevoir des notifications dans l’application.',
    ],
  },
];

const BEFORE_ITEMS = [
  'Suivre les paiements dans un cahier',
  'Calculer les soldes à la main',
  'Retrouver un reçu dans un tiroir',
  'Recompter la caisse le soir',
];

const AFTER_ITEMS = [
  'Solde de chaque élève calculé automatiquement',
  'Reçu numéroté à chaque paiement',
  'Paiements mobiles confirmés avec leur référence',
  'Journal de caisse du jour',
  'Clôture de caisse',
];

const THREE_STEPS = [
  {
    number: '1',
    title: 'Créez votre école',
    description:
      "Renseignez le nom de votre établissement, la ville, le numéro de téléphone (+222) et l'année scolaire.",
  },
  {
    number: '2',
    title: 'Configurez vos classes et vos frais',
    description:
      'Créez les classes propres à votre école, définissez vos barèmes en MRU et inscrivez vos élèves.',
  },
  {
    number: '3',
    title: 'Encaissez et suivez',
    description:
      'Enregistrez les règlements au guichet, émettez les reçus PDF numérotés et suivez les absences au quotidien.',
  },
];

const PRICING_PLANS = [
  {
    name: 'Essentiel',
    capacity: "Jusqu'à 150 élèves",
    price: '1 200 MRU',
    period: '/ mois',
    highlighted: false,
  },
  {
    name: 'Établissement',
    capacity: "Jusqu'à 500 élèves",
    price: '2 500 MRU',
    period: '/ mois',
    highlighted: true,
  },
  {
    name: 'Réseau',
    capacity: 'Plus de 500 élèves ou plusieurs établissements',
    price: 'Sur mesure',
    period: '',
    highlighted: false,
  },
];

const INCLUDED_IN_ALL_PLANS = [
  'Inscription des élèves et gestion des classes de l’école',
  'Définition des barèmes en MRU et génération des échéances',
  'Enregistrement des paiements (espèces, chèque, Bankily, Masrvi, Sedad) avec référence opérateur',
  'Confirmation ou rejet des paiements en attente par le directeur',
  'Émission de reçus PDF numérotés et clôture de la caisse du jour',
  'Suivi des absences (saisies par les enseignants, déclarées par les parents)',
  'Quatre accès distincts (directeur, caissier, enseignant, parent) et notifications',
  'Carte « Pour démarrer », données propres à chaque école, sur téléphone et ordinateur',
];

const FAQ_ITEMS = [
  {
    id: 'faq-paiements',
    question: 'Quels modes de paiement peut-on enregistrer dans EcoSurv ?',
    answer:
      "Vous pouvez enregistrer au guichet les paiements en espèces et par chèque, ainsi que les règlements effectués via Bankily, Masrvi et Sedad en renseignant la référence de l'opérateur.",
  },
  {
    id: 'faq-validation',
    question: 'Comment sont validés les paiements mobiles et hors espèces ?',
    answer:
      "Lorsqu'un paiement hors espèces (Bankily, Masrvi, Sedad ou chèque) est enregistré avec sa référence de transaction, il apparaît dans les paiements en attente. Le directeur peut alors le confirmer ou le rejeter après vérification.",
  },
  {
    id: 'faq-roles',
    question: "Quels sont les quatre accès proposés par l'application ?",
    answer:
      "EcoSurv propose quatre accès distincts : le directeur pilote l'école et confirme les paiements en attente, le caissier encaisse au guichet et clôture la caisse, l'enseignant saisit les absences de ses classes, et le parent consulte les échéances, les reçus PDF et les absences de son enfant.",
  },
  {
    id: 'faq-demarrage',
    question: "Comment se passe la mise en route après la création de l'école ?",
    answer:
      "Dès votre première connexion, une carte « Pour démarrer » sur le tableau de bord du directeur vous guide pas à pas : renseigner le profil et l'année scolaire, créer vos classes, définir vos barèmes en MRU, inscrire votre premier élève et inviter votre équipe.",
  },
  {
    id: 'faq-isolation',
    question:
      'Les données de notre établissement sont-elles séparées des autres écoles ?',
    answer:
      "Oui. Chaque école ne voit que ses propres données : vos classes, vos élèves, vos barèmes, vos échéances, vos paiements et vos absences sont strictement rattachés à votre établissement.",
  },
  {
    id: 'faq-appareils',
    question: "L'application fonctionne-t-elle sur téléphone et sur ordinateur ?",
    answer:
      "Oui. EcoSurv s'utilise directement dans le navigateur web sur téléphone comme sur ordinateur, pour le directeur, le caissier, les enseignants et les parents.",
  },
];

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const navigateToLogin = useNavigationStore((s) => s.navigateToLogin);
  const navigateToRegister = useNavigationStore((s) => s.navigateToRegister);
  const shouldReduceMotion = useReducedMotion();
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

  // Apparition au défilement : montée de 28 px avec fondu, 600 ms, cubic-bezier(0.22, 1, 0.36, 1), décalage de 80 ms, une seule fois
  const containerVariants: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const stepsContainerVariants: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.14,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 28,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: SMOOTH_EASE,
      },
    },
  };

  // Classes partagées pour les cartes arrondies (24 px), ombre douce et levée de 4 px au survol / focus clavier
  const softCardInteractiveClass = `rounded-3xl bg-surface border border-subtle shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 ease-out ${
    shouldReduceMotion
      ? ''
      : 'hover:-translate-y-1 focus-within:-translate-y-1'
  } hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.48)] focus-within:shadow-[0_16px_36px_rgba(15,23,42,0.09)]`;

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

      {/* Fine ligne de progression de lecture de 2 px (bleue) en haut de page, désactivée si prefers-reduced-motion */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[2px] bg-[#1D4ED8] z-50 origin-left"
          style={{ scaleX: scrollYProgress }}
        />
      )}

      {/* 1. Barre de navigation en pilule flottante */}
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

          {/* Liens au centre (ordinateur) */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-5 xl:gap-6"
          >
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={`min-h-[44px] inline-flex items-center px-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-full ${
                    isActive
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
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -10 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.3,
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
                    className={`min-h-[44px] flex items-center px-4 rounded-full text-base transition-colors ${
                      isActive
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
        {/* 2. Accroche (texte et scène de produit alignés par le haut) */}
        <section className="pt-6 sm:pt-10 pb-14 sm:pb-20 border-b border-subtle">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
            >
              {/* Colonne gauche : texte d'accroche aligné en haut */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-6 space-y-5 pt-1"
              >
                <p className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-xs font-bold uppercase tracking-wider text-primary-text shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  Pensé pour les écoles en Mauritanie (MRU, +222)
                </p>

                <h1 className="text-2xl sm:text-[32px] sm:leading-[40px] font-extrabold text-main tracking-tight">
                  {/* Titre complet immédiatement lisible par les lecteurs d'écran */}
                  <span className="sr-only">
                    Chaque paiement de scolarité suivi, du guichet au reçu PDF.
                  </span>

                  {/* Affichage visuel : ligne 1 fixe, ligne 2 frappée lettre par lettre en bleu uni */}
                  <span aria-hidden="true" className="block">
                    <span className="block text-main">
                      Chaque paiement de scolarité suivi,
                    </span>
                    <span className="block text-[#1D4ED8] dark:text-[#60A5FA] min-h-[1.25em]">
                      {typedLine}
                      {showCursor && (
                        <span className="inline-block w-[2px] h-[0.9em] bg-[#1D4ED8] dark:bg-[#60A5FA] ml-1 align-middle" />
                      )}
                    </span>
                  </span>
                </h1>

                <p className="text-base text-secondary leading-relaxed max-w-[54ch]">
                  Inscrivez vos élèves par classe, suivez les échéances en MRU,
                  encaissez au guichet et suivez les absences au quotidien.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={navigateToRegister}
                    className="min-h-[48px] px-6 py-3 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-base font-bold transition-colors inline-flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
                  >
                    <span>Créer mon école</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <a
                    href="#demo"
                    className="min-h-[44px] inline-flex items-center px-3 rounded-full text-sm font-bold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
                  >
                    Voir la démonstration
                  </a>
                </div>

                {/* Bandeau des moyens de paiement enregistrés et mention des marques */}
                <div className="pt-4 border-t border-subtle space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    Modes de paiement enregistrés au guichet
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white border border-subtle flex items-center justify-center">
                      <img
                        src={bankilyLogo}
                        alt="Bankily"
                        width={39}
                        height={28}
                        className="max-h-[26px] h-6 w-auto object-contain select-none"
                      />
                    </div>

                    <div className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white border border-subtle flex items-center justify-center">
                      <img
                        src={masrviLogo}
                        alt="Masrvi"
                        width={28}
                        height={28}
                        className="max-h-[26px] h-6 w-auto object-contain select-none"
                      />
                    </div>

                    <div className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white border border-subtle flex items-center justify-center">
                      <img
                        src={sedadLogo}
                        alt="Sedad"
                        width={52}
                        height={28}
                        className="max-h-[26px] h-6 w-auto object-contain select-none"
                      />
                    </div>

                    <span className="min-h-[40px] px-4 py-1.5 rounded-full bg-surface border border-subtle inline-flex items-center text-xs font-bold text-main">
                      Espèces
                    </span>

                    <span className="min-h-[40px] px-4 py-1.5 rounded-full bg-surface border border-subtle inline-flex items-center text-xs font-bold text-main">
                      Chèque
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-normal">
                    Logos et marques appartenant à leurs propriétaires
                    respectifs. EcoSurv n'est pas affilié à ces services.
                  </p>
                </div>
              </motion.div>

              {/* Colonne droite : scène de produit animée alignée en haut */}
              <motion.div variants={itemVariants} className="lg:col-span-6">
                <LandingMockupPreview />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 3. Temps 1 : Le constat */}
        <section
          id="constat"
          className="scroll-mt-24 py-14 sm:py-20 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-3"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-warning-surface border border-warning-border text-warning-text text-xs font-bold uppercase tracking-wider">
                  Le constat
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                  Trois difficultés courantes quand la scolarité est suivie sur
                  cahier
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Tenir les échéances, les acomptes et les références de
                  transfert mobile sur papier alourdit la gestion quotidienne.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CONSTAT_CARDS.map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      variants={itemVariants}
                      className={`${softCardInteractiveClass} p-6 sm:p-7 flex flex-col justify-between space-y-5`}
                    >
                      <div className="space-y-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-warning-surface border border-warning-border text-warning-text flex items-center justify-center">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-extrabold text-main leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-sm text-secondary leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      <div className="pt-3.5 border-t border-subtle text-xs font-semibold text-muted">
                        Constat :{' '}
                        <span className="text-main">{card.consequence}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Temps 2 : La solution + Ce qui change au quotidien + Prêt en trois étapes */}
        <section
          id="solution"
          className="scroll-mt-24 py-14 sm:py-20 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Sous-partie A : Cartes des fonctions */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-3"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-[#1D4ED8] dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                  La solution
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                  Un outil structuré pour les inscriptions, la caisse et les
                  absences
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Chaque opération est rattachée à l'élève, à sa classe et à
                  l'année scolaire de votre établissement.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SOLUTION_FEATURES.map((feat) => {
                  const IconComponent = feat.icon;
                  return (
                    <motion.div
                      key={feat.title}
                      variants={itemVariants}
                      className={`${softCardInteractiveClass} p-6 sm:p-7 space-y-3.5`}
                    >
                      <div className="h-11 w-11 rounded-2xl bg-surface-subtle border border-subtle text-primary-text flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-main">
                        {feat.title}
                      </h3>
                      <p className="text-sm text-secondary leading-relaxed">
                        {feat.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Sous-partie B : Cartes pour les quatre rôles */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10 pt-8 border-t border-subtle"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-2.5"
              >
                <h3 className="text-lg sm:text-xl font-extrabold text-main tracking-tight">
                  Quatre accès distincts selon les responsabilités de chacun
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Le directeur, le caissier, l'enseignant et le parent disposent
                  chacun d'une interface dédiée.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SOLUTION_ROLES.map((roleCard) => {
                  const IconComponent = roleCard.icon;
                  return (
                    <motion.div
                      key={roleCard.role}
                      variants={itemVariants}
                      className={`${softCardInteractiveClass} p-6 sm:p-7 space-y-4`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-surface-subtle border border-subtle text-primary-text flex items-center justify-center shrink-0">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-main">
                            {roleCard.role}
                          </h4>
                          <p className="text-xs text-muted mt-0.5">
                            {roleCard.summary}
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2.5 text-sm text-secondary border-t border-subtle pt-4">
                        {roleCard.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-primary-text shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Sous-partie C : Bloc « Ce qui change au quotidien » (Avant / Avec EcoSurv) */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-8 pt-8 border-t border-subtle"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-2.5"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                  Au quotidien
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                  Ce qui change au quotidien
                </h3>
                <p className="text-base text-secondary leading-relaxed">
                  Du suivi manuel sur cahier à une gestion structurée par élève
                  et par échéance.
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="rounded-3xl bg-surface border border-subtle shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
              >
                {/* Colonne gauche : Avant */}
                <div className="rounded-2xl bg-page-bg border border-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-subtle pb-3">
                    <h4 className="text-base font-extrabold text-secondary">
                      Avant
                    </h4>
                    <span className="px-3 py-0.5 rounded-full bg-surface border border-subtle text-xs font-semibold text-muted">
                      Suivi manuel
                    </span>
                  </div>

                  <ul className="space-y-3 text-sm text-muted">
                    {BEFORE_ITEMS.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="h-5 w-5 rounded-full bg-surface border border-default text-muted flex items-center justify-center shrink-0 mt-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Colonne droite : Avec EcoSurv */}
                <div className="rounded-2xl bg-surface border-2 border-[#1D4ED8] p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-subtle pb-3">
                    <h4 className="text-base font-extrabold text-main">
                      Avec EcoSurv
                    </h4>
                    <span className="px-3 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-bold text-[#1D4ED8] dark:text-blue-300">
                      Suivi structuré
                    </span>
                  </div>

                  <ul className="space-y-3 text-sm font-medium text-main">
                    {AFTER_ITEMS.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="h-5 w-5 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 mt-0.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>

            {/* Sous-partie D : Bloc « Prêt en trois étapes » (les cartes numérotées arrivent une par une) */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={stepsContainerVariants}
              className="space-y-8 pt-8 border-t border-subtle"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-2.5"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                  Mise en route
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                  Prêt en trois étapes
                </h3>
                <p className="text-base text-secondary leading-relaxed">
                  Un parcours guidé par la carte « Pour démarrer » dès la
                  création de votre établissement.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {THREE_STEPS.map((step) => (
                  <motion.div
                    key={step.number}
                    variants={itemVariants}
                    className={`${softCardInteractiveClass} p-6 sm:p-7 space-y-4`}
                  >
                    <div className="h-11 w-11 rounded-full bg-[#1D4ED8] text-white font-extrabold text-base flex items-center justify-center tabular-nums">
                      {step.number}
                    </div>
                    <h4 className="text-lg font-extrabold text-main">
                      {step.title}
                    </h4>
                    <p className="text-sm text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. Temps 3 : Démonstration interactive (section d'appui sur fond sombre #0F172A) */}
        <section
          id="demo"
          className="scroll-mt-24 py-14 sm:py-20 bg-[#0F172A] text-white border-b border-slate-800"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-3"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider">
                  Démonstration
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Testez la saisie d'un encaissement au guichet
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Sélectionnez un canal de règlement (Espèces, Bankily, Masrvi
                  ou Sedad) pour observer le comportement du guichet sur un
                  exemple fictif.
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <HonestProductDemo />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 6. Tarifs */}
        <section
          id="tarifs"
          className="scroll-mt-24 py-14 sm:py-20 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-3"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                  Tarifs
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                  Trois formules selon la taille de votre établissement
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Toutes les formules donnent accès à l'ensemble des
                  fonctionnalités d'EcoSurv. Seule la capacité d'accueil change.
                </p>
              </motion.div>

              {/* Trois colonnes de tarifs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {PRICING_PLANS.map((plan) => (
                  <motion.div
                    key={plan.name}
                    variants={itemVariants}
                    className={`rounded-3xl bg-surface p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-200 ease-out ${
                      shouldReduceMotion
                        ? ''
                        : 'hover:-translate-y-1 focus-within:-translate-y-1'
                    } hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] flex flex-col justify-between space-y-6 ${
                      plan.highlighted
                        ? 'border-2 border-[#1D4ED8]'
                        : 'border border-subtle'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-extrabold text-main">
                          {plan.name}
                        </h3>
                        <span className="px-3 py-0.5 rounded-full bg-surface-subtle border border-subtle text-xs font-bold text-primary-text">
                          Essai gratuit
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-secondary">
                        {plan.capacity}
                      </p>

                      <div className="pt-4 border-t border-subtle flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-[32px] sm:leading-[40px] font-extrabold text-main tabular-nums">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-sm font-semibold text-muted">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={navigateToRegister}
                      className={`min-h-[44px] w-full px-5 py-2.5 rounded-full text-sm font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${
                        plan.highlighted
                          ? 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white'
                          : 'border border-default bg-surface hover:bg-surface-subtle text-main'
                      }`}
                    >
                      Créer mon école
                    </button>
                  </motion.div>
                ))}
              </div>

              <motion.p
                variants={itemVariants}
                className="text-sm font-medium text-secondary text-center"
              >
                Prix en MRU (nouvelle ouguiya), par mois et par école.
              </motion.p>

              {/* Encadré : Inclus dans toutes les formules */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl bg-surface border border-subtle p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-main">
                      Inclus dans toutes les formules
                    </h3>
                    <p className="text-xs sm:text-sm text-muted mt-0.5">
                      Chaque établissement bénéficie des mêmes outils dès
                      l'ouverture de son compte.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-3.5 py-1 rounded-full bg-surface-subtle border border-subtle text-xs font-bold text-primary-text">
                    Essai gratuit
                  </span>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm text-secondary">
                  {INCLUDED_IN_ALL_PLANS.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-primary-text shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 7. Questions fréquentes (Accordéon accessible avec « + », 6 questions) */}
        <section
          id="questions"
          className="scroll-mt-24 py-14 sm:py-20 border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div
                variants={itemVariants}
                className="text-center max-w-2xl mx-auto space-y-3"
              >
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface border border-subtle text-secondary text-xs font-bold uppercase tracking-wider">
                  Questions
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-main tracking-tight">
                  Six réponses claires avant de démarrer
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Tout ce qu'il faut savoir sur le fonctionnement réel
                  d'EcoSurv.
                </p>
              </motion.div>

              <div className="divide-y divide-subtle border border-subtle bg-surface rounded-3xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-5 sm:px-8">
                {FAQ_ITEMS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  const buttonId = `${faq.id}-btn`;
                  const panelId = `${faq.id}-panel`;

                  return (
                    <motion.div key={faq.id} variants={itemVariants}>
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() =>
                            setOpenFaqIndex(isOpen ? null : idx)
                          }
                          className="w-full min-h-[56px] py-4 flex items-center justify-between gap-4 text-left text-base font-bold text-main hover:text-primary-text transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-xl"
                        >
                          <span>{faq.question}</span>
                          <span
                            aria-hidden="true"
                            className="h-8 w-8 rounded-full border border-subtle bg-surface-subtle flex items-center justify-center shrink-0 text-primary-text"
                          >
                            <Plus
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isOpen ? 'rotate-45' : ''
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
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: -6 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                              shouldReduceMotion
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: -6 }
                            }
                            transition={{
                              duration: shouldReduceMotion ? 0 : 0.3,
                              ease: SMOOTH_EASE,
                            }}
                            className="pb-5 pt-1 text-sm sm:text-base text-secondary leading-relaxed max-w-[70ch]"
                          >
                            {faq.answer}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 8. Bandeau final sombre « Essayez avec votre propre école » */}
        <section className="py-14 sm:py-20 bg-[#0F172A] text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
              className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <motion.div
                variants={itemVariants}
                className="space-y-2 max-w-xl"
              >
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Essayez avec votre propre école
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Créez l'espace de votre établissement, définissez vos classes
                  et vos barèmes en MRU, puis suivez la carte « Pour démarrer ».
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="shrink-0">
                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-base font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span>Créer mon école</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* 9. Pied de page minimal */}
      <footer className="relative z-10 bg-surface border-t border-subtle py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo
              variant={theme === 'dark' ? 'inverse' : 'couleur'}
              height={24}
            />
          </div>

          <nav
            aria-label="Liens du pied de page"
            className="flex flex-wrap items-center gap-5 text-sm font-semibold text-secondary"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="min-h-[44px] inline-flex items-center hover:text-primary-text transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-sm text-muted">© 2026 EcoSurv</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
