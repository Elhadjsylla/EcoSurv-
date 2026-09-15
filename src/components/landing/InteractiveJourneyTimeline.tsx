import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  Smartphone,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Receipt,
} from 'lucide-react';

export const InteractiveJourneyTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      title: "1. Échéancier & Relance Préventive",
      badge: "J-3 avant échéance",
      icon: <CalendarClock className="h-5 w-5" />,
      tagline: "Fini les appels embarrassants et les listes d'élèves griffonnées",
      description:
        "EcoSurv calcule automatiquement les échéances mensuelles selon les classes et remises de fratrie. Les parents reçoivent un rappel bienveillant par WhatsApp avec le montant exact et le code marchand de l'établissement.",
      statHighlight: "98.4% de réception effective sur WhatsApp & SMS",
      demoPreview: (
        <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Sparkles className="h-3.5 w-3.5" /> Automate de Relance EcoSurv
            </span>
            <span className="text-emerald-400">Prêt à l'envoi</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed">
            « Bonjour M. Kane, l'échéance de scolarité pour Oumar (Terminale D) arrive à échéance le 05/03 (45 000 MRU). Règlement sans frais via Bankily ou Masrvi. »
          </p>
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-[11px] text-emerald-400 flex items-center justify-between">
            <span>Déclenchement groupé : 142 familles</span>
            <span className="font-bold">0 seconde de travail humain</span>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: "2. Règlement Instantané Mobile Money",
      badge: "Temps réel",
      icon: <Smartphone className="h-5 w-5" />,
      tagline: "Le parent règle depuis son canapé en 30 secondes",
      description:
        "Plus besoin pour les parents de traverser les embouteillages de Nouakchott pour faire la queue devant la caisse de l'école. Ils effectuent leur virement Bankily (BPM), Masrvi (BMCI) ou Sedad (BCI) directement depuis leur téléphone.",
      statHighlight: "< 4 secondes pour certifier la transaction",
      demoPreview: (
        <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Zap className="h-3.5 w-3.5" /> Passerelle Bankily Direct
            </span>
            <span className="text-emerald-400">Rapprochement OK</span>
          </div>
          <div className="space-y-1 text-slate-200">
            <div className="flex justify-between">
              <span>Élève :</span>
              <span className="font-bold text-white">Oumar Kane (Matr. #ES-2024-098)</span>
            </div>
            <div className="flex justify-between">
              <span>Montant :</span>
              <span className="font-bold text-emerald-400 text-sm">45 000 MRU</span>
            </div>
            <div className="flex justify-between">
              <span>Réf. Banque :</span>
              <span className="text-slate-400">TX-BKL-9982410-MRU</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-[11px] text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Encaissement validé sans intervention du caissier</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "3. Reçu Inviolable & Quittance DGI QR",
      badge: "Conformité Fiscale",
      icon: <Receipt className="h-5 w-5" />,
      tagline: "Zéro falsification, zéro contestation de reçu",
      description:
        "Dès le paiement validé, la quittance officielle numérotée selon les exigences de la Direction Générale des Impôts (DGI) est générée avec un QR Code d'authenticité et transmise immédiatement sur le WhatsApp du tuteur.",
      statHighlight: "100% conforme audits fiscaux & inspection académique",
      demoPreview: (
        <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="text-blue-400 font-bold">REÇU OFFICIEL N° 2025-RC-0492</span>
            <span className="text-slate-400">Horodaté 11:32</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/90 space-y-1.5 text-[11px]">
            <p className="text-slate-400 font-sans">
              Établissement : <strong className="text-white">Lycée d'Excellence El-Amel</strong>
            </p>
            <p className="text-slate-400 font-sans">
              Bénéficiaire : <strong className="text-white">Oumar Kane — Terminale D</strong>
            </p>
            <p className="text-emerald-400 font-bold text-sm">
              Soldé : 45 000 MRU (Reste à payer : 0 MRU)
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> Signature numérique SHA-256
            </span>
            <span className="underline cursor-pointer text-blue-400">Télécharger PDF</span>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "4. Trésorerie Sécurisée & Clôture en 1 Clic",
      badge: "Sérénité DAF",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      tagline: "La direction pilote en toute transparence et anticipe les salaires",
      description:
        "Le directeur et le DAF visualisent en temps réel la trésorerie disponible, le taux de recouvrement par niveau et la ventilation par canal de paiement. La paie des professeurs est garantie à la fin du mois sans angoisse.",
      statHighlight: "+18.4% de trésorerie nette sécurisée chaque année",
      demoPreview: (
        <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="text-emerald-400 font-bold">Bilan Recouvrement du Mois</span>
            <span className="text-blue-400 font-bold">96.8% atteint</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-800/80">
              <span className="text-[10px] text-slate-400">Caisse Banque & Mobile</span>
              <p className="font-bold text-white text-sm mt-0.5">4 850 000 MRU</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/80">
              <span className="text-[10px] text-slate-400">Masse salariale couverte</span>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">100% Sécurisée</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-[11px] text-blue-300 flex items-center justify-between">
            <span>Export comptable DGI / FEC</span>
            <span className="font-bold text-white">Généré en 1 clic</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Zap className="h-3.5 w-3.5" />
            <span>Cycle Opérationnel Continu</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Comment EcoSurv automatise 100% de votre recouvrement
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Cliquez sur chaque étape pour visualiser la fluidité de l'expérience entre le parent, le caissier et la direction.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {steps.map((step) => {
            const isSelected = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`p-3.5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-blue-600/25 border-blue-500 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/40'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    0{step.id + 1}
                  </span>
                </div>
                <h4
                  className={`text-xs font-bold leading-snug line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {step.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Box */}
        <div className="rounded-3xl bg-slate-800/70 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left explanation */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    {steps[activeStep].badge}
                  </span>
                  <span className="text-xs text-slate-400">Étape {activeStep + 1} sur 4</span>
                </div>

                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {steps[activeStep].title}
                </h4>

                <p className="text-blue-400 font-semibold text-xs sm:text-sm">
                  {steps[activeStep].tagline}
                </p>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {steps[activeStep].description}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{steps[activeStep].statHighlight}</span>
                </div>
              </div>

              {/* Right Live Simulation */}
              <div className="lg:col-span-6">
                {steps[activeStep].demoPreview}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Simulation interactive EcoSurv v2.4</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-1"
            >
              <span>Suivant</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
