import React, { useState } from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Plus,
  Inbox,
  X,
  CreditCard,
  Users,
  Wallet,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';

export const DesignPreviewPage: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [showToast, setShowToast] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('1AF');
  const [selectedDate, setSelectedDate] = useState('2026-10-17');

  const classeOptions = [
    { value: '1AF', label: '1AF (CI / CP1)', description: 'Fondamental' },
    { value: '2AF', label: '2AF (CP / CP2)', description: 'Fondamental' },
    { value: '1AS_A', label: '1AS (6ème A)', description: 'Collège' },
    { value: '2nde_C', label: '2nde C (Scientifique)', description: 'Lycée' },
  ];

  return (
    <div className="min-h-screen bg-page-bg text-main p-page transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* En-tête de la page de prévisualisation */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-subtle">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold text-base">
                ECO
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main">
                Design System Preview (Palette A)
              </h1>
            </div>
            <p className="text-sm text-muted mt-1">
              Validation des tokens sémantiques, contrastes WCAG 2.1 AA et composants fondamentaux en mode développement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface border border-default text-sm font-medium text-main hover:bg-surface-subtle focus-halo transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-warning" />
                  <span>Basculer en Mode Clair</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-primary" />
                  <span>Basculer en Mode Sombre</span>
                </>
              )}
            </button>
            <span className="px-2.5 py-1 rounded-sm bg-surface-subtle border border-subtle text-xs font-semibold text-secondary">
              DEV ONLY
            </span>
          </div>
        </header>

        {/* GROUPE 1 MIGRÉ : KPICARDS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main">Groupe 1 : KpiCard (Tokens & Tabular Nums)</h2>
            <span className="text-xs text-muted">Montants sans font-mono, police standard alignée</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              title="Total Encaissé"
              amount={1250000}
              unit="MRU"
              icon={<Wallet className="h-5 w-5" />}
              variant="primary"
              subtitle="Ce mois-ci au guichet"
              compact={false}
            />
            <KpiCard
              title="Élèves Inscrits"
              amount={348}
              unit="count"
              icon={<Users className="h-5 w-5" />}
              variant="default"
              subtitle="Répartis sur 12 classes"
            />
            <KpiCard
              title="Taux de Recouvrement"
              progress={78}
              icon={<CreditCard className="h-5 w-5" />}
              variant="success"
              subtitle="Objectif trimestre atteint"
            />
          </div>
        </section>

        {/* GROUPE 1 MIGRÉ : BUTTONS */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-main">Groupe 1 : Composant Button</h2>
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                <span>Bouton Primaire</span>
              </Button>
              <Button variant="secondary">
                <span>Bouton Secondaire</span>
              </Button>
              <Button variant="outline">
                <span>Bouton Outline</span>
              </Button>
              <Button variant="ghost">
                <span>Bouton Ghost</span>
              </Button>
              <Button variant="danger">
                <span>Bouton Danger</span>
              </Button>
              <Button variant="primary" loading loadingText="Chargement...">
                <span>Chargement</span>
              </Button>
              <Button variant="primary" disabled>
                <span>Désactivé</span>
              </Button>
            </div>
            <p className="text-xs text-muted mt-4">
              Cibles tactiles mobiles garanties ≥ 44px sur mobile (<code className="bg-surface-subtle px-1 py-0.5 rounded-sm">min-h-[44px]</code>) et focus anneau plein 2px offset 2px avec <code className="bg-surface-subtle px-1 py-0.5 rounded-sm">focus-halo</code>.
            </p>
          </Card>
        </section>

        {/* GROUPE 1 MIGRÉ : CARD */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-main">Groupe 1 : Composant Card & Headers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Carte Standard</CardTitle>
                <CardDescription>
                  Utilise le token <code className="bg-surface-subtle px-1 py-0.5 rounded-sm">bg-surface</code> et <code className="bg-surface-subtle px-1 py-0.5 rounded-sm">border-subtle</code> avec rayon <code className="bg-surface-subtle px-1 py-0.5 rounded-sm">rounded-md (12px)</code>.
                </CardDescription>
              </CardHeader>
              <p className="text-sm text-secondary">
                Contenu informatif dans la carte avec contraste texte conforme WCAG AA (≥ 10.3:1 en clair).
              </p>
            </Card>

            <Card className="hover:border-default">
              <CardHeader>
                <CardTitle>Carte Interactive</CardTitle>
                <CardDescription>
                  Survol doux avec transition vers <code className="bg-surface-subtle px-1 py-0.5 rounded-sm">border-default</code>.
                </CardDescription>
              </CardHeader>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-success-text bg-success-surface px-2.5 py-1 rounded-sm border border-success-border">
                  Statut Valide
                </span>
                <span className="text-sm font-bold text-main tabular-nums">45 000 MRU</span>
              </div>
            </Card>
          </div>
        </section>

        {/* GROUPE 2 MIGRÉ : SELECT & DATEPICKER */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main">Groupe 2 : Composants Select & DatePicker</h2>
            <span className="text-xs text-muted">Remplacement complet du select natif avec anneau plein 2px</span>
          </div>
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {/* Select migré */}
              <div className="space-y-1.5 w-full">
                <Select
                  label="Sélecteur de classe (Composant Select)"
                  options={classeOptions}
                  value={selectedClasse}
                  onChange={(val) => setSelectedClasse(val)}
                  size="md"
                  className="w-full"
                />
                <p className="text-xs text-muted">Menu déroulant accessible au clavier avec focus visible.</p>
              </div>

              {/* DatePicker migré */}
              <div className="space-y-1.5 w-full">
                <DatePicker
                  label="Date d'échéance (Composant DatePicker)"
                  value={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  size="md"
                  className="w-full"
                />
                <p className="text-xs text-muted">Calendrier avec tabular-nums et rayon md (12px).</p>
              </div>

              {/* Input standard avec recherche */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-main">
                  Champ standard (Input)
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un élève..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-surface-input border border-strong text-sm text-main placeholder:text-muted focus-halo transition-colors"
                  />
                </div>
                <p className="text-xs text-muted">Bordure forte (contraste ≥ 3.0:1 sur fond input).</p>
              </div>

              {/* Input avec erreur */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-danger">
                  Champ en erreur
                </label>
                <input
                  type="text"
                  defaultValue="Valeur incorrecte"
                  className="w-full px-3 py-2 rounded-md bg-surface-input border border-danger text-sm text-main focus-halo transition-colors"
                />
                <p className="text-xs text-danger font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Champ obligatoire.</span>
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. SECTION BADGES D'ÉTAT SÉMANTIQUES */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-main">3. Badges d'État (Succès, Danger, Avertissement)</h2>
          <div className="p-6 rounded-md bg-surface border border-subtle shadow-xs flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-success-surface text-success-text border border-success-border text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Payé (Succès ≥ 5.2:1)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-danger-surface text-danger-text border border-danger-border text-xs font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>En retard (Danger ≥ 5.9:1)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-warning-surface text-warning-text border border-warning-border text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Partiel (Avertissement ≥ 4.8:1)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-surface-subtle text-secondary border border-default text-xs font-semibold">
              <span>En attente (Neutre ≥ 9.4:1)</span>
            </span>
          </div>
        </section>

        {/* 4. SECTION TABLEAU AVEC TABULAR-NUMS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main">4. Tableau de données (Police normale + tabular-nums)</h2>
            <span className="text-xs text-muted">Plus de font-mono sur les montants financiers</span>
          </div>
          <div className="rounded-md bg-surface border border-subtle shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-subtle">
                  <th className="py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">Élève</th>
                  <th className="py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">Classe</th>
                  <th className="py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">Statut</th>
                  <th className="py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Montant Exigible</th>
                  <th className="py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Reste Dû</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle text-sm">
                <tr className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-main">Ahmedou Ould Vall</td>
                  <td className="py-3 px-4 text-secondary">1AS (6ème A)</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-success-surface text-success-text border border-success-border text-xs font-medium">
                      À jour
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-main tabular-nums font-medium">25 000 MRU</td>
                  <td className="py-3 px-4 text-right text-success-text tabular-nums font-semibold">0 MRU</td>
                </tr>
                <tr className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-main">Mariem Mint Cheikh</td>
                  <td className="py-3 px-4 text-secondary">3AF (CE1)</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-warning-surface text-warning-text border border-warning-border text-xs font-medium">
                      Partiel
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-main tabular-nums font-medium">20 000 MRU</td>
                  <td className="py-3 px-4 text-right text-warning-text tabular-nums font-semibold">8 000 MRU</td>
                </tr>
                <tr className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-main">Sidi Ould Bilal</td>
                  <td className="py-3 px-4 text-secondary">2nde C (Scientifique)</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-danger-surface text-danger-text border border-danger-border text-xs font-medium">
                      En retard
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-main tabular-nums font-medium">35 000 MRU</td>
                  <td className="py-3 px-4 text-right text-danger-text tabular-nums font-semibold">35 000 MRU</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. SECTION ÉTAT VIDE HONNÊTE */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-main">5. État Vide Honnête (Sans mock)</h2>
          <div className="p-8 rounded-lg bg-surface border border-subtle shadow-xs text-center space-y-4 max-w-lg mx-auto">
            <div className="h-12 w-12 rounded-md bg-surface-subtle border border-default text-muted flex items-center justify-center mx-auto">
              <Inbox className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-main">Aucune transaction enregistrée</h3>
              <p className="text-sm text-muted">
                Le journal de caisse est actuellement vide pour cette date. Les encaissements validés au guichet apparaîtront ici.
              </p>
            </div>
            <div>
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                <span>Encaisser un versement</span>
              </Button>
            </div>
          </div>
        </section>

        {/* 6. SECTION TOAST DE NOTIFICATION */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-main">6. Toast de Notification</h2>
          <div className="p-6 rounded-md bg-surface border border-subtle shadow-xs space-y-4">
            {showToast ? (
              <div className="max-w-md p-4 rounded-md bg-surface-elevated border border-strong shadow-md flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-bold text-main">Paiement enregistré avec succès</p>
                  <p className="text-xs text-muted">Reçu N° REC-2026-0042 émis pour Ahmedou Ould Vall.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowToast(false)}
                  className="text-muted hover:text-main rounded-sm focus-halo p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowToast(true)}>
                <span>Réafficher le toast de démonstration</span>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
