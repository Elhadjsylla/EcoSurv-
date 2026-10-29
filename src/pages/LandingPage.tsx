import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Sun, Moon, Menu, X, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { Logo } from '../components/ui/Logo';
import { LandingMockupPreview } from '../components/landing/LandingMockupPreview';
import bankilyLogo from '../assets/payments/bankily.jpg';
import masrviLogo from '../assets/payments/masrvi.png';
import sedadLogo from '../assets/payments/sedad.png';

interface RoleSection {
  role: string;
  summary: string;
  items: string[];
}

const ROLES_EDITORIAL: RoleSection[] = [
  {
    role: 'Directeur',
    summary: "Pilotage de l'établissement, des classes et des encaissements.",
    items: [
      'Démarrer pas à pas avec la carte « Pour démarrer » dès la création de l’école.',
      'Inscrire les élèves, gérer les classes de l’établissement et inviter le personnel.',
      'Définir les frais de scolarité (barèmes en MRU) et générer les échéances.',
      'Confirmer ou rejeter les paiements en attente et recevoir des notifications dans l’application.',
    ],
  },
  {
    role: 'Caissier',
    summary: 'Tenue du guichet quotidien et émission des justificatifs.',
    items: [
      'Enregistrer les paiements en espèces ainsi que les règlements Bankily, Masrvi et Sedad avec la référence de l’opérateur.',
      'Émettre immédiatement des reçus PDF numérotés pour chaque encaissement.',
      'Clôturer la caisse du jour en fin de service.',
    ],
  },
  {
    role: 'Enseignant',
    summary: 'Suivi de la présence dans les classes affectées.',
    items: [
      'Consulter les élèves des classes qui lui sont attribuées.',
      'Saisir les absences des élèves depuis un téléphone ou un ordinateur.',
      'Recevoir des notifications dans l’application.',
    ],
  },
  {
    role: 'Parent',
    summary: 'Consultation des échéances et suivi des absences de l’enfant.',
    items: [
      'Suivre les échéances de scolarité et les paiements enregistrés en MRU.',
      'Consulter les absences saisies par les enseignants et déclarer une absence.',
      'Recevoir des notifications dans l’application sur téléphone ou ordinateur.',
    ],
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    number: '1',
    title: "Créer l'école",
    description:
      "Renseignez le nom de votre établissement, votre ville, votre numéro de téléphone (+222) et votre adresse email.",
  },
  {
    number: '2',
    title: 'Confirmer avec le code reçu par email',
    description:
      'Saisissez le code envoyé à votre adresse email pour activer votre compte directeur.',
  },
  {
    number: '3',
    title: 'Configurer classes et frais',
    description:
      "Définissez l'année scolaire, ajoutez les classes de votre école et créez vos barèmes en MRU pour générer les échéances.",
  },
  {
    number: '4',
    title: 'Encaisser le premier paiement',
    description:
      "Enregistrez un paiement au guichet (espèces, Bankily, Masrvi ou Sedad) avec la référence de l'opérateur et remettez le reçu PDF numéroté.",
  },
];

const FAQ_ITEMS = [
  {
    id: 'faq-qui',
    question: 'Qui peut utiliser EcoSurv ?',
    answer:
      "EcoSurv est conçu pour les écoles en Mauritanie (monnaie MRU, numéros +222). L'application propose quatre accès distincts selon la fonction de chacun : directeur, caissier, enseignant et parent.",
  },
  {
    id: 'faq-parents',
    question: 'Comment les parents suivent-ils leur enfant ?',
    answer:
      "Chaque parent dispose d'un accès personnel pour consulter les échéances et les paiements de son enfant en MRU, voir les absences saisies par les enseignants, déclarer une absence et recevoir des notifications dans l'application.",
  },
  {
    id: 'faq-paiements',
    question: 'Quels modes de paiement peut-on enregistrer ?',
    answer:
      "Vous pouvez enregistrer les règlements en espèces ainsi que les paiements effectués via Bankily, Masrvi et Sedad en saisissant la référence de l'opérateur. Le directeur peut confirmer ou rejeter les paiements en attente, et chaque opération permet d'émettre un reçu PDF numéroté.",
  },
  {
    id: 'faq-telephone',
    question: 'Est-ce que cela fonctionne sur téléphone ?',
    answer:
      "Oui. EcoSurv fonctionne directement dans le navigateur sur téléphone comme sur ordinateur, pour les quatre rôles de l'établissement.",
  },
  {
    id: 'faq-demarrer',
    question: 'Comment démarrer ?',
    answer:
      "Cliquez sur « Créer mon école », confirmez votre inscription avec le code reçu par email, puis laissez-vous guider par la carte « Pour démarrer » sur le tableau de bord du directeur.",
  },
];

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const navigateToLogin = useNavigationStore((s) => s.navigateToLogin);
  const navigateToRegister = useNavigationStore((s) => s.navigateToRegister);
  const shouldReduceMotion = useReducedMotion();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Thème clair par défaut à l'ouverture si l'utilisateur n'a pas explicitement choisi un thème
  useEffect(() => {
    try {
      const userExplicit = window.localStorage.getItem('ecosurv_theme_explicit');
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
        "EcoSurv permet aux écoles en Mauritanie d'inscrire leurs élèves, définir leurs barèmes en MRU, enregistrer les paiements (espèces, Bankily, Masrvi, Sedad), émettre des reçus PDF numérotés et suivre les absences."
      );
    }
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

  const containerVariants: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.24,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-surface text-main font-sans antialiased overflow-x-hidden">
      {/* Lien d'évitement en tout premier */}
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-sm focus:bg-primary focus:text-on-primary focus:text-sm focus:font-semibold"
      >
        Aller au contenu
      </a>

      {/* 1. Barre de navigation fixe */}
      <header className="sticky top-0 z-40 w-full bg-surface border-b border-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a
            href="#"
            aria-label="EcoSurv — Accueil"
            className="inline-flex items-center py-2 focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
          >
            <Logo
              variant={theme === 'dark' ? 'inverse' : 'couleur'}
              height={28}
            />
          </a>

          {/* Navigation ordinateur */}
          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-6"
          >
            <a
              href="#fonctionnalites"
              className="min-h-[44px] inline-flex items-center text-base font-medium text-secondary hover:text-primary-text transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded-sm px-1"
            >
              Fonctionnalités
            </a>
            <a
              href="#comment-ca-marche"
              className="min-h-[44px] inline-flex items-center text-base font-medium text-secondary hover:text-primary-text transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded-sm px-1"
            >
              Comment ça marche
            </a>
            <a
              href="#questions"
              className="min-h-[44px] inline-flex items-center text-base font-medium text-secondary hover:text-primary-text transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded-sm px-1"
            >
              Questions
            </a>
          </nav>

          {/* Actions ordinateur */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Passer au thème clair'
                  : 'Passer au thème sombre'
              }
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-sm border border-default bg-surface text-secondary hover:text-main hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
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
              className="min-h-[44px] px-4 py-2 rounded-sm border border-default bg-surface text-main hover:bg-surface-subtle text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            >
              Se connecter
            </button>

            <button
              type="button"
              onClick={navigateToRegister}
              className="min-h-[44px] px-4 py-2 rounded-sm bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            >
              Créer mon école
            </button>
          </div>

          {/* Contrôles mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Passer au thème clair'
                  : 'Passer au thème sombre'
              }
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-sm border border-default bg-surface text-secondary hover:text-main transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
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
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-sm border border-default bg-surface text-main transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Menu déroulant mobile */}
        {isMobileMenuOpen && (
          <nav
            id="menu-mobile-navigation"
            aria-label="Menu mobile"
            className="md:hidden border-t border-subtle bg-surface px-4 py-4 space-y-2"
          >
            <a
              href="#fonctionnalites"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-sm text-base font-medium text-main hover:bg-surface-subtle"
            >
              Fonctionnalités
            </a>
            <a
              href="#comment-ca-marche"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-sm text-base font-medium text-main hover:bg-surface-subtle"
            >
              Comment ça marche
            </a>
            <a
              href="#questions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-sm text-base font-medium text-main hover:bg-surface-subtle"
            >
              Questions
            </a>

            <div className="pt-3 border-t border-subtle flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateToLogin();
                }}
                className="min-h-[44px] w-full px-4 py-2.5 rounded-sm border border-default bg-surface text-main text-base font-semibold text-center cursor-pointer"
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateToRegister();
                }}
                className="min-h-[44px] w-full px-4 py-2.5 rounded-sm bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold text-center cursor-pointer"
              >
                Créer mon école
              </button>
            </div>
          </nav>
        )}
      </header>

      <main id="contenu-principal">
        {/* 2. Accroche (Aperçu au-dessus sur mobile, à droite sur ordinateur) */}
        <section className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-subtle">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Texte d'accroche : en dessous sur mobile (order-2), à gauche sur ordinateur (lg:order-1) */}
              <motion.div
                variants={itemVariants}
                className="order-2 lg:order-1 lg:col-span-6 space-y-6"
              >
                <p className="text-sm font-semibold text-primary-text">
                  Pensé pour les écoles en Mauritanie (MRU, +222)
                </p>

                <h1
                  className="font-bold text-main tracking-tight"
                  style={{
                    fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                    lineHeight: 1.2,
                  }}
                >
                  Gérez votre école simplement
                </h1>

                <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-[65ch]">
                  Inscrivez vos élèves par classe, définissez vos barèmes de
                  scolarité en MRU, enregistrez les paiements au guichet avec
                  reçu PDF numéroté et suivez les absences sur téléphone comme
                  sur ordinateur.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={navigateToRegister}
                    className="min-h-[44px] px-6 py-3 rounded-sm bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Créer mon école
                  </button>

                  <a
                    href="#comment-ca-marche"
                    className="min-h-[44px] inline-flex items-center px-2 text-base font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
                  >
                    Voir comment ça marche
                  </a>
                </div>
              </motion.div>

              {/* Aperçu construit en code : au-dessus sur mobile (order-1), à droite sur ordinateur (lg:order-2) */}
              <motion.div
                variants={itemVariants}
                className="order-1 lg:order-2 lg:col-span-6"
              >
                <LandingMockupPreview />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 3. Comment ça marche (4 étapes numérotées sur fond gris très clair) */}
        <section
          id="comment-ca-marche"
          className="scroll-mt-20 py-12 sm:py-16 lg:py-24 bg-page-bg border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div variants={itemVariants} className="max-w-[65ch] space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-main">
                  Comment ça marche
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Quatre étapes concrètes pour mettre en route votre
                  établissement.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {HOW_IT_WORKS_STEPS.map((step) => (
                  <motion.div
                    key={step.number}
                    variants={itemVariants}
                    className="p-5 rounded-md border border-subtle bg-surface space-y-3"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-on-primary text-sm font-bold">
                      {step.number}
                    </span>
                    <h3 className="text-lg font-semibold text-main">
                      {step.title}
                    </h3>
                    <p className="text-base text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Fonctionnalités par rôle (mise en page éditoriale avec texte et filets) */}
        <section
          id="fonctionnalites"
          className="scroll-mt-20 py-12 sm:py-16 lg:py-24 bg-surface border-b border-subtle"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-10"
            >
              <motion.div variants={itemVariants} className="max-w-[65ch] space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-main">
                  Quatre accès distincts selon le rôle
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Chaque membre de l'école et chaque parent accède uniquement
                  aux outils qui correspondent à ses responsabilités.
                </p>
              </motion.div>

              <div className="divide-y divide-subtle border-t border-b border-subtle">
                {ROLES_EDITORIAL.map((block) => (
                  <motion.div
                    key={block.role}
                    variants={itemVariants}
                    className="py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8"
                  >
                    <div className="lg:col-span-4 space-y-1">
                      <h3 className="text-lg font-bold text-main">
                        {block.role}
                      </h3>
                      <p className="text-sm text-muted leading-relaxed">
                        {block.summary}
                      </p>
                    </div>

                    <ul className="lg:col-span-8 space-y-2.5 text-base text-secondary leading-relaxed">
                      {block.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 max-w-[68ch]"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. Bande Paiements que vous pouvez enregistrer */}
        <section className="py-12 sm:py-16 lg:py-20 bg-page-bg border-b border-subtle">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
              className="space-y-6"
            >
              <motion.div
                variants={itemVariants}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-1 max-w-[60ch]">
                  <h2 className="text-xl font-bold text-main">
                    Paiements que vous pouvez enregistrer
                  </h2>
                  <p className="text-base text-secondary leading-relaxed">
                    Saisissez les règlements reçus en espèces au guichet ou par
                    transfert mobile avec la référence de l'opérateur.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-h-[44px] px-4 py-2 rounded-sm bg-white border border-subtle flex items-center justify-center">
                    <img
                      src={bankilyLogo}
                      alt="Bankily"
                      width={39}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="max-h-[28px] h-7 w-auto object-contain select-none"
                    />
                  </div>

                  <div className="min-h-[44px] px-4 py-2 rounded-sm bg-white border border-subtle flex items-center justify-center">
                    <img
                      src={masrviLogo}
                      alt="Masrvi"
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="max-h-[28px] h-7 w-auto object-contain select-none"
                    />
                  </div>

                  <div className="min-h-[44px] px-4 py-2 rounded-sm bg-white border border-subtle flex items-center justify-center">
                    <img
                      src={sedadLogo}
                      alt="Sedad"
                      width={52}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="max-h-[28px] h-7 w-auto object-contain select-none"
                    />
                  </div>

                  <div className="min-h-[44px] px-4 py-2 rounded-sm bg-surface border border-default flex items-center justify-center text-base font-semibold text-main">
                    Espèces
                  </div>
                </div>
              </motion.div>

              <motion.p variants={itemVariants} className="text-sm text-muted">
                Logos et marques appartenant à leurs propriétaires respectifs.
                EcoSurv n'est pas affilié à ces services.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* 6. Tarifs */}
        <section className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-subtle">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
              className="p-6 sm:p-8 rounded-md border border-subtle bg-page-bg flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <motion.div variants={itemVariants} className="space-y-1.5 max-w-[60ch]">
                <h2 className="text-xl sm:text-2xl font-bold text-main">
                  Les tarifs seront annoncés prochainement
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Vous pouvez dès maintenant créer votre école et configurer vos
                  classes, vos barèmes et vos accès.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="shrink-0">
                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="min-h-[44px] w-full sm:w-auto px-6 py-3 rounded-sm bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Créer mon école
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 7. Questions fréquentes (Accordéon accessible, 5 questions) */}
        <section
          id="questions"
          className="scroll-mt-20 py-12 sm:py-16 lg:py-24 bg-page-bg"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="max-w-[65ch] space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-main">
                  Questions fréquentes
                </h2>
                <p className="text-base text-secondary leading-relaxed">
                  Réponses directes sur le fonctionnement d'EcoSurv.
                </p>
              </motion.div>

              <div className="divide-y divide-subtle border-t border-b border-subtle bg-surface rounded-md px-4 sm:px-6">
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
                          className="w-full min-h-[52px] py-4 flex items-center justify-between gap-4 text-left text-base sm:text-lg font-semibold text-main hover:text-primary-text transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown
                            aria-hidden="true"
                            className={`h-5 w-5 text-muted shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-primary-text' : ''
                            }`}
                          />
                        </button>
                      </h3>

                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="pb-5 pr-6 text-base text-secondary leading-relaxed max-w-[68ch]"
                        >
                          {faq.answer}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* 8. Pied de page sur fond sombre avec logo inversé */}
      <footer className="bg-slate-900 text-slate-200 border-t border-slate-800 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo variant="inverse" height={28} />
          </div>

          <nav
            aria-label="Liens de pied de page"
            className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300"
          >
            <a
              href="#fonctionnalites"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded-sm"
            >
              Fonctionnalités
            </a>
            <a
              href="#comment-ca-marche"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded-sm"
            >
              Comment ça marche
            </a>
            <a
              href="#questions"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded-sm"
            >
              Questions
            </a>
          </nav>

          <p className="text-sm text-slate-400">© 2026 EcoSurv</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
