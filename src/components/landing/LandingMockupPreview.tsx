import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check,
  Circle,
  FileText,
  Bell,
  Calendar,
  Users,
  CreditCard,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';
import { LogoIcone } from '../ui/Logo';

type PreviewRole = 'directeur' | 'caissier' | 'enseignant' | 'parent';

const ROLE_TABS: { id: PreviewRole; label: string }[] = [
  { id: 'directeur', label: 'Directeur' },
  { id: 'caissier', label: 'Caissier' },
  { id: 'enseignant', label: 'Enseignant' },
  { id: 'parent', label: 'Parent' },
];

export const LandingMockupPreview: React.FC = () => {
  const [activeRole, setActiveRole] = useState<PreviewRole>('directeur');
  const shouldReduceMotion = useReducedMotion();

  const tabVariants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 8,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.24,
        ease: 'easeOut' as const,
      },
    },
    exit: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : -6,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.2,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <div
      aria-label="Aperçu illustratif de l'interface EcoSurv"
      className="w-full rounded-md border border-default bg-surface shadow-card overflow-hidden"
    >
      {/* Barre supérieure de fenêtre avec étiquette explicite */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-subtle bg-surface-subtle">
        <div className="flex items-center gap-2.5">
          <LogoIcone size={22} />
          <div>
            <span className="text-sm font-bold text-main block leading-tight">
              EcoSurv
            </span>
            <span className="text-xs text-muted block leading-tight">
              Aperçu des 4 accès de l'établissement
            </span>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-sm border border-default bg-surface text-xs font-semibold text-secondary">
          Exemple fictif
        </span>
      </div>

      {/* Sélecteur des 4 accès par rôle */}
      <div
        role="tablist"
        aria-label="Aperçu par rôle"
        className="grid grid-cols-2 sm:grid-cols-4 border-b border-subtle bg-surface"
      >
        {ROLE_TABS.map((tab) => {
          const isSelected = activeRole === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveRole(tab.id)}
              className={`min-h-[44px] px-3 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-[-2px] ${
                isSelected
                  ? 'border-[#1D4ED8] text-primary-text bg-surface'
                  : 'border-transparent text-muted hover:text-main bg-surface-subtle'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu illustratif selon le rôle sélectionné */}
      <div className="p-4 sm:p-5 bg-surface text-left min-h-[340px]">
        <AnimatePresence mode="wait">
          {activeRole === 'directeur' && (
            <motion.div
              key="directeur"
              variants={tabVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-4"
            >
              {/* Carte Pour démarrer */}
              <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-primary-text shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-main">
                        Carte « Pour démarrer »
                      </p>
                      <p className="text-xs text-muted">
                        Mise en route pas à pas de l'école
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm bg-surface-subtle border border-subtle text-xs font-bold text-main tabular-nums">
                    4 / 6 étapes
                  </span>
                </div>

                <div className="w-full h-2 rounded-sm bg-surface-subtle overflow-hidden">
                  <div className="h-full w-2/3 bg-[#1D4ED8] rounded-sm" />
                </div>

                <div className="divide-y divide-subtle border-t border-subtle text-xs">
                  {[
                    { label: "Profil de l'école (année, ville, +222)", done: true },
                    { label: "Classes de l'école", done: true },
                    { label: 'Barèmes de frais et échéances (MRU)', done: true },
                    { label: 'Premier élève inscrit', done: true },
                    { label: 'Équipe de l’école (caissier, enseignants)', done: false },
                  ].map((step) => (
                    <div
                      key={step.label}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {step.done ? (
                          <Check className="h-3.5 w-3.5 text-primary-text shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted shrink-0" />
                        )}
                        <span className="text-main font-medium truncate">
                          {step.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-sm border border-subtle bg-surface-subtle text-secondary font-semibold shrink-0">
                        {step.done ? 'Fait' : 'À faire'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation des paiements en attente */}
              <div className="rounded-sm border border-subtle p-3.5 space-y-2.5 bg-surface-subtle">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-main">
                    Paiements en attente de confirmation (Exemple)
                  </span>
                  <Bell className="h-3.5 w-3.5 text-primary-text shrink-0" />
                </div>
                <div className="p-3 rounded-sm border border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-main">
                      Élève Test • Bankily (Réf : TX-DEMO-01)
                    </p>
                    <p className="text-muted tabular-nums">
                      Mensualité de scolarité : 15 000 MRU
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-sm bg-[#1D4ED8] text-white font-semibold">
                      Confirmer
                    </span>
                    <span className="px-2.5 py-1 rounded-sm border border-default bg-surface text-secondary font-semibold">
                      Rejeter
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeRole === 'caissier' && (
            <motion.div
              key="caissier"
              variants={tabVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-4"
            >
              <div className="rounded-sm border border-subtle p-3.5 space-y-3.5 bg-surface">
                <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary-text shrink-0" />
                    <span className="text-sm font-bold text-main">
                      Guichet d'encaissement (Exemple)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-secondary tabular-nums">
                    15 000 MRU
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  {['Espèces', 'Bankily', 'Masrvi', 'Sedad', 'Chèque'].map(
                    (canal, idx) => (
                      <div
                        key={canal}
                        className={`py-2 px-2 rounded-sm border text-center font-semibold ${
                          idx === 1
                            ? 'border-[#1D4ED8] bg-surface-subtle text-primary-text'
                            : 'border-subtle bg-surface text-secondary'
                        }`}
                      >
                        {canal}
                      </div>
                    )
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 px-3 rounded-sm border border-subtle bg-surface-subtle">
                    <span className="text-muted">Référence opérateur</span>
                    <span className="font-semibold text-main tabular-nums">
                      TX-DEMO-8841 (Obligatoire hors espèces)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-sm border border-subtle bg-surface-subtle">
                    <span className="text-muted">Justificatif remis</span>
                    <span className="font-semibold text-main flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary-text" />
                      Reçu PDF numéroté
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-subtle flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted font-medium">
                    Arrêté de fin de journée
                  </span>
                  <span className="px-3 py-1.5 rounded-sm border border-default bg-surface text-main font-semibold">
                    Clôturer la caisse du jour
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeRole === 'enseignant' && (
            <motion.div
              key="enseignant"
              variants={tabVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-4"
            >
              <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
                <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary-text shrink-0" />
                    <span className="text-sm font-bold text-main">
                      Appel et saisie des absences (Exemple)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-secondary">
                    Classe affectée
                  </span>
                </div>

                <div className="divide-y divide-subtle text-xs">
                  {[
                    { label: 'Élève Exemple 1 — Classe Démo', status: 'Présent' },
                    { label: 'Élève Exemple 2 — Classe Démo', status: 'Absent' },
                    { label: 'Élève Exemple 3 — Classe Démo', status: 'Présent' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-main">{row.label}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-sm border font-semibold ${
                          row.status === 'Absent'
                            ? 'border-danger-border bg-danger-surface text-danger-text'
                            : 'border-subtle bg-surface-subtle text-secondary'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs text-muted">
                  <span>Saisie sur téléphone ou ordinateur</span>
                  <span className="font-semibold text-primary-text">
                    Notifications actives
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeRole === 'parent' && (
            <motion.div
              key="parent"
              variants={tabVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-4"
            >
              <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
                <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary-text shrink-0" />
                    <span className="text-sm font-bold text-main">
                      Portail parent (Exemple fictif)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-text">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Suivi en MRU
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-sm border border-subtle bg-surface-subtle flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-main block">
                        Échéances de scolarité et reçus PDF
                      </span>
                      <span className="text-muted">
                        Téléchargement des quittances validées
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-sm border border-success-border bg-success-surface text-success-text font-semibold shrink-0">
                      À jour
                    </span>
                  </div>

                  <div className="p-2.5 rounded-sm border border-subtle bg-surface-subtle flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-main block">
                        Suivi et déclaration d'absence
                      </span>
                      <span className="text-muted">
                        Consultation des absences saisies en classe
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-sm border border-default bg-surface text-secondary font-semibold shrink-0">
                      Déclarer
                    </span>
                  </div>

                  <div className="p-2.5 rounded-sm border border-subtle bg-surface-subtle flex items-center justify-between gap-2">
                    <span className="font-semibold text-main">
                      Notifications reçues dans l'application
                    </span>
                    <Bell className="h-4 w-4 text-primary-text shrink-0" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LandingMockupPreview;
