import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
  Smartphone,
  Receipt,
  MessageCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Printer,
  Sparkles,
  Zap,
} from 'lucide-react';

type MockupTab = 'directeur' | 'guichet' | 'whatsapp' | 'recu';

export const LandingMockupPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MockupTab>('directeur');
  const [paymentChannel, setPaymentChannel] = useState<'bankily' | 'masrvi' | 'especes'>('bankily');

  return (
    <div className="relative w-full">
      {/* Decorative Aurora Glow behind mockup */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-600/30 via-indigo-500/20 to-emerald-500/30 blur-xl opacity-75 animate-aurora pointer-events-none" />

      {/* Floating Badge 1: Top Right Live Transaction */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="hidden sm:flex absolute -top-4 -right-4 z-20 items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-xl"
      >
        <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">Bankily Direct</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            +45 000 MRU validé
          </p>
        </div>
      </motion.div>

      {/* Floating Badge 2: Bottom Left Automated Reminder */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="hidden sm:flex absolute -bottom-5 -left-4 z-20 items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-xl"
      >
        <div className="h-7 w-7 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white">Relance WhatsApp J-3</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Taux de réponse : 98.4%</p>
        </div>
      </motion.div>

      {/* Main Mockup Card Container */}
      <div className="relative rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
        {/* Top Window Chrome & Tab Switcher */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 px-4 py-3 backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          {/* Interactive Navigation Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('directeur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'directeur'
                  ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Pilotage DAF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guichet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'guichet'
                  ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Guichet Bankily</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'whatsapp'
                  ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp Auto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recu')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'recu'
                  ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Reçu DGI QR</span>
            </button>
          </div>

          {/* Institutional Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Nouakchott • En Direct</span>
          </div>
        </div>

        {/* Content Wrapper for AnimatePresence */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {/* Tab Content 1: Pilotage DAF & Direction */}
            {activeTab === 'directeur' && (
              <motion.div 
                key="directeur"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4 sm:p-6 space-y-4"
              >
            {/* Header School Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80 shadow-2xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Lycée d'Excellence El-Amel
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tevragh-Zeina • Année 2024-2025 • 482 élèves
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] font-bold self-start sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Exercice Actif • RLS Isolé</span>
              </div>
            </div>

            {/* KPI Cards in MRU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-100 dark:border-slate-800/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Recouvré ce mois (MRU)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    +18.4%
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                    4 850 000
                  </span>
                  <span className="text-xs font-bold text-slate-500">MRU</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Rapprochement Mobile Money direct</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-100 dark:border-slate-800/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reste exigible en retard
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    28 élèves
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                    310 000
                  </span>
                  <span className="text-xs font-bold text-slate-500">MRU</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Relances WhatsApp auto programmées</span>
                </div>
              </div>
            </div>

            {/* SVG Weekly Evolution Chart */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Tendance des encaissements (Semaine 1 à 4)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  94.8% d'objectifs atteints
                </span>
              </div>
              <div className="h-20 w-full relative">
                <svg className="h-full w-full text-blue-600 dark:text-blue-500" preserveAspectRatio="none" viewBox="0 0 400 80">
                  <defs>
                    <linearGradient id="gradMockupArt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 65 Q 60 50, 120 42 T 240 28 T 320 18 T 400 8 L 400 80 L 0 80 Z" fill="url(#gradMockupArt)" />
                  <path d="M0 65 Q 60 50, 120 42 T 240 28 T 320 18 T 400 8" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="120" cy="42" r="4" className="fill-blue-600 dark:fill-blue-400" />
                  <circle cx="240" cy="28" r="4" className="fill-blue-600 dark:fill-blue-400" />
                  <circle cx="320" cy="18" r="4" className="fill-blue-600 dark:fill-blue-400" />
                  <circle cx="400" cy="8" r="5" className="fill-emerald-500 animate-pulse" />
                </svg>
              </div>
            </div>

            {/* Live Certified Transactions Feed */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Dernières transactions certifiées</span>
                <span>Canal / Montant</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      AB
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Ahmed Salem Bilal</p>
                      <p className="text-[11px] text-slate-500">Terminale D • Reçu #2025-0981</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 dark:text-white">45 000 MRU</p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Bankily Direct
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      FD
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Fatimetou Diop</p>
                      <p className="text-[11px] text-slate-500">3ème Année • Reçu #2025-0982</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 dark:text-white">35 000 MRU</p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Masrvi BMCI
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          )}

          {/* Tab Content 2: Guichet Bankily */}
          {activeTab === 'guichet' && (
            <motion.div 
              key="guichet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-6 space-y-4"
            >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Guichet Caisse N°1 — Encaissement express
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Règlement Échéance Scolarité
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                Rapprochement en 4s
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Élève au guichet</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Aminetou Mint Cheikh
                </p>
                <p className="text-xs text-slate-500">
                  Matricule: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">ES-2025-042</span> • 6ème A
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Échéance à régler</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Frais de scolarité — Mars 2025
                </p>
                <p className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  35 000 MRU <span className="text-[10px] font-normal text-slate-500">(Net sans commission)</span>
                </p>
              </div>
            </div>

            {/* Canal de réception */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Canal d'encaissement instantané
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentChannel('bankily')}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    paymentChannel === 'bankily'
                      ? 'border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 shadow-xs ring-2 ring-blue-600/15 font-bold'
                      : 'border border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className={`h-5 w-5 mb-1 ${paymentChannel === 'bankily' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${paymentChannel === 'bankily' ? 'font-bold text-blue-800 dark:text-blue-200' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    Bankily
                  </span>
                  <span className={`text-[10px] font-mono ${paymentChannel === 'bankily' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                    BPM #98214
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('masrvi')}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    paymentChannel === 'masrvi'
                      ? 'border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 shadow-xs ring-2 ring-blue-600/15 font-bold'
                      : 'border border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className={`h-5 w-5 mb-1 ${paymentChannel === 'masrvi' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${paymentChannel === 'masrvi' ? 'font-bold text-blue-800 dark:text-blue-200' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    Masrvi
                  </span>
                  <span className={`text-[10px] font-mono ${paymentChannel === 'masrvi' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                    BMCI #44012
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('especes')}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    paymentChannel === 'especes'
                      ? 'border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 shadow-xs ring-2 ring-blue-600/15 font-bold'
                      : 'border border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Receipt className={`h-5 w-5 mb-1 ${paymentChannel === 'especes' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${paymentChannel === 'especes' ? 'font-bold text-blue-800 dark:text-blue-200' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    Espèces
                  </span>
                  <span className={`text-[10px] ${paymentChannel === 'especes' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'}`}>
                    Caisse physique
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {paymentChannel === 'bankily' && 'Paiement instantané Bankily BPM validé. Quittance officielle générée.'}
                  {paymentChannel === 'masrvi' && 'Paiement certifié Masrvi BMCI reçu. Quittance officielle générée.'}
                  {paymentChannel === 'especes' && 'Encaissement espèces validé à la caisse N°1. Quittance officielle générée.'}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimer
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab Content 3: WhatsApp Auto */}
        {activeTab === 'whatsapp' && (
          <motion.div 
            key="whatsapp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Relance Éducative Automatisée
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Aperçu du message WhatsApp reçu par le parent
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Envoi automatique à J-3
              </span>
            </div>

            {/* Realistic WhatsApp Chat Card */}
            <div className="rounded-2xl bg-[#0b141a] p-4 text-white shadow-inner max-w-md mx-auto font-sans border border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                  ES
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold truncate">EcoSurv • Groupe Scolaire Al-Baraka</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-400">Compte vérifié officiel</p>
                </div>
              </div>

              <div className="mt-3.5 bg-[#1f2c34] p-3.5 rounded-2xl rounded-tl-xs text-xs text-slate-200 leading-relaxed shadow-sm space-y-2">
                <p>
                  <span className="font-bold text-white">Chers parents de Mariam Diallo (CM2),</span>
                </p>
                <p className="text-slate-300">
                  Nous vous informons avec bienveillance que l'échéance de scolarité pour le mois de <strong className="text-white">Mars 2025</strong> (35 000 MRU) arrive à terme le <strong className="text-white">05 Mars</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-[#111b21] border border-slate-700/60 font-mono text-[11px] space-y-1">
                  <p className="text-emerald-400 font-bold">Moyens de paiement directs :</p>
                  <p>• Bankily : Code établissement <span className="text-white font-bold">44021</span></p>
                  <p>• Masrvi : Tél caisse <span className="text-white font-bold">+222 45 25 00 00</span></p>
                </div>
                <p className="text-slate-300">
                  Téléchargez votre quittance officielle dès validation : <span className="text-emerald-400 underline font-semibold">ecosurv.mr/r/2025-0492</span>
                </p>
                <div className="text-right text-[10px] text-slate-400 pt-1 flex items-center justify-end gap-1">
                  <span>10:14</span>
                  <span className="text-blue-400 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Réduit de 70% les impayés sans contact embarrassant
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Français & Arabe
              </span>
            </div>
          </motion.div>
        )}

        {/* Tab Content 4: Reçu DGI QR */}
        {activeTab === 'recu' && (
          <motion.div 
            key="recu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Sécurité Fiscale & Contrôle
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Quittance Scolaire Inaltérable Conforme DGI
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                Inviolable • Horodaté
              </span>
            </div>

            {/* Receipt Card */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    RÉPUBLIQUE ISLAMIQUE DE MAURITANIE
                  </p>
                  <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Groupe Scolaire Al-Baraka — Tevragh-Zeina
                  </h5>
                  <p className="text-[11px] text-slate-500 font-mono">NIF: 00921448-B • Agrément MENESF N° 2019/41</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono font-bold text-xs">
                    REÇU N° 2025-0492
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">14 Mars 2025 à 11:32</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 text-xs border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Élève & Classe</span>
                  <p className="font-bold text-slate-900 dark:text-white">Cheikh Ould Souleymane</p>
                  <p className="text-slate-500">Terminale C • Matricule ES-2024-118</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Paiement & Canal</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">45 000 MRU</p>
                  <p className="text-slate-500">Bankily Direct • Réf TX #BKL-884129</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                    <QrCode className="h-10 w-10 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Signature Cryptographique DGI
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      SHA-256: 8f9b...a41c (Audit conforme)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="h-4 w-4" /> Quittance archivée
                  </span>
                </div>
              </div>
            </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
