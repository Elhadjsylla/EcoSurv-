import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface RoiCalculatorProps {
  onNavigateToLogin?: () => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onNavigateToLogin }) => {
  const [elevesCount, setElevesCount] = useState<number>(450);
  const [fraisMensuel, setFraisMensuel] = useState<number>(4000);
  const [tauxActuel, setTauxActuel] = useState<number>(82);

  // 9 mois de facturation scolaire
  const MOIS_SCOLAIRES = 9;
  const budgetAnnuel = elevesCount * fraisMensuel * MOIS_SCOLAIRES;

  // Pertes actuelles estimées
  const pertesActuelles = budgetAnnuel * ((100 - tauxActuel) / 100);

  // Taux moyen mesuré avec EcoSurv (96.5%)
  const tauxEcoSurv = 96.5;
  const gainTaux = Math.max(0, tauxEcoSurv - tauxActuel);
  const tresorerieRecuperee = Math.round(budgetAnnuel * (gainTaux / 100));

  // Heures administratives économisées (écriture manuelle de reçus, pointages, relances manuelles par téléphone)
  const heuresGagneesMois = Math.round((elevesCount * 14) / 60);

  const formatMRU = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left column: Sliders */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
              <Calculator className="h-3.5 w-3.5" />
              <span>Simulateur Financier Mauritanien</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Calculez la trésorerie récupérable dans votre établissement
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Ajustez votre effectif et vos frais mensuels pour estimer immédiatement le gain net annuel et le temps gagné par votre secrétariat.
            </p>
          </div>

          <div className="space-y-5 bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80">
            {/* Slider 1: Effectif d'élèves */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Effectif total de l'école</span>
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {elevesCount} élèves
                </span>
              </div>
              <input
                type="range"
                min={80}
                max={1500}
                step={10}
                value={elevesCount}
                onChange={(e) => setElevesCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>80 élèves</span>
                <span>750 élèves</span>
                <span>1 500 élèves</span>
              </div>
            </div>

            {/* Slider 2: Frais moyens de scolarité */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Frais moyens mensuels / élève</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatMRU(fraisMensuel)} MRU
                </span>
              </div>
              <input
                type="range"
                min={1500}
                max={15000}
                step={250}
                value={fraisMensuel}
                onChange={(e) => setFraisMensuel(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>1 500 MRU</span>
                <span>8 000 MRU</span>
                <span>15 000 MRU</span>
              </div>
            </div>

            {/* Slider 3: Taux de recouvrement actuel */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Taux de recouvrement actuel (sans relance auto)</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {tauxActuel}%
                </span>
              </div>
              <input
                type="range"
                min={65}
                max={92}
                step={1}
                value={tauxActuel}
                onChange={(e) => setTauxActuel(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>65% (Forts impayés)</span>
                <span>80% (Moyenne)</span>
                <span>92% (Bon niveau)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right column: Results Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5"
        >
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/90 border-2 border-emerald-500/40 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Bilan Prévisionnel
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Taux cible EcoSurv : 96.5%
              </span>
            </div>

            {/* Main Recovered Cash Amount */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300">
                Trésorerie nette récupérée par an
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  +{formatMRU(tresorerieRecuperee)}
                </span>
                <span className="text-base font-bold text-slate-400 font-mono">MRU</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Argent auparavant perdu en fin d'exercice</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Budget annuel total</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  {formatMRU(budgetAnnuel)} MRU
                </p>
                <p className="text-[10px] text-red-400 font-mono mt-0.5">
                  Dont ~{formatMRU(pertesActuelles)} MRU impayés
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Temps secrétariat gagné</span>
                <p className="text-sm font-bold text-blue-400 font-mono mt-0.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{heuresGagneesMois}h / mois
                </p>
                <p className="text-[10px] text-blue-300 mt-0.5">
                  Moins de pointages manuels
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 leading-relaxed">
              💡 <strong>Constat DAF :</strong> L'abonnement EcoSurv est amorti dès les <strong>4 premiers jours</strong> de chaque mois grâce à l'élimination des retards Bankily et Masrvi.
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToLogin) {
                  onNavigateToLogin();
                } else {
                  window.open('https://wa.me/22246000000?text=Bonjour,%20je%20souhaite%20une%20étude%20personnalisée%20EcoSurv', '_blank');
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sécuriser ma trésorerie avec EcoSurv</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
