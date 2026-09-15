import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { KpiCard } from '../components/ui/KpiCard';
import { DatePicker } from '../components/ui/DatePicker';
import { ToastNotification } from '../components/ui/ToastNotification';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { formatMRU } from '../lib/utils';
import { formatDate } from '../lib/format';
import { groupPlans, listeClasses, todayISO } from '../data/aggregations';
import { useSituationsEleves } from '../data/eleves';
import { useEcole } from '../data/ecole';
import { useCreerEcheancesClasse } from '../data/echeances';
import { messageErreurDonnees } from '../data/errors';
import { CreditCard, Plus, Users, CheckCircle2, X, PlusCircle, Clock, Percent } from 'lucide-react';

type Toast = { message: string; type: 'success' | 'info' | 'warning' };

export const EcheancesPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const { data: ecole } = useEcole();
  const creer = useCreerEcheancesClasse();
  const situations = useMemo(() => data ?? [], [data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [classe, setClasse] = useState('');
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');

  const plans = useMemo(() => groupPlans(situations), [situations]);
  const classes = useMemo(() => listeClasses(situations), [situations]);
  const today = todayISO();
  const prochain = plans.find((p) => p.date_echeance >= today && p.total_encaisse < p.total_attendu) ?? null;
  const nbElevesCouverts = situations.filter((s) => s.echeances.length > 0).length;
  const totalAttendu = plans.reduce((s, p) => s + p.total_attendu, 0);
  const totalEncaisse = plans.reduce((s, p) => s + p.total_encaisse, 0);
  const taux = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;
  const elevesDeLaClasse = situations.filter((s) => s.classe === (classe || classes[0]));

  const ouvrirModal = () => {
    setClasse(classes[0] ?? '');
    setLibelle('');
    setMontant('');
    setDateEcheance('');
    creer.reset();
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const classeCible = classe || classes[0] || '';
    try {
      const nombre = await creer.mutateAsync({
        classe: classeCible,
        eleveIds: situations.filter((s) => s.classe === classeCible).map((s) => s.id),
        libelle,
        montant: Number(montant.replace(',', '.')),
        date_echeance: dateEcheance,
        annee_scolaire: ecole?.annee_scolaire ?? null,
      });
      setToast({ message: `Échéance « ${libelle.trim()} » créée pour ${nombre} élève(s) de ${classeCible}.`, type: 'success' });
      setIsModalOpen(false);
    } catch {
      // Message affiché dans la modale.
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Échéances & Tarifs de Scolarité
            </h1>
            {ecole?.annee_scolaire && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
                Année {ecole.annee_scolaire}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Appels de fonds établis par classe, avec leur état d'encaissement.
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-2 h-10 px-4" onClick={ouvrirModal} disabled={classes.length === 0}>
          <Plus className="h-4 w-4" />
          Nouvelle échéance
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Échéances établies"
          amount={plans.length}
          unit="count"
          subtitle="Libellés distincts par date"
          icon={<CreditCard className="h-5 w-5" />}
          variant="primary"
        />
        <KpiCard
          staggerIndex={1}
          title="Élèves couverts"
          amount={nbElevesCouverts}
          unit="count"
          subtitle={`Sur ${situations.length} élèves actifs`}
          icon={<Users className="h-5 w-5" />}
          variant="success"
        />
        <KpiCard
          staggerIndex={2}
          title="Prochaine échéance"
          customValue={prochain ? formatDate(prochain.date_echeance, { year: undefined }) : '—'}
          subtitle={prochain ? prochain.libelle : 'Aucune échéance à venir'}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
        <KpiCard
          staggerIndex={3}
          title="Taux d'encaissement"
          progress={taux}
          subtitle={`${formatMRU(totalEncaisse)} sur ${formatMRU(totalAttendu)}`}
          icon={<Percent className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="Aucune échéance établie"
          description={
            classes.length === 0
              ? 'Inscrivez des élèves avec une classe pour pouvoir créer leurs échéances.'
              : 'Créez une première échéance pour une classe : elle sera appliquée à chacun de ses élèves actifs.'
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Échéances par libellé et date ({plans.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-5">Libellé</th>
                  <th className="py-4 px-5">Classes</th>
                  <th className="py-4 px-5 text-right">Montant / élève</th>
                  <th className="py-4 px-5 text-center">Date limite</th>
                  <th className="py-4 px-5 text-center">Élèves</th>
                  <th className="py-4 px-5 text-right">Encaissé / Attendu</th>
                  <th className="py-4 px-5 text-center">Soldées</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {plans.map((plan) => {
                  const pct = plan.total_attendu > 0 ? Math.round((plan.total_encaisse / plan.total_attendu) * 100) : 0;
                  const echue = plan.date_echeance < today;
                  return (
                    <tr key={plan.cle} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{plan.libelle}</div>
                        <div className={`text-xs mt-0.5 ${echue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {echue ? 'Échue' : 'À venir'}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {plan.classes.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            plan.classes.map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                              >
                                {c}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs">
                        {formatMRU(plan.montant)}
                      </td>
                      <td className="py-4 px-5 text-center font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(plan.date_echeance)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs">
                          <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          {plan.nb_eleves}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-xs whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatMRU(plan.total_encaisse)}</div>
                        <div className="font-mono text-slate-400">sur {formatMRU(plan.total_attendu)} ({pct}%)</div>
                      </td>
                      <td className="py-4 px-5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {plan.nb_soldees} / {plan.nb_eleves}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="nouvelle-echeance-titre"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 id="nouvelle-echeance-titre" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Nouvelle échéance pour une classe
              </h3>
              <button onClick={() => setIsModalOpen(false)} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classe <span className="text-red-500">*</span>
                </span>
                <Select
                  value={classe || classes[0] || ''}
                  onChange={setClasse}
                  options={classes.map((c) => ({ value: c, label: c }))}
                  size="sm"
                  triggerClassName="w-full h-9 rounded-lg font-semibold"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Sera créée pour les {elevesDeLaClasse.length} élève(s) actif(s) de cette classe.
                </p>
              </div>

              <div>
                <label htmlFor="echeance-libelle" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Libellé <span className="text-red-500">*</span>
                </label>
                <input
                  id="echeance-libelle"
                  type="text"
                  required
                  placeholder="Ex : Scolarité — tranche 3"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="echeance-montant" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant par élève (MRU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="echeance-montant"
                    type="number"
                    min={1}
                    step="any"
                    required
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date limite <span className="text-red-500">*</span>
                  </span>
                  <DatePicker value={dateEcheance} onChange={setDateEcheance} size="sm" className="w-full" triggerClassName="w-full h-9 rounded-lg text-xs" />
                </div>
              </div>

              {creer.error && (
                <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {messageErreurDonnees(creer.error)}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5" loading={creer.isPending} loadingText="Création…">
                  <CheckCircle2 className="h-4 w-4" />
                  Créer l'échéance
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
