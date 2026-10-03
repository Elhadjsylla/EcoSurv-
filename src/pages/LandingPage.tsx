import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion, type Variants } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useAuthStore } from '../store/useAuthStore';
import { CONTACT_CONFIG, getWhatsAppUrl } from '../config/contact';
import { HonestProductDemo } from '../components/landing/HonestProductDemo';
import {
  CreditCard,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  MessageCircle,
  ChevronDown,
  Smartphone,
  Check,
  LayoutDashboard,
  Banknote,
  LogIn,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  Calculator,
  UserCheck,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { useLanguageStore } from '../i18n/useLanguageStore';
import { Language } from '../i18n/translations';

const ROTATING_PHRASES: Record<Language, string[]> = {
  fr: [
    'Suivi clair des échéances de scolarité.',
    'Enregistrement rapide au guichet.',
    'Reçus remis immédiatement aux tuteurs.',
    'Moins d’impayés, plus de sérénité.',
  ],
  ar: [
    'متابعة واضحة للأقساط المدرسية.',
    'تسجيل سريع لمدفوعات الشباك.',
    'إيصالات فورية تسلم لأولياء الأمور.',
    'تقليل المتأخرات وراحة بال للإدارة.',
  ],
  en: [
    'Clear tuition fee schedule tracking.',
    'Fast recording at the cashier desk.',
    'Instant receipts for parents and guardians.',
    'Less overdue fees, more peace of mind.',
  ],
};

// Constantes d'animation cohérentes et professionnelles
const MOTION_DURATION = 0.4;
const MOTION_STAGGER = 0.08;
const MOTION_Y = 16;
const MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const LandingPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Système de variantes unifié respectant prefers-reduced-motion
  const motionContainer: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : MOTION_STAGGER,
        delayChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const motionItem: Variants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : MOTION_Y,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : MOTION_DURATION,
        ease: MOTION_EASE,
      },
    },
  };

  const { theme, toggleTheme } = useThemeStore();
  const { t, language } = useLanguageStore();
  const navigateToLogin = useNavigationStore((s) => s.navigateToLogin);
  const navigateToRegister = useNavigationStore((s) => s.navigateToRegister);
  const navigateToUserPortal = useNavigationStore((s) => s.navigateToUserPortal);
  const authProfile = useAuthStore((s) => s.profile);

  const handleAccessPortal = () => {
    navigateToUserPortal(authProfile?.role);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Animation machine à écrire : saisie fluide + pause + effacement progressif
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrases = ROTATING_PHRASES[language] || ROTATING_PHRASES.fr;

  useEffect(() => {
    const currentPhrase = currentPhrases[phraseIndex % currentPhrases.length];
    let timeoutId: number;

    if (!isDeleting) {
      if (currentText.length < currentPhrase.length) {
        timeoutId = window.setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        }, 50); // Vitesse de frappe naturelle
      } else {
        timeoutId = window.setTimeout(() => {
          setIsDeleting(true);
        }, 2200); // Pause de lecture
      }
    } else {
      if (currentText.length > 0) {
        timeoutId = window.setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length - 1));
        }, 25); // Effacement progressif fluide
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % currentPhrases.length);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [currentText, isDeleting, phraseIndex, currentPhrases]);

  // Framer Motion Scroll Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const faqItems = [
    {
      q: "Comment enregistre-t-on les paiements reçus par Bankily, Masrvi, Sedad ou espèces ?",
      a: "Au guichet de l'école, votre caissier sélectionne l'élève, choisit le mode de règlement utilisé par le parent (espèces, Bankily, Masrvi, Sedad ou virement), saisit la référence de transaction si disponible, et valide. Le dossier de l'élève est instantanément mis à jour et un reçu numéroté peut être imprimé ou partagé."
    },
    {
      q: "Peut-on importer notre liste d'élèves existante depuis Excel ?",
      a: "Oui. Vous pouvez importer vos classes et vos listes d'élèves à partir d'un fichier Excel ou CSV, ou inscrire les élèves manuellement au fur et à mesure."
    },
    {
      q: "Les données de notre établissement sont-elles sécurisées et confidentielles ?",
      a: "Oui. Chaque établissement dispose d'un espace strictement cloisonné grâce aux règles de sécurité au niveau des lignes (Row-Level Security). Vos élèves, vos tarifs et vos encaissements ne sont accessibles qu'aux utilisateurs authentifiés de votre école."
    },
    {
      q: "Comment les parents consultent-ils leurs reçus et l'état de leur compte ?",
      a: "Les parents disposent d'un portail dédié sécurisé. Ils peuvent y consulter à tout moment l'historique des règlements de leurs enfants et télécharger les reçus correspondants dès qu'ils ont été enregistrés par l'école."
    },
    {
      q: "Proposez-vous un accompagnement pour prendre en main l'outil ?",
      a: "Oui. Notre équipe vous accompagne pour configurer vos classes et vos tarifs, et pour former votre personnel de caisse et de direction à l'utilisation quotidienne."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 relative selection:bg-blue-600 selection:text-white custom-cursor-area">
      {/* Dynamic Scroll Progress Bar using Framer Motion */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* 1. Header Sticky de navigation épuré et parfaitement aligné */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xs transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo épuré sur une seule ligne */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Eco<span className="text-blue-600 dark:text-blue-400">Surv</span>
            </span>
          </a>

          {/* Liens de navigation essentiels */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#constat" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Le Constat
            </a>
            <a href="#solution" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              La Solution
            </a>
            <a href="#demo" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Démonstration
            </a>
            <a href="#tarifs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Tarifs
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions & Theme toggle */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Basculer le thème"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Actions Auth */}
            {authProfile ? (
              <button
                type="button"
                onClick={handleAccessPortal}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>{t.common.accessPortal || 'Accéder à mon espace'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={navigateToLogin}
                  className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{t.common.login}</span>
                </button>

                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{t.common.createSchool}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-scale-in">
            <a
              href="#constat"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              1. Le Constat
            </a>
            <a
              href="#solution"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              2. La Solution
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              3. Démonstration
            </a>
            <a
              href="#tarifs"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              Tarifs en MRU
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {authProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleAccessPortal();
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold text-center shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>{t.common.accessPortal || 'Accéder à mon espace'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateToRegister();
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold text-center shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Créer mon école</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateToLogin();
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Se connecter</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24 bg-grid-pattern">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Centered Hero Copy & Conversion */}
          <motion.div 
            variants={motionContainer}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-7 flex flex-col items-center text-center mb-12 sm:mb-16"
          >
            {/* Local Trust Pill with Beacon (non-clickable: no hover scale) */}
            <motion.div variants={motionItem} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold shadow-xs backdrop-blur-md cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{t.landing.heroBadge}</span>
            </motion.div>

            {/* Main Headline avec 'Zéro impayé.' fixe et saisie / effacement progressif */}
            <motion.h1 
              variants={motionItem} 
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-slate-950 dark:text-white max-w-5xl mx-auto"
            >
              <span className="block mb-2 sm:mb-3 text-slate-950 dark:text-white">
                {language === 'ar' ? 'صفر متأخرات.' : language === 'en' ? 'Zero Overdue.' : 'Zéro impayé.'}
              </span>
              <div className="min-h-[2.6em] sm:min-h-[1.5em] flex items-center justify-center text-center px-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400 inline">
                  {currentText}
                </span>
                <span className="inline-block w-1 sm:w-1.5 h-[0.82em] bg-blue-600 dark:bg-blue-400 ml-1.5 align-middle rounded-full animate-pulse shrink-0" />
              </div>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p variants={motionItem} className="text-slate-600 dark:text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto font-normal">
              {t.landing.heroSubtitle}
            </motion.p>

            {/* CTAs : Accéder à mon espace si connecté, sinon Créer mon école + Se connecter */}
            <motion.div variants={motionItem} className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
              {authProfile ? (
                <button
                  type="button"
                  onClick={handleAccessPortal}
                  className="relative overflow-hidden w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base transition-all duration-200 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-3 group hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 active:translate-y-0 active:scale-[0.99] ring-4 ring-blue-500/10 cursor-pointer"
                >
                  <LayoutDashboard className="h-5 w-5 text-white" />
                  <span className="relative z-10">{t.common.accessPortal || 'Accéder à mon espace'}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={navigateToRegister}
                    className="relative overflow-hidden w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base transition-all duration-200 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-3 group hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 active:translate-y-0 active:scale-[0.99] ring-4 ring-blue-500/10 cursor-pointer"
                  >
                    <span className="relative z-10">{t.common.createSchool}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                  </button>

                  <button
                    type="button"
                    onClick={navigateToLogin}
                    className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-base border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
                  >
                    <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>{t.common.login}</span>
                  </button>
                </>
              )}
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* 2. Bandeau Modes de Règlement Enregistrés */}
      <section className="border-y border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-6 sm:py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={motionContainer}
            className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6"
          >
            <motion.div variants={motionItem} className="text-center md:text-left">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Encaissements au guichet
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Enregistrez les règlements reçus par tous les canaux usuels
              </p>
            </motion.div>

            <motion.div variants={motionContainer} className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold">
              <motion.div variants={motionItem} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
                <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Espèces au guichet</span>
              </motion.div>
              <motion.div variants={motionItem} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
                <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Bankily</span>
              </motion.div>
              <motion.div variants={motionItem} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
                <Smartphone className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>Masrvi</span>
              </motion.div>
              <motion.div variants={motionItem} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
                <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sedad</span>
              </motion.div>
              <motion.div variants={motionItem} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200">
                <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span>Virements & Chèques</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* 3. Temps 1 : Le Constat (Le Problème) */}
      <section className="py-10 sm:py-16 bg-slate-100/40 dark:bg-slate-900/30" id="constat">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionContainer}
            className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2.5"
          >
            <motion.span variants={motionItem} className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
              Temps 1 • Le Constat
            </motion.span>
            <motion.h2 variants={motionItem} className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              La gestion sur cahier papier freine votre établissement
            </motion.h2>
            <motion.p variants={motionItem} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tenir la scolarité et la trésorerie d'une école avec des carnets et des fiches manuelles crée du stress et des erreurs à chaque fin de mois.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={motionContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto"
          >
            {/* Constat 1 (non-clickable: no hover jump) */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Qui vous doit encore de l'argent ? Le cahier est illisible
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Entre les acomptes notés dans la marge, les ratures et les pages détachées, la direction ne sait jamais avec certitude quel élève est à jour et quel élève a accumulé du retard.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>Résultat :</span>
                <span className="font-normal text-slate-500 dark:text-slate-400">incertitude permanente sur le solde réel</span>
              </div>
            </motion.div>

            {/* Constat 2 */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Les relances de paiement se perdent et créent des litiges
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sans reçu numéroté immédiat, relancer une famille devient source de tension : un parent assure avoir versé l'argent au gardien ou en caisse le mois dernier, mais aucune trace claire n'existe.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>Résultat :</span>
                <span className="font-normal text-slate-500 dark:text-slate-400">tensions inutiles au portail de l'école</span>
              </div>
            </motion.div>

            {/* Constat 3 */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Le bilan de fin de mois prend des heures entières
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Recalculer les totaux à la main, croiser le tiroir-caisse avec les captures d'écran Bankily ou Masrvi des parents consomme des journées entières qui devraient être consacrées à la pédagogie.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>Résultat :</span>
                <span className="font-normal text-slate-500 dark:text-slate-400">heures perdues et écarts de caisse fréquents</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. Temps 2 : La Solution (La Réponse Épurée) */}
      <section className="py-10 sm:py-16" id="solution">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionContainer}
            className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2.5"
          >
            <motion.span variants={motionItem} className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Temps 2 • La Solution
            </motion.span>
            <motion.h2 variants={motionItem} className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              La clarté absolue sur chaque élève et chaque ouguiya
            </motion.h2>
            <motion.p variants={motionItem} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              EcoSurv simplifie chaque étape du quotidien scolaire : un dossier clair par élève, des reçus numérotés instantanés et un journal de caisse toujours équilibré.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={motionContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto"
          >
            {/* Solution 1 (non-clickable: no hover jump) */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/50 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Le dossier de chaque élève à jour en un clic
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Recherchez un élève par son nom ou son matricule. Son échéancier s'affiche instantanément : mensualités payées, solde restant, canal utilisé et date du dernier versement.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Statut clair : à jour ou en attente</span>
              </div>
            </motion.div>

            {/* Solution 2 */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/50 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Un reçu numéroté remis immédiatement
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dès que le caissier enregistre un paiement (espèces, Bankily, Masrvi, etc.), un reçu officiel numéroté est généré avec la référence et le reste à payer. Plus de contestation possible.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Traçabilité complète avec référence</span>
              </div>
            </motion.div>

            {/* Solution 3 */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/50 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Un journal de caisse arrêté sans calculatrice
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Le système totalise automatiquement les encaissements de la journée ou du mois, ventilés par mode de règlement. La direction clôture les comptes en quelques secondes sans risque d'erreur.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Export PDF ou tableur disponible</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Mention discrète des 4 espaces de travail avec entrée en fondu */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionItem}
            className="mt-8 sm:mt-10 max-w-4xl mx-auto rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 text-center"
          >
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Un espace adapté à chaque personne de l'établissement :
            </p>
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-900 dark:text-white block">Directeur</span>
                <span>Pilotage & trésorerie</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-900 dark:text-white block">Caissier</span>
                <span>Guichet & reçus</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-900 dark:text-white block">Enseignant</span>
                <span>Appel & assiduité</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-900 dark:text-white block">Parent</span>
                <span>Historique & quittances</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Temps 3 : Démonstration Sobre */}
      <section className="py-10 sm:py-16 bg-slate-100/30 dark:bg-slate-900/20" id="demo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionContainer}
            className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2.5"
          >
            <motion.span variants={motionItem} className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              Temps 3 • Démonstration
            </motion.span>
            <motion.h2 variants={motionItem} className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Voyez comment s'enregistre un encaissement au guichet
            </motion.h2>
            <motion.p variants={motionItem} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pas de simulateurs théoriques : voici exactement le geste quotidien de votre caissier dans EcoSurv.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={motionItem}
          >
            <HonestProductDemo onNavigateToLogin={navigateToLogin} />
          </motion.div>
        </div>
      </section>

      {/* 9. Grille Tarifaire Transparente en MRU */}
      <section className="py-10 sm:py-16 bg-slate-100/50 dark:bg-slate-900/30" id="tarifs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionContainer}
            className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2.5"
          >
            <motion.span variants={motionItem} className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Investissement Prévisible & Rentable
            </motion.span>
            <motion.h2 variants={motionItem} className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Tarifs adaptés aux réalités mauritaniennes
            </motion.h2>
            <motion.p variants={motionItem} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Tarification claire en Ouguiya (MRU), sans frais cachés ni commissions arbitraires sur vos encaissements d'élèves.
            </motion.p>

            {/* Monthly / Yearly Toggle */}
            <motion.div variants={motionItem} className="pt-3 sm:pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${pricingCycle === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                Facturation Mensuelle
              </span>
              <button
                type="button"
                onClick={() => setPricingCycle(pricingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-700 p-0.5 transition-colors relative cursor-pointer"
                aria-label="Basculer cycle de facturation"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white dark:bg-blue-500 shadow-sm transition-transform duration-200 ${
                    pricingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${pricingCycle === 'yearly' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                <span>Facturation Annuelle</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                  -15% (2 mois offerts)
                </span>
              </span>
            </motion.div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={motionContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch"
          >
            {/* Offre 1: Essentiel */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Formule Essentiel</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Écoles de quartier jusqu'à 250 élèves</p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {pricingCycle === 'monthly' ? '15 000' : '12 750'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MRU / mois</span>
                </div>

                <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Jusqu'à 250 dossiers élèves actifs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Guichet de caisse & reçus numérotés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Journal de caisse (espèces, mobile money, virements)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Suivi des relances d'impayés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Support par ticket & email</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 sm:mt-8">
                <a
                  href={getWhatsAppUrl('Bonjour, je souhaite souscrire au forfait Essentiel EcoSurv')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <span>Souscrire Essentiel</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>

            {/* Offre 2: Pro Établissement (Highlight) */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 p-6 sm:p-8 shadow-xl relative flex flex-col justify-between ring-4 ring-blue-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                Le Plus Choisi par les Collèges & Lycées
              </div>

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro Établissement</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Établissements de 250 à 1 000 élèves</p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {pricingCycle === 'monthly' ? '35 000' : '29 750'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MRU / mois</span>
                </div>

                <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Tout le pack Essentiel, plus :</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Enregistrement guichet Bankily, Masrvi & Sedad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Gestion des relances d'échéances et contacts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Accès direct Portail Parents (quittances en ligne)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Assistance dédiée WhatsApp locale à Nouakchott 6j/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Formation complète de votre secrétaire de caisse</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={authProfile ? handleAccessPortal : navigateToRegister}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]"
                >
                  <span>{authProfile ? (t.common.accessPortal || 'Accéder à mon espace') : 'Créer mon école — Forfait Pro'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            {/* Offre 3: Réseau Scolaire */}
            <motion.div variants={motionItem} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Réseau Scolaire</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Complexes, universités & multi-campus</p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Sur Mesure
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Devis personnalisé</span>
                </div>

                <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Élèves et campus illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Tableau de bord consolidé pour l'Inspection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Export comptable complet (CSV / Excel)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Gestion des bourses et remises</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Interlocuteur unique & Support dédié</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={() => window.location.href = 'mailto:contact@ecosurv.mr'}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  Contacter les Ventes
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 10. FAQ Accordéon Interactive */}
      <section className="py-10 sm:py-16 bg-slate-100/40 dark:bg-slate-900/40" id="faq">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionContainer}
            className="text-center mb-8 sm:mb-10 space-y-2"
          >
            <motion.span variants={motionItem} className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Questions Fréquentes
            </motion.span>
            <motion.h2 variants={motionItem} className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
              Tout ce que vous devez savoir avant de commencer
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={motionContainer}
            className="space-y-3"
          >
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <motion.div
                  key={idx}
                  variants={motionItem}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-answer"
                        initial={shouldReduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? { opacity: 0, height: 'auto' } : { opacity: 0, height: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: MOTION_EASE }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 11. Bannière CTA Pré-Footer Haute Fidélité SaaS */}
      <section className="relative py-10 sm:py-16 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={motionContainer}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 dark:bg-slate-900 text-white shadow-2xl p-6 sm:p-12 lg:p-14 text-center"
          >
            {/* Liseré lumineux supérieur subtil */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              {/* Badge Rentrée (non-clickable: no hover jump) */}
              <motion.div variants={motionItem} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs font-bold tracking-wide shadow-inner cursor-default">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Rentrée Scolaire • Inscriptions & Déploiements Ouverts</span>
              </motion.div>

              {/* Titre Impactant et centré */}
              <motion.h2 variants={motionItem} className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Prêt à sécuriser les rentrées scolaires de votre établissement ?
              </motion.h2>

              {/* Description claire */}
              <motion.p variants={motionItem} className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
                Rejoignez les directions scolaires qui ont éliminé les litiges de caisse, fiabilisé les quittances et maîtrisé leur trésorerie en temps réel.
              </motion.p>

              {/* Boutons d'Action SaaS */}
              <motion.div variants={motionItem} className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                {authProfile ? (
                  <button
                    type="button"
                    onClick={handleAccessPortal}
                    className="w-full sm:w-auto relative group px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/40 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer ring-4 ring-white/10"
                  >
                    <LayoutDashboard className="h-4 w-4 text-white" />
                    <span>{t.common.accessPortal || 'Accéder à mon espace'}</span>
                    <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={navigateToRegister}
                      className="w-full sm:w-auto relative group px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/40 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <span>Créer mon école</span>
                      <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={navigateToLogin}
                      className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base border border-white/20 hover:border-white/30 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 text-blue-300" />
                      <span>Se connecter</span>
                    </button>
                  </>
                )}

                <a
                  href={getWhatsAppUrl('Bonjour, je souhaite des informations pour mon établissement sur EcoSurv')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-sm sm:text-base border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Assistance</span>
                </a>
              </motion.div>

              {/* Piliers de Confiance SaaS */}
              <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 sm:gap-x-8 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Mise en route rapide et intuitive</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Suivi Bankily, Masrvi, Sedad & Espèces</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Formation sur site & support 6j/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Équipe support basée à Nouakchott</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 12. Footer Institutionnel Complet */}
      <footer className="bg-slate-950 text-slate-400 py-8 sm:py-14 text-xs border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Colonne Marque */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-sm">
                  ES
                </div>
                <span className="text-lg font-black text-white tracking-tight">EcoSurv Mauritanie</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-sm">
                Solution logicielle souveraine de pilotage des recouvrements scolaires et universitaires en République Islamique de Mauritanie.
              </p>
              <div className="space-y-2 text-slate-300 font-mono text-[11px]">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{CONTACT_CONFIG.address.display}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{CONTACT_CONFIG.phone.display}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{CONTACT_CONFIG.email.support}</span>
                </p>
              </div>
            </div>

            {/* Colonne 2: Plateforme */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plateforme</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#constat" className="hover:text-white transition-colors">
                    Le Constat
                  </a>
                </li>
                <li>
                  <a href="#solution" className="hover:text-white transition-colors">
                    La Solution
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-white transition-colors">
                    Démonstration guichet
                  </a>
                </li>
                <li>
                  <a href="#tarifs" className="hover:text-white transition-colors">
                    Tarifs en MRU
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 3: Réglementation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Conformité</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#solution" className="hover:text-white transition-colors">
                    Quittances & traçabilité
                  </a>
                </li>
                <li>
                  <a href="#solution" className="hover:text-white transition-colors">
                    Protection des données
                  </a>
                </li>
                <li>
                  <a href="#solution" className="hover:text-white transition-colors">
                    Sécurité TLS
                  </a>
                </li>
                <li>
                  <a href="#solution" className="hover:text-white transition-colors">
                    Cloisonnement multi-tenant (RLS)
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 4: Assistance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Assistance</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href={getWhatsAppUrl('Bonjour, je souhaite contacter l\'assistance EcoSurv')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors text-left"
                  >
                    Assistance WhatsApp 6j/7
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Centre d'aide & FAQ
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={authProfile ? handleAccessPortal : navigateToLogin}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    {authProfile ? (t.common.accessPortal || 'Accéder à mon espace') : "Se connecter à l'espace"}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <span>© 2026-2027 EcoSurv SARL. Tous droits réservés. République Islamique de Mauritanie.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-400">Mentions Légales</a>
              <a href="#" className="hover:text-slate-400">Protection des Données (APDP)</a>
              <a href="#" className="hover:text-slate-400">Conditions Générales de Vente</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
