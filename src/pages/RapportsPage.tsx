import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { CollectionChart } from '../components/ui/CollectionChart';
import { formatMRU } from '../lib/utils';
import { computeKpis, monthlyReports, todayISO } from '../data/aggregations';
import { useSituationsEleves } from '../data/eleves';
import { useEcole } from '../data/ecole';
import { FileText, FileSpreadsheet, TrendingUp, CheckCircle, Printer, Percent } from 'lucide-react';

export const RapportsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const { data: ecole } = useEcole();

  const situations = useMemo(() => data ?? [], [data]);
  const echeances = useMemo(() => situations.flatMap((s) => s.echeances), [situations]);
  const reports = useMemo(() => monthlyReports(echeances), [echeances]);
  // Même ordre que monthlyReports : mois d'échéance croissants.
  const moisCles = useMemo(
    () => [...new Set(echeances.map((e) => e.date_echeance.slice(0, 7)))].sort(),
    [echeances]
  );
  const kpis = useMemo(() => computeKpis(situations), [situations]);
  const moisCourant = todayISO().slice(0, 7);
  const exercice = ecole?.annee_scolaire ? `Exercice ${ecole.annee_scolaire}` : null;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rapports Financiers & Comptabilité
            </h1>
            {exercice && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
                {exercice}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Montants attendus et encaissés par mois d'échéance, calculés sur les paiements confirmés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-10 px-4" onClick={() => window.print()}>
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            Imprimer / PDF
          </Button>
          <ComingSoon detail="export Excel">
            <Button variant="primary" size="sm" className="gap-2 h-10 px-4" disabled>
              <FileSpreadsheet className="h-4 w-4" />
              Exporter Excel
            </Button>
          </ComingSoon>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Total Attendu"
          amount={kpis.totalAttendu}
          unit="MRU"
          subtitle={`${reports.length} mois d'échéances`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
        <KpiCard
          staggerIndex={1}
          title="Total Encaissé"
          amount={kpis.totalEncaisse}
          unit="MRU"
          progress={kpis.tauxRecouvrement}
          subtitle="Paiements confirmés uniquement"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <KpiCard
          staggerIndex={2}
          title="Reste à Recouvrer"
          amount={kpis.totalImpayes}
          unit="MRU"
          subtitle={`${kpis.nombreEnRetard} élèves en retard`}
          icon={<FileText className="h-5 w-5" />}
          variant="danger"
        />
        <KpiCard
          staggerIndex={3}
          title="Taux de Recouvrement"
          progress={kpis.tauxRecouvrement}
          subtitle="Encaissé / attendu"
          icon={<Percent className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="Aucune échéance à analyser"
          description="Les rapports mensuels apparaîtront dès que des échéances seront établies."
        />
      ) : (
        <>
          <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <CollectionChart data={reports} />
          </Card>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <div className="py-4 px-5 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Récapitulatif par mois d'échéance</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-5">Mois</th>
                    <th className="py-4 px-5 text-right">Montant Attendu</th>
                    <th className="py-4 px-5 text-right">Montant Encaissé</th>
                    <th className="py-4 px-5 text-right">Reste Impayé</th>
                    <th className="py-4 px-5 text-center">Taux de Recouvrement</th>
                    <th className="py-4 px-5 text-center">Période</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                  {reports.map((r, i) => {
                    const cle = moisCles[i];
                    const periode = cle < moisCourant ? 'Échue' : cle === moisCourant ? 'En cours' : 'À venir';
                    return (
                      <tr key={cle} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-5 font-sans font-bold text-slate-900 dark:text-white text-sm">{r.mois}</td>
                        <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-white">{formatMRU(r.attendu)}</td>
                        <td className="py-4 px-5 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatMRU(r.encaisse)}</td>
                        <td className="py-4 px-5 text-right font-bold text-rose-600 dark:text-rose-400">{formatMRU(r.impayes)}</td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${r.taux >= 80 ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                                style={{ width: `${r.taux}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{r.taux}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center font-sans">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${
                              periode === 'Échue'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                : periode === 'En cours'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {periode}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
