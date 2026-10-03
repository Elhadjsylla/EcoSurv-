import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Banknote,
  Smartphone,
  CheckCircle2,
  Receipt,
  RotateCcw,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

type Channel = 'especes' | 'bankily' | 'masrvi' | 'sedad';

interface HonestProductDemoProps {
  onNavigateToLogin?: () => void;
}

export const HonestProductDemo: React.FC<HonestProductDemoProps> = () => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedChannel, setSelectedChannel] = useState<Channel>('bankily');
  const [isPaid, setIsPaid] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handlePay = () => {
    setIsPaid(true);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3500);
  };

  const handleReset = () => {
    setIsPaid(false);
    setShowNotification(false);
  };

  const channelLabels: Record<Channel, { label: string; icon: React.ReactNode }> = {
    especes: { label: 'Espèces (Guichet)', icon: <Banknote className="h-4 w-4" /> },
    bankily: { label: 'Bankily', icon: <Smartphone className="h-4 w-4" /> },
    masrvi: { label: 'Masrvi', icon: <Smartphone className="h-4 w-4" /> },
    sedad: { label: 'Sedad', icon: <Smartphone className="h-4 w-4" /> },
  };

  return (
    <div className="relative rounded-3xl bg-slate-900 border border-slate-800 text-white p-5 sm:p-8 shadow-xl max-w-3xl mx-auto overflow-hidden">
      {/* Toast Notification sobre */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Paiement fictif enregistré pour l'exemple</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* En-tête démonstration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span>Simulation interactive</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">Exemple fictif</span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              Guichet de l'établissement • Illustration du fonctionnement
            </div>
          </div>

          <AnimatePresence>
            {isPaid && (
              <motion.button
                key="reset-btn"
                type="button"
                onClick={handleReset}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Réinitialiser la démo</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Fiche Élève fictive pour la démonstration */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-bold text-sm">
              ET
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Élève Test (Exemple)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-700/80 text-slate-300 border border-slate-600">Démo</span>
              </div>
              <div className="text-xs text-slate-400">Classe : Classe Démo • Échéance mensuelle : 15 000 MRU</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Statut :</span>
            <AnimatePresence mode="wait">
              {isPaid ? (
                <motion.span
                  key="paid-status"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Dossier à jour
                </motion.span>
              ) : (
                <motion.span
                  key="pending-status"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                >
                  Échéance en attente
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Étape d'action : Transition fluide entre formulaire et reçu */}
        <AnimatePresence mode="wait">
          {!isPaid ? (
            <motion.div
              key="action-form"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 pt-1"
            >
              <div className="text-xs font-semibold text-slate-300">
                1. Choisissez le canal de règlement pour tester :
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(channelLabels) as Channel[]).map((ch) => {
                  const isSelected = selectedChannel === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md -translate-y-0.5'
                          : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {channelLabels[ch].icon}
                      <span>{channelLabels[ch].label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                >
                  <span>Tester l'encaissement de 15 000 MRU</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="receipt-view"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-emerald-800/40 pb-2 gap-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Receipt className="h-4 w-4" />
                  <span>Reçu Fictif N° DEMO-001</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700">Exemple</span>
                </div>
                <span className="text-[11px] text-slate-300 font-mono">
                  Canal : {channelLabels[selectedChannel].label} • 15 000 MRU
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Dans l'application réelle, l'opération est immédiatement inscrite au journal de caisse, le solde de l'élève passe à zéro et la quittance officielle numérotée est générée.
              </p>

              <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Opération de caisse instantanée sans calculatrice ni rature</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
