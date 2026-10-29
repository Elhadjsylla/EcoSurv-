import React, { useState } from 'react';
import {
  Check,
  Circle,
  FileText,
  Bell,
  Calendar,
  Users,
  CreditCard,
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

  return (
    <div
      aria-label="Aperçu illustratif de l'interface EcoSurv"
      className="w-full rounded-md border border-default bg-surface overflow-hidden"
    >
      {/* Barre supérieure de fenêtre avec étiquette explicite */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-subtle bg-surface-subtle">
        <div className="flex items-center gap-2">
          <LogoIcone size={20} />
          <span className="text-sm font-semibold text-main">EcoSurv</span>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm border border-default bg-surface text-xs font-semibold text-secondary">
          Aperçu illustratif
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
              className={`min-h-[44px] px-3 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                isSelected
                  ? 'border-primary text-primary-text bg-surface'
                  : 'border-transparent text-muted hover:text-main bg-surface-subtle/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu illustratif selon le rôle sélectionné */}
      <div className="p-4 sm:p-5 space-y-4 bg-surface text-left">
        {activeRole === 'directeur' && (
          <div className="space-y-4">
            {/* Carte Pour démarrer */}
            <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-main">Pour démarrer</p>
                  <p className="text-xs text-muted">
                    Configuration pas à pas de l'établissement
                  </p>
                </div>
                <span className="text-xs font-semibold text-secondary">
                  Progression
                </span>
              </div>

              <div className="w-full h-1.5 rounded-sm bg-surface-subtle overflow-hidden">
                <div className="h-full w-1/2 bg-primary rounded-sm" />
              </div>

              <div className="divide-y divide-subtle border-t border-subtle text-xs">
                {[
                  { label: "Profil de l'école (année, ville, +222)", done: true },
                  { label: "Classes de l'école", done: true },
                  { label: 'Barèmes de frais et échéances (MRU)', done: true },
                  { label: 'Inscrire les élèves', done: false },
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
                      {step.done ? 'Terminée' : 'À faire'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation des paiements en attente */}
            <div className="rounded-sm border border-subtle p-3.5 space-y-2.5 bg-surface-subtle">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-main">
                  Paiements en attente de confirmation
                </span>
                <Bell className="h-3.5 w-3.5 text-muted shrink-0" />
              </div>
              <div className="p-2.5 rounded-sm border border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-semibold text-main">
                    Règlement mobile avec référence opérateur
                  </p>
                  <p className="text-muted">
                    Échéance de scolarité en MRU
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-sm bg-primary text-on-primary font-semibold">
                    Confirmer
                  </span>
                  <span className="px-2.5 py-1 rounded-sm border border-default bg-surface text-secondary font-semibold">
                    Rejeter
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeRole === 'caissier' && (
          <div className="space-y-4">
            <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary-text shrink-0" />
                  <span className="text-sm font-bold text-main">
                    Encaissement au guichet
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted">
                  Monnaie : MRU
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['Espèces', 'Bankily', 'Masrvi', 'Sedad'].map((canal, idx) => (
                  <div
                    key={canal}
                    className={`py-2 px-2.5 rounded-sm border text-center font-semibold ${
                      idx === 1
                        ? 'border-primary bg-surface-subtle text-primary-text'
                        : 'border-subtle bg-surface text-secondary'
                    }`}
                  >
                    {canal}
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-sm border border-subtle bg-surface-subtle">
                  <span className="text-muted">Référence opérateur</span>
                  <span className="font-semibold text-main">
                    Saisie obligatoire hors espèces
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-sm border border-subtle bg-surface-subtle">
                  <span className="text-muted">Justificatif</span>
                  <span className="font-semibold text-main flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary-text" />
                    Reçu PDF numéroté
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-subtle flex items-center justify-between gap-2 text-xs">
                <span className="text-muted font-medium">
                  Fin de journée au guichet
                </span>
                <span className="px-2.5 py-1 rounded-sm border border-default bg-surface text-main font-semibold">
                  Clôturer la caisse du jour
                </span>
              </div>
            </div>
          </div>
        )}

        {activeRole === 'enseignant' && (
          <div className="space-y-4">
            <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary-text shrink-0" />
                  <span className="text-sm font-bold text-main">
                    Appel et saisie des absences
                  </span>
                </div>
                <span className="text-xs font-semibold text-secondary">
                  Classe affectée
                </span>
              </div>

              <div className="divide-y divide-subtle text-xs">
                {[
                  { label: 'Élève inscrit — Liste de classe', status: 'Présent' },
                  { label: 'Élève inscrit — Liste de classe', status: 'Absent' },
                  { label: 'Élève inscrit — Liste de classe', status: 'Présent' },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-main">{row.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-sm border font-semibold ${
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
            </div>
          </div>
        )}

        {activeRole === 'parent' && (
          <div className="space-y-4">
            <div className="rounded-sm border border-subtle p-3.5 space-y-3 bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary-text shrink-0" />
                  <span className="text-sm font-bold text-main">
                    Espace parent (téléphone et ordinateur)
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-sm border border-subtle bg-surface-subtle flex items-center justify-between gap-2">
                  <span className="font-medium text-main">
                    Suivi des échéances de scolarité (MRU)
                  </span>
                  <span className="px-2 py-0.5 rounded-sm border border-success-border bg-success-surface text-success-text font-semibold">
                    À jour
                  </span>
                </div>
                <div className="p-2.5 rounded-sm border border-subtle bg-surface-subtle flex items-center justify-between gap-2">
                  <span className="font-medium text-main">
                    Suivi et déclaration d'absence
                  </span>
                  <span className="px-2 py-0.5 rounded-sm border border-default bg-surface text-secondary font-semibold">
                    Déclarer une absence
                  </span>
                </div>
                <div className="p-2.5 rounded-sm border border-subtle bg-surface-subtle flex items-center justify-between gap-2">
                  <span className="font-medium text-main">
                    Notifications reçues dans l'application
                  </span>
                  <Bell className="h-3.5 w-3.5 text-primary-text shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingMockupPreview;
