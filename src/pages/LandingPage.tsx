import React, { useState } from 'react';
import { motion, useScroll, useSpring, type Variants } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { LandingMockupPreview } from '../components/landing/LandingMockupPreview';
import { RoiCalculator } from '../components/landing/RoiCalculator';
import { DemoRequestModal } from '../components/landing/DemoRequestModal';
import { InteractiveJourneyTimeline } from '../components/landing/InteractiveJourneyTimeline';
import { MauritaniaWilayasShowcase } from '../components/landing/MauritaniaWilayasShowcase';
import type { UserRole } from '../components/ui/Header';
import {
  ShieldCheck,
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
  FileCheck,
  TrendingUp,
  Smartphone,
  Check,
  LayoutDashboard,
  Banknote,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } }
};

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const launchAppWithPortal = useNavigationStore((s) => s.launchAppWithPortal);

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Framer Motion Scroll Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleLaunchPortal = (role: UserRole) => {
    launchAppWithPortal(role);
  };

  const faqItems = [
    {
      q: "Comment fonctionne le rapprochement automatique avec Bankily, Masrvi et Sedad ?",
      a: "Chaque paiement reçu sur vos comptes marchands ou professionnels est instantanément rattaché à l'échéance de l'élève correspondant grâce au matricule ou au numéro de téléphone du tuteur. La caisse est mise à jour sans aucune saisie humaine, éliminant tout risque de double encaissement ou d'omission."
    },
    {
      q: "Que se passe-t-il si la connexion internet est interrompue à l'école ?",
      a: "EcoSurv intègre un mécanisme résilient adapté aux réalités des réseaux télécoms locaux. Vos caissiers peuvent continuer à saisir les encaissements au guichet hors-ligne. Dès que la connexion est rétablie, les données se synchronisent automatiquement avec le serveur central en toute sécurité."
    },
    {
      q: "Combien de temps faut-il pour migrer nos élèves depuis nos anciens fichiers Excel ?",
      a: "Moins de 24 heures. Notre équipe technique basée à Nouakchott prend en charge l'importation complète de vos listes d'élèves, de vos classes et de l'historique des paiements de l'exercice en cours sans perturber vos opérations quotidiennes."
    },
    {
      q: "Les données des élèves et des familles sont-elles protégées en Mauritanie ?",
      a: "Absolument. EcoSurv respecte scrupuleusement la réglementation de l'Autorité de Protection des Données à Caractère Personnel (APDP) de Mauritanie. Les bases de données sont isolées par établissement (architecture RLS avec 77 règles de sécurité strictes) et les flux bancaires sont chiffrés selon les normes TLS 1.3."
    },
    {
      q: "Les parents doivent-ils installer une application compliquée ?",
      a: "Non. Les parents reçoivent leurs avis d'échéances et leurs quittances officielles directement par SMS et WhatsApp avec un lien sécurisé unique vers leur portail web mobile. Aucune installation lourde ni création de compte complexe n'est requise."
    },
    {
      q: "Proposez-vous une formation pour le secrétariat et les enseignants ?",
      a: "Oui, chaque souscription inclut une formation sur site ou en visioconférence pour le directeur, le comptable, les caissiers et les enseignants, complétée par une assistance WhatsApp dédiée disponible 6 jours sur 7."
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
            <a href="#solutions" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Solutions
            </a>
            <a href="#parcours" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Comment ça marche
            </a>
            <a href="#simulateur" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Simulateur ROI
            </a>
            <a href="#portails" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Portails
            </a>
            <a href="#tarifs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Tarifs
            </a>
          </nav>

          {/* Actions & Theme toggle */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
              aria-label="Basculer le thème"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* In-app Portal Quick Launch */}
            <button
              type="button"
              onClick={() => handleLaunchPortal('directeur')}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 group"
            >
              <span>Accéder à la démo</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
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
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              Solutions
            </a>
            <a
              href="#parcours"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              Comment ça marche
            </a>
            <a
              href="#simulateur"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              Simulateur ROI
            </a>
            <a
              href="#portails"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              Les 4 Portails Démo
            </a>
            <a
              href="#tarifs"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1.5"
            >
              Tarifs en MRU
            </a>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunchPortal('directeur');
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold text-center shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Accéder à la démo interactive</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Inspiration Sama Boutik: Punchy, pain-point killer, metrics, live preview) */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24 bg-grid-pattern">
        {/* Atmosphere Glowing Meshes */}
        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-aurora" />
        <div className="absolute top-20 right-1/4 translate-x-1/2 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-aurora" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Copy & Conversion (Centré optiquement) */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="lg:col-span-6 space-y-6 flex flex-col items-center text-center"
            >
              {/* Local Trust Pill with Beacon */}
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold shadow-xs backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Spécial Établissements Privés • Mauritanie</span>
              </motion.div>

              {/* Main Headline simplifié, percutant et animé */}
              <motion.h1 
                variants={fadeInUp} 
                className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.12] text-slate-950 dark:text-white"
              >
                <span>Zéro impayé. </span>
                <motion.span 
                  initial={{ opacity: 0.8, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400 inline-block"
                >
                  Trésorerie scolaire
                </motion.span>
                <br className="hidden sm:inline" />
                <span> en temps réel.</span>
              </motion.h1>

              {/* Sub-headline addressing specific local pain points */}
              <motion.p variants={fadeInUp} className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mx-auto">
                Suivez qui a payé, qui est en retard et où en est la caisse sans approximations. Encaissement instantané via <span className="font-bold text-blue-600 dark:text-blue-400">Bankily</span>, <span className="font-bold text-emerald-600 dark:text-emerald-400">Masrvi</span> et <span className="font-bold text-indigo-600 dark:text-indigo-400">Sedad</span>, relances automatiques et quittances officielles DGI.
              </motion.p>

              {/* CTA Unique et percutant */}
              <motion.div variants={fadeInUp} className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleLaunchPortal('directeur')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Tester la démo interactive</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              {/* Live proof metrics centrées */}
              <motion.div variants={fadeInUp} className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto text-center w-full">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    98.4%
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Taux d'encaissement moyen
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                    &lt; 30s
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Encaissement & reçu DGI
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                    100%
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Conformité APDP & RLS
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Interactive Mockup Showcase */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 50, damping: 20, delay: 0.4 }}
              className="lg:col-span-6 relative z-10"
            >
              <LandingMockupPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Partners & Mobile Money Bar */}
      <section className="border-y border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Paiements & Réglementation
              </p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                Intégration directe des canaux financiers mauritaniens
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-bold">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span>Bankily (BPM)</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Masrvi (BMCI)</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                <span>Sedad (BCI)</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <FileCheck className="h-4 w-4 text-amber-600" />
                <span>Reçus Certifiés DGI</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Protection APDP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section Problème vs Solution (Hier vs Aujourd'hui) */}
      <section className="py-16 sm:py-24" id="solutions">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-14 space-y-3"
          >
            <motion.span variants={fadeInUp} className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              L'expertise financière scolaire
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Conçu pour éliminer définitivement les fuites de trésorerie
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Les carnets de reçus à souche et les tableurs manuels causent jusqu'à 22% de pertes d'encaissement annuelles dans les écoles privées de Nouakchott. EcoSurv consolide chaque ouguiya.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {/* Carte 1 */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80 shadow-2xs">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Visibilité trésorerie en temps réel
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Consultez instantanément le montant collecté et les arriérés par cycle (maternelle, primaire, collège, lycée) ou matricule. Anticipez la paie du corps professoral sans angoisse de solde.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Rapprochement certifié minute par minute</span>
              </div>
            </motion.div>

            {/* Carte 2 */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/80 shadow-2xs">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Paiements mobiles intégrés (MRU)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Rapprochement transparent des flux Bankily, Masrvi et Sedad. Les parents règlent depuis leur téléphone : l'encaissement est validé et la quittance est archivée sans saisie fastidieuse.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Zéro divergence entre relevé bancaire et caisse</span>
              </div>
            </motion.div>

            {/* Carte 3 */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/80 shadow-2xs">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Relances intelligentes par WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Planifiez l'envoi d'avis bienveillants bilingues (Arabe & Français) à J-5, J-1 et J+3. Réduisez le taux d'impayés de 70% sans confrontations directes embarrassantes au portail de l'école.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Messages pré-remplis avec lien de paiement</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. Interactive Journey Timeline (Cycle complet de l'établissement) */}
      <section className="py-16 sm:py-20" id="parcours">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <InteractiveJourneyTimeline />
        </div>
      </section>

      {/* 6. Simulateur ROI interactif */}
      <section className="py-16 sm:py-20" id="simulateur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RoiCalculator onOpenDemoModal={() => setIsDemoModalOpen(true)} />
        </div>
      </section>

      {/* 7. Les 4 Portails Spécifiques Dédiés */}
      <section className="py-16 sm:py-24 bg-slate-100/40 dark:bg-slate-900/40" id="portails">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-14 space-y-3"
          >
            <motion.span variants={fadeInUp} className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Expérience Multi-Rôles Dédiée
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Un espace pensé pour chaque acteur de votre établissement
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              La sécurité RLS garantit que chaque utilisateur n'accède qu'aux données strictement autorisées. Testez chacun des 4 portails en direct dès maintenant.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Portail 1: Directeur */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Portail Directeur & DAF
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pilotage global de la trésorerie, suivi des encaissements par classe, export des bilans comptables et gestion des remises de scolarité.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleLaunchPortal('directeur')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Tester vue Directeur</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>

            {/* Portail 2: Caissier */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
                  <Banknote className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Guichet Caissier
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Encaissement en 3 clics (Bankily, Masrvi, espèces), génération de quittances imprimables et clôture automatique de caisse sans écarts.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleLaunchPortal('caissier')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Tester vue Caissier</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>

            {/* Portail 3: Parent */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Portail Parents
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Consultation sécurisée des échéances de leurs enfants, téléchargement des reçus officiels DGI et paiement mobile sans déplacement physique.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleLaunchPortal('parent')}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Tester vue Parent</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>

            {/* Portail 4: Enseignant */}
            <motion.div variants={fadeInUp} className="gradient-border-card p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Espace Enseignant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Appel d'assiduité numérique en classe, signalement des retards et saisie des évaluations avec séparation étanche des données financières.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleLaunchPortal('enseignant')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Tester vue Enseignant</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 8. Mauritania Wilayas Interactive Showcase */}
      <section className="py-16 sm:py-20" id="regions">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MauritaniaWilayasShowcase />
        </div>
      </section>

      {/* 9. Grille Tarifaire Transparente en MRU */}
      <section className="py-16 sm:py-24 bg-slate-100/50 dark:bg-slate-900/30" id="tarifs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-2xl mx-auto mb-12 space-y-3"
          >
            <motion.span variants={fadeInUp} className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Investissement Prévisible & Rentable
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Tarifs adaptés aux réalités mauritaniennes
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Tarification claire en Ouguiya (MRU), sans frais cachés ni commissions arbitraires sur vos encaissements d'élèves.
            </motion.p>

            {/* Monthly / Yearly Toggle */}
            <motion.div variants={fadeInUp} className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${pricingCycle === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                Facturation Mensuelle
              </span>
              <button
                type="button"
                onClick={() => setPricingCycle(pricingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-700 p-0.5 transition-colors relative"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white dark:bg-blue-500 shadow-sm transition-transform ${
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
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch"
          >
            {/* Offre 1: Essentiel */}
            <motion.div variants={fadeInUp} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Formule Essentiel</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Écoles de quartier jusqu'à 250 élèves</p>
                  </div>
                </div>

                <div className="mt-6 pb-6 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {pricingCycle === 'monthly' ? '15 000' : '12 750'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MRU / mois</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Jusqu'à 250 dossiers élèves actifs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Guichet de caisse & reçus numérotés DGI</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Rapprochement caisse espèces & chèques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Relances par SMS groupés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Support par ticket & email</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-bold transition-colors"
                >
                  Choisir Essentiel
                </button>
              </div>
            </motion.div>

            {/* Offre 2: Pro Établissement (Highlight) */}
            <motion.div variants={fadeInUp} className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 p-8 shadow-xl relative flex flex-col justify-between ring-4 ring-blue-500/10">
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

                <div className="mt-6 pb-6 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {pricingCycle === 'monthly' ? '35 000' : '29 750'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MRU / mois</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Tout le pack Essentiel, plus :</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Intégration directe Bankily, Masrvi & Sedad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Relances WhatsApp automatiques (J-5, J-1, J+3)</span>
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

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25"
                >
                  Démarrer l'essai Pro 14 jours
                </button>
              </div>
            </motion.div>

            {/* Offre 3: Réseau Scolaire */}
            <motion.div variants={fadeInUp} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Réseau Scolaire</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Complexes, universités & multi-campus</p>
                  </div>
                </div>

                <div className="mt-6 pb-6 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    Sur Mesure
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Devis personnalisé</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-700 dark:text-slate-300">
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
                    <span>Intégration API avec votre comptabilité existante</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Gestion des bourses et subventions d'État</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Interlocuteur unique & Support sur site H24</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => window.location.href = 'mailto:contact@ecosurv.mr'}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-bold transition-colors"
                >
                  Contacter les Ventes
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 10. FAQ Accordéon Interactive */}
      <section className="py-16 sm:py-20 bg-slate-100/40 dark:bg-slate-900/40" id="faq">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Questions Fréquentes
            </span>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">
              Tout ce que vous devez savoir avant de commencer
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-stagger-rise">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. Bannière CTA Pré-Footer avec relief, texture et lumière d'ambiance */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-950 text-white border-y border-white/10 shadow-2xl">
        {/* Motif de texture en arrière-plan (grid pattern) */}
        <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

        {/* Orbes lumineux et halos dégradés pour briser la platitude */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none animate-aurora" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none animate-aurora" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/25 shadow-inner">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Rentrée 2026-2027</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Prêt à sécuriser les rentrées scolaires de votre établissement ?
              </h2>
              <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
                Rejoignez les directions scolaires mauritaniennes qui ont éliminé les litiges de caisse et divisé leurs impayés par trois.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Réserver ma démo gratuite</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchPortal('directeur')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold text-sm border border-white/20 hover:border-white/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Accéder à l'application démo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Footer Institutionnel Complet */}
      <footer className="bg-slate-950 text-slate-400 py-12 sm:py-16 text-xs border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
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
              <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <p>📍 Ilot K, Avenue Charles de Gaulle, Tevragh-Zeina, Nouakchott</p>
                <p>📞 +222 45 25 00 00 / +222 36 00 00 00</p>
                <p>✉️ contact@ecosurv.mr</p>
              </div>
            </div>

            {/* Colonne 2: Plateforme */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plateforme</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#solutions" className="hover:text-white transition-colors">
                    Tableau de bord DAF
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-white transition-colors">
                    Guichet Bankily & Masrvi
                  </a>
                </li>
                <li>
                  <a href="#portails" className="hover:text-white transition-colors">
                    Portail Tuteurs & Quittances
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
                  <a href="#solutions" className="hover:text-white transition-colors">
                    Conformité DGI Mauritanie
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-white transition-colors">
                    Protection des données APDP
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-white transition-colors">
                    Sécurité bancaire TLS 1.3
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-white transition-colors">
                    Isolation multi-tenant RLS
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 4: Assistance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Assistance</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsDemoModalOpen(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    Demander une démo WhatsApp
                  </button>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Centre d'aide & FAQ
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleLaunchPortal('directeur')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Tester les 4 portails en direct
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

      {/* Modal de réservation de démo */}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onLaunchDemoApp={() => handleLaunchPortal('directeur')}
      />
    </div>
  );
};
