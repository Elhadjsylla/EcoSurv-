import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { KpiCard } from '../components/ui/KpiCard';
import { Tooltip } from '../components/ui/Tooltip';
import {
  MOCK_ECHEANCIERS,
  EcheancierConfig,
  FrequenceEcheance,
} from '../lib/mockData';
import { formatMRU } from '../lib/utils';
import {
  CreditCard,
  Plus,
  Users,
  CheckCircle2,
  X,
  PlusCircle,
  CheckCircle,
  Layers,
  Clock,
  MoreHorizontal,
  FileText,
  Settings2,
} from 'lucide-react';

export const EcheancesPage: React.FC = () => {
  const [echeanciers, setEcheanciers] = useState<EcheancierConfig[]>(MOCK_ECHEANCIERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  // Form state
  const [newLibelle, setNewLibelle] = useState('');
  const [newClasse, setNewClasse] = useState('Terminales C');
  const [newMontantTotal, setNewMontantTotal] = useState<number>(30000);
  const [newFrequence, setNewFrequence] = useState<FrequenceEcheance>('mensuel');
  const [newNombreTranches, setNewNombreTranches] = useState<number>(3);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateEcheancier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibelle.trim()) return;

    const newEcheancier: EcheancierConfig = {
      id: `ech-${Date.now()}`,
      libelle: newLibelle,
      classe: newClasse,
      montant_total: Number(newMontantTotal),
      frequence: newFrequence,
      nombre_tranches: Number(newNombreTranches),
      montant_par_tranche: Math.round(Number(newMontantTotal) / Number(newNombreTranches)),
      date_limite_prochaine: '2026-04-05',
      nb_eleves_concernes: 30,
    };

    setEcheanciers([newEcheancier, ...echeanciers]);
    showToast(`Échéancier "${newLibelle}" créé et appliqué à la classe ${newClasse}`);
    setIsModalOpen(false);
    setNewLibelle('');
  };

  const totalElevesCouverts = echeanciers.reduce((sum, e) => sum + e.nb_eleves_concernes, 0);

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Échéances & Tarifs de Scolarité
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
              Année 2025–2026
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Configuration des frais de scolarité, des mensualités et des calendriers d'échéances par classe.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-2 h-10 px-4"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          + Nouvelle Échéance
        </Button>
      </div>

      {/* Metric Tiles (Pastel KpiCard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Échéanciers Actifs"
          amount={echeanciers.length}
          unit="count"
          subtitle="Configurations par niveau"
          icon={<CreditCard className="h-5 w-5" />}
          variant="primary"
        />

        <KpiCard
          staggerIndex={1}
          title="Élèves Couverts"
          amount={totalElevesCouverts}
          unit="count"
          subtitle="✓ Échéancier individuel actif"
          icon={<Users className="h-5 w-5" />}
          variant="success"
        />

        <Card className="p-5 sm:p-6 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/75 dark:bg-amber-950/35 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug">
                Prochaine Échéance
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                <Clock className="h-5 w-5 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono truncate">
              05 Avril
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block truncate">
              Tranche 3 / Mensualité
            </span>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/75 dark:bg-indigo-950/35 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug">
                Modes de Règlement
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                <Layers className="h-5 w-5 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono truncate">
              3 types
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block truncate">
              Mensuel, Trimestriel, Annuel
            </span>
          </div>
        </Card>
      </div>

      {/* Table of Configured Schedules */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Plans d'Échéances & Tarifs Configurés ({echeanciers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Conforme au schéma backend Supabase (<code className="font-mono text-[11px] text-blue-600 dark:text-blue-400">echeances</code>)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-5">Libellé du Plan</th>
                <th className="py-4 px-5">Classe Cible</th>
                <th className="py-4 px-5 text-right">Montant Total</th>
                <th className="py-4 px-5 text-center">Fréquence</th>
                <th className="py-4 px-5 text-center">Tranches</th>
                <th className="py-4 px-5 text-right">Montant / Tranche</th>
                <th className="py-4 px-5 text-center">Prochaine Limite</th>
                <th className="py-4 px-5 text-center">Élèves Concernés</th>
                <th className="py-4 px-4 text-center w-14">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {echeanciers.map((ech) => {
                const isMenuOpen = openMenuRowId === ech.id;
                return (
                  <tr key={ech.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Libellé sur 2 lignes */}
                    <td className="py-4.5 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {ech.libelle}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        Concerne la classe {ech.classe}
                      </div>
                    </td>

                    {/* Classe Cible Badge */}
                    <td className="py-4.5 px-5">
                      <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                        {ech.classe}
                      </span>
                    </td>

                    {/* Montant Total */}
                    <td className="py-4.5 px-5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs">
                      {formatMRU(ech.montant_total)}
                    </td>

                    {/* Fréquence */}
                    <td className="py-4.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          ech.frequence === 'mensuel'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : ech.frequence === 'trimestriel'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {ech.frequence}
                      </span>
                    </td>

                    {/* Tranches */}
                    <td className="py-4.5 px-5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      {ech.nombre_tranches} tranche(s)
                    </td>

                    {/* Montant / Tranche */}
                    <td className="py-4.5 px-5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-xs">
                      {formatMRU(ech.montant_par_tranche)}
                    </td>

                    {/* Prochaine Limite */}
                    <td className="py-4.5 px-5 text-center font-mono text-slate-600 dark:text-slate-400 text-xs">
                      {ech.date_limite_prochaine}
                    </td>

                    {/* Élèves Concernés */}
                    <td className="py-4.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs">
                        <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        {ech.nb_eleves_concernes}
                      </span>
                    </td>

                    {/* Actions Context Menu "..." */}
                    <td className="py-4.5 px-4 text-center relative">
                      <Tooltip content="Options">
                        <button
                          type="button"
                          onClick={() => setOpenMenuRowId(isMenuOpen ? null : ech.id)}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto"
                          aria-label="Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </Tooltip>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              showToast(`Paramètres de l'échéance "${ech.libelle}" ouverts.`);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                          >
                            <Settings2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Modifier le plan</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              showToast(`Appels de fonds générés pour ${ech.nb_eleves_concernes} élèves (${ech.classe}).`);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Émettre appels de fonds</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              window.print();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Imprimer l'échéancier</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Échéance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Nouvelle Échéance de Scolarité
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEcheancier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Libellé du Plan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frais Année Scolaire Terminales"
                  value={newLibelle}
                  onChange={(e) => setNewLibelle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classe Cible <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newClasse}
                  onChange={setNewClasse}
                  options={[
                    { value: 'Terminales C', label: 'Terminales C' },
                    { value: '6ème A', label: '6ème A' },
                    { value: 'CM2 A', label: 'CM2 A' },
                    { value: '3ème B', label: '3ème B' },
                  ]}
                  size="sm"
                  triggerClassName="w-full h-9 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant Total (MRU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newMontantTotal}
                    onChange={(e) => setNewMontantTotal(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fréquence <span className="text-red-500">*</span>
                  </label>
                  <Select<FrequenceEcheance>
                    value={newFrequence}
                    onChange={setNewFrequence}
                    options={[
                      { value: 'mensuel', label: 'Mensuel' },
                      { value: 'trimestriel', label: 'Trimestriel' },
                      { value: 'annuel', label: 'Annuel' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Tranches
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newNombreTranches}
                  onChange={(e) => setNewNombreTranches(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Créer l'Échéancier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
