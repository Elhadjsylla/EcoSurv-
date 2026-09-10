import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
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
} from 'lucide-react';

export const EcheancesPage: React.FC = () => {
  const [echeanciers, setEcheanciers] = useState<EcheancierConfig[]>(MOCK_ECHEANCIERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Échéances & Tarifs de Scolarité
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              Année 2025–2026
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
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

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Échéanciers Actifs
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-2 truncate">
              {echeanciers.length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-2 block truncate">
              Configurations par niveau
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard className="h-5 w-5 stroke-[1.75]" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Élèves Couverts
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-2 truncate">
              {totalElevesCouverts}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-2 block truncate">
              ✓ Échéancier individuel actif
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50/80 border border-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="h-5 w-5 stroke-[1.75]" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Prochaine Échéance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-2 truncate">
              05 Avril
            </div>
            <span className="text-[11px] text-amber-700 font-semibold mt-2 block truncate">
              Tranche 3 / Mensualité
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50/80 border border-amber-100/60 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="h-5 w-5 stroke-[1.75]" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Modes de Règlement
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono mt-2 truncate">
              3 types
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-2 block truncate">
              Mensuel, Trimestriel, Annuel
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="h-5 w-5 stroke-[1.75]" />
          </div>
        </Card>
      </div>

      {/* Table of Configured Schedules */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Plans d'Échéances & Tarifs Configurés
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Conforme au schéma backend Supabase (`echeances`)
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Libellé du Plan</th>
                <th className="py-4 px-6">Classe Cible</th>
                <th className="py-4 px-6 text-right">Montant Total</th>
                <th className="py-4 px-6 text-center">Fréquence</th>
                <th className="py-4 px-6 text-center">Tranches</th>
                <th className="py-4 px-6 text-right">Montant / Tranche</th>
                <th className="py-4 px-6 text-center">Prochaine Limite</th>
                <th className="py-4 px-6 text-center">Élèves Concernés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {echeanciers.map((ech) => (
                <tr key={ech.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4.5 px-6 font-bold text-slate-900">
                    {ech.libelle}
                  </td>
                  <td className="py-4.5 px-6">
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
                      {ech.classe}
                    </span>
                  </td>
                  <td
                    title={formatMRU(ech.montant_total)}
                    className="py-4.5 px-6 text-right font-mono font-bold text-slate-900 whitespace-nowrap cursor-help"
                  >
                    {formatMRU(ech.montant_total)}
                  </td>
                  <td className="py-4.5 px-6 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        ech.frequence === 'mensuel'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : ech.frequence === 'trimestriel'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {ech.frequence}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-center font-mono font-semibold text-slate-700">
                    {ech.nombre_tranches} tranche(s)
                  </td>
                  <td
                    title={formatMRU(ech.montant_par_tranche)}
                    className="py-4.5 px-6 text-right font-mono font-bold text-emerald-700 whitespace-nowrap cursor-help"
                  >
                    {formatMRU(ech.montant_par_tranche)}
                  </td>
                  <td className="py-4.5 px-6 text-center font-mono text-slate-600">
                    {ech.date_limite_prochaine}
                  </td>
                  <td className="py-4.5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      {ech.nb_eleves_concernes}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Échéance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-600" />
                Nouvelle Échéance de Scolarité
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEcheancier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Libellé du Plan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frais Année Scolaire Terminales"
                  value={newLibelle}
                  onChange={(e) => setNewLibelle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Montant Total (MRU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newMontantTotal}
                    onChange={(e) => setNewMontantTotal(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre de Tranches
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newNombreTranches}
                  onChange={(e) => setNewNombreTranches(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
