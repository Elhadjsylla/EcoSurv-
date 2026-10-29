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

export const HonestProductDemo: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedChannel, setSelectedChannel] = useState<Channel>('bankily');
  const [isPaid, setIsPaid] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handlePay = () => {
    setIsPaid(true);
    setShowNotification(true);
    window.setTimeout(() => {
      setShowNotification(false);
    }, 3500);
  };

  const handleReset = () => {
    setIsPaid(false);
    setShowNotification(false);
  };

  const channelLabels: Record<
    Channel,
    { label: string; refExample: string | null; icon: React.ReactNode }
  > = {
    especes: {
      label: 'Espèces',
      refExample: null,
      icon: <Banknote className="h-4 w-4 shrink-0" />,
    },
    bankily: {
      label: 'Bankily',
      refExample: 'TX-BKL-00412 (Exemple)',
      icon: <Smartphone className="h-4 w-4 shrink-0" />,
    },
    masrvi: {
      label: 'Masrvi',
      refExample: 'TX-MSR-00891 (Exemple)',
      icon: <Smartphone className="h-4 w-4 shrink-0" />,
    },
    sedad: {
      label: 'Sedad',
      refExample: 'TX-SDD-00534 (Exemple)',
      icon: <Smartphone className="h-4 w-4 shrink-0" />,
    },
  };

  const isMobileChannel = selectedChannel !== 'especes';

  return (
    <div className="relative rounded-md bg-slate-950 border border-slate-800 text-white p-5 sm:p-8 shadow-card max-w-3xl mx-auto overflow-hidden">
      {/* Notification sobre d'exemple */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.24,
              ease: 'easeOut',
            }}
            className="mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-emerald-800 border border-emerald-600 text-white font-bold text-xs"
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
            <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex flex-wrap items-center gap-2">
              <span>Simulation interactive du guichet</span>
              <span className="px-2.5 py-0.5 rounded-sm bg-slate-900 text-slate-200 border border-slate-700 text-xs">
                Exemple fictif
              </span>
            </div>
            <p className="text-base font-bold text-white mt-1">
              Guichet de l'établissement • Illustration d'un encaissement
            </p>
          </div>

          <AnimatePresence>
            {isPaid && (
              <motion.button
                key="reset-btn"
                type="button"
                onClick={handleReset}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.96 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.96 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.2,
                  ease: 'easeOut',
                }}
                className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors self-start sm:self-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Réinitialiser la démo</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Fiche Élève fictive pour la démonstration */}
        <div className="p-4 rounded-sm bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-sm bg-[#1D4ED8] flex items-center justify-center text-white shrink-0 font-bold text-sm">
              ET
            </div>
            <div>
              <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                <span>Élève Test (Exemple)</span>
                <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Exemple fictif
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
                Classe : Classe Démo • Échéance mensuelle : 15 000 MRU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Statut :</span>
            <AnimatePresence mode="wait">
              {isPaid ? (
                <motion.span
                  key="paid-status"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.94 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.94 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.22,
                    ease: 'easeOut',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isMobileChannel
                    ? 'Enregistré (avec réf. opérateur)'
                    : 'Dossier à jour'}
                </motion.span>
              ) : (
                <motion.span
                  key="pending-status"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.94 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.94 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.22,
                    ease: 'easeOut',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700"
                >
                  Échéance à régler
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
              initial={
                shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -8 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.24,
                ease: 'easeOut',
              }}
              className="space-y-4 pt-1"
            >
              <div className="text-xs font-semibold text-slate-200">
                1. Choisissez le canal de règlement pour simuler l'opération :
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(channelLabels) as Channel[]).map((ch) => {
                  const isSelected = selectedChannel === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm border text-xs font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                        isSelected
                          ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {channelLabels[ch].icon}
                      <span>{channelLabels[ch].label}</span>
                    </button>
                  );
                })}
              </div>

              {channelLabels[selectedChannel].refExample && (
                <div className="p-3 rounded-sm bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300 font-medium">
                    Référence de l'opérateur (obligatoire hors espèces) :
                  </span>
                  <span className="font-bold text-white tabular-nums">
                    {channelLabels[selectedChannel].refExample}
                  </span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handlePay}
                  className="min-h-[48px] w-full px-6 py-3 rounded-sm bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-white tabular-nums"
                >
                  <span>Simuler l'encaissement de 15 000 MRU</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="receipt-view"
              initial={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -8 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.28,
                ease: 'easeOut',
              }}
              className="p-4 sm:p-5 rounded-sm bg-slate-900 border border-emerald-700 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-slate-800 pb-3 gap-2">
                <div className="flex flex-wrap items-center gap-2 text-emerald-300 font-bold">
                  <Receipt className="h-4 w-4 shrink-0" />
                  <span>Reçu PDF N° DEMO-001</span>
                  <span className="px-2 py-0.5 rounded-sm text-xs bg-slate-800 text-slate-200 border border-slate-700">
                    Exemple fictif
                  </span>
                </div>
                <span className="text-xs text-slate-200 font-semibold tabular-nums">
                  Canal : {channelLabels[selectedChannel].label} • 15 000 MRU
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {isMobileChannel
                  ? "Dans l'application réelle, ce règlement mobile est enregistré avec la référence de l'opérateur en statut en attente pour confirmation par le directeur, et un reçu PDF numéroté peut être émis."
                  : "Dans l'application réelle, ce paiement en espèces met immédiatement à jour le solde de l'échéance dans le journal de caisse et génère un reçu PDF numéroté."}
              </p>

              <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
                <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Enregistrement structuré par élève et par échéance en MRU
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HonestProductDemo;
