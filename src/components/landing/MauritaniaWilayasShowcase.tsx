import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp, CheckCircle2, Award } from 'lucide-react';

export const MauritaniaWilayasShowcase: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<'nouakchott' | 'nouadhibou' | 'rosso'>('nouakchott');

  const cityData = {
    nouakchott: {
      name: "Nouakchott (Tevragh-Zeina, Ksar, Sebkha, Toujounine)",
      ecoles: "38 établissements partenaires",
      tauxRecouvrement: "98.4%",
      canaux: [
        { name: "Bankily (BPM)", percent: 64, color: "bg-blue-600" },
        { name: "Masrvi (BMCI)", percent: 24, color: "bg-emerald-600" },
        { name: "Espèces & Sedad", percent: 12, color: "bg-amber-600" },
      ],
      quote:
        "« À Tevragh-Zeina, les parents ne se déplacent plus jamais pour payer. La quittance numérique leur parvient sur WhatsApp avant même qu'ils n'aient raccroché leur application bancaire. »",
      author: "Directrice d'Études — Lycée El-Amel",
    },
    nouadhibou: {
      name: "Dakhlet Nouadhibou (Cap Blanc, Cansado)",
      ecoles: "14 établissements partenaires",
      tauxRecouvrement: "97.6%",
      canaux: [
        { name: "Bankily (BPM)", percent: 58, color: "bg-blue-600" },
        { name: "Masrvi (BMCI)", percent: 30, color: "bg-emerald-600" },
        { name: "Espèces & Sedad", percent: 12, color: "bg-amber-600" },
      ],
      quote:
        "« La synchronisation avec Masrvi et Bankily a résolu notre problème d'arriérés en fin d'année scolaire. Nous avons récupéré plus de 900 000 MRU dès le premier trimestre. »",
      author: "Comptable Principal — Complexe Sahel Nouadhibou",
    },
    rosso: {
      name: "Trarza (Rosso & Boghé)",
      ecoles: "8 établissements partenaires",
      tauxRecouvrement: "95.9%",
      canaux: [
        { name: "Bankily & Sedad", percent: 52, color: "bg-blue-600" },
        { name: "Masrvi (BMCI)", percent: 26, color: "bg-emerald-600" },
        { name: "Espèces Guichet", percent: 22, color: "bg-amber-600" },
      ],
      quote:
        "« Même avec des coupures intermittentes de connexion, le mode déconnecté d'EcoSurv permet à notre caissier de travailler au guichet sans aucun ralentissement. »",
      author: "Fondateur — Institut Islamique Moderne de Rosso",
    },
  };

  const current = cityData[selectedCity];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800/80 mb-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>Présence Nationale en Mauritanie</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Performances constatées dans nos pôles régionaux
          </h3>
        </div>

        {/* City Toggle Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedCity('nouakchott')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'nouakchott'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nouakchott
          </button>
          <button
            type="button"
            onClick={() => setSelectedCity('nouadhibou')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'nouadhibou'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nouadhibou
          </button>
          <button
            type="button"
            onClick={() => setSelectedCity('rosso')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'rosso'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Trarza / Rosso
          </button>
        </div>
      </div>

      {/* City Metrics & Quote Grid */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedCity}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center"
        >
          {/* Left: Key Metrics */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <span className="text-xs text-slate-500 font-medium">Zone couverte :</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {current.name}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Taux de recouvrement moyen
              </span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {current.tauxRecouvrement}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span>Exercice scolaire 2024-2025</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Établissements actifs
              </span>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                {current.ecoles.split(' ')[0]}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Award className="h-3 w-3 text-blue-500" />
                <span>Primaires, collèges et lycées</span>
              </p>
            </div>
          </div>

          {/* Payment Channels Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ventilation des canaux de règlement :
            </span>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              {current.canaux.map((c, i) => (
                <div
                  key={i}
                  style={{ width: `${c.percent}%` }}
                  className={`${c.color} h-full transition-all duration-500`}
                  title={`${c.name} : ${c.percent}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] pt-1">
              {current.canaux.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                  <span>{c.name} ({c.percent}%)</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Testimonial Quote Card */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/70 p-6 sm:p-8 border border-blue-200/60 dark:border-blue-900/60 shadow-md space-y-4 relative">
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed font-sans">
              {current.quote}
            </p>
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {current.author}
                </p>
                <p className="text-[11px] text-slate-500">
                  {current.name.split('(')[0].trim()}
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Client Vérifié
              </span>
            </div>
          </div>
        </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
