import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  MOCK_MONTHLY_REPORTS,
  MonthlyFinancialReport,
} from '../lib/mockData';
import { formatMRU } from '../lib/utils';
import { formatCompactMRU } from '../lib/formatCompactMRU';
import {
  FileText,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle,
  X,
  Printer,
  BarChart3,
  Percent,
} from 'lucide-react';

export const RapportsPage: React.FC = () => {
  const [reports] = useState<MonthlyFinancialReport[]>(MOCK_MONTHLY_REPORTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    setTimeout(() => {
      setIsExportingExcel(false);
      showToast('✓ Rapport Financier récapitulatif exporté au format Excel (.xlsx)');
    }, 750);
  };

  const handlePrint = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      setIsGeneratingPdf(false);
      showToast('✓ Rapport prêt pour impression ou export PDF');
      window.print();
    }, 600);
  };

  // KPIs annuels calculés
  const totalAttenduAnnee = reports.reduce((sum, r) => sum + r.attendu, 0);
  const totalEncaisseAnnee = reports.reduce((sum, r) => sum + r.encaisse, 0);
  const totalImpayesAnnee = reports.reduce((sum, r) => sum + r.impayes, 0);
  const tauxGlobalAnnee = totalAttenduAnnee > 0
    ? Math.round((totalEncaisseAnnee / totalAttenduAnnee) * 100)
    : 0;

  // Max attendu pour mise à l'échelle des barres
  const maxMonthlyAttendu = Math.max(...reports.map((r) => r.attendu));

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
              Rapports Financiers & Comptabilité
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              Exercice 2025–2026
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Historique analytique des flux de scolarité, taux de recouvrement mensuels et prévisions comptables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 px-4"
            onClick={handlePrint}
            loading={isGeneratingPdf}
            loadingText="Génération..."
          >
            <Printer className="h-4 w-4 text-slate-600" />
            Imprimer / PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 h-10 px-4"
            onClick={handleExportExcel}
            loading={isExportingExcel}
            loadingText="Export XLSX..."
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Total Attendu Cumulé
            </span>
            <div
              title={formatMRU(totalAttenduAnnee)}
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-2 truncate cursor-help"
            >
              {formatCompactMRU(totalAttenduAnnee)}
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1.5 block truncate">
              7 mois comptabilisés
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50/80 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="h-6 w-6 stroke-[1.75]" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Total Encaissé Cumulé
            </span>
            <div
              title={formatMRU(totalEncaisseAnnee)}
              className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-2 truncate cursor-help"
            >
              {formatCompactMRU(totalEncaisseAnnee)}
            </div>
            <span className="text-xs text-emerald-700 font-semibold mt-1.5 block truncate">
              Recouvrés sur l'exercice
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50/80 border border-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle className="h-6 w-6 stroke-[1.75]" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Reste à Recouvrer
            </span>
            <div
              title={formatMRU(totalImpayesAnnee)}
              className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono mt-2 truncate cursor-help"
            >
              {formatCompactMRU(totalImpayesAnnee)}
            </div>
            <span className="text-xs text-red-600 font-semibold mt-1.5 block truncate">
              Total des relances en cours
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-50/80 border border-red-100/60 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="h-6 w-6 stroke-[1.75]" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug break-words block">
              Taux Moyen Recouvrement
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono mt-2 truncate">
              {tauxGlobalAnnee}%
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1.5 block truncate">
              Taux global d'efficacité
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Percent className="h-6 w-6 stroke-[1.75]" />
          </div>
        </Card>
      </div>

      {/* Visual Chart: Évolution des encaissements mensuels */}
      <Card className="p-6 sm:p-8 space-y-6 rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Évolution Chronologique des Encaissements (Septembre 2025 - Mars 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Comparatif mensuel entre le montant attendu (fond gris) et l'encaissement réel (barre bleue/verte).
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-600" />
              <span>Encaissé (MRU)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-slate-200" />
              <span>Attendu Total</span>
            </div>
          </div>
        </div>

        {/* Histogramme Pure CSS/SVG */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-7 gap-4 sm:gap-8 items-end h-64 border-b border-slate-200 px-4">
            {reports.map((r) => {
              const heightPercent = Math.round((r.encaisse / maxMonthlyAttendu) * 100);
              const bgClass = r.taux >= 80 ? 'bg-emerald-600' : 'bg-blue-600';
              return (
                <div key={r.mois} className="flex flex-col items-center gap-2.5 h-full justify-end group">
                  <div className="text-xs font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.taux}%
                  </div>
                  <div className="w-full max-w-[52px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden relative border border-slate-200/60">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${bgClass}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-center truncate max-w-[80px]">
                    {r.mois.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Monthly Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Tableau Récapitulatif par Mois (Exercice 2025-2026)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Données comptables agrégées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Période Mensuelle</th>
                <th className="py-4 px-6 text-right">Montant Attendu</th>
                <th className="py-4 px-6 text-right">Montant Encaissé</th>
                <th className="py-4 px-6 text-right">Impayés & Retards</th>
                <th className="py-4 px-6 text-center">Taux de Recouvrement</th>
                <th className="py-4 px-6 text-center">Statut Clôture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reports.map((r) => (
                <tr key={r.mois} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4.5 px-6 font-sans font-bold text-slate-900">
                    {r.mois}
                  </td>
                  <td className="py-4.5 px-6 text-right font-bold text-slate-900">
                    {formatMRU(r.attendu)}
                  </td>
                  <td className="py-4.5 px-6 text-right font-bold text-emerald-700">
                    {formatMRU(r.encaisse)}
                  </td>
                  <td className="py-4.5 px-6 text-right font-bold text-red-700">
                    {formatMRU(r.impayes)}
                  </td>
                  <td className="py-4.5 px-6 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            r.taux >= 80 ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${r.taux}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900">{r.taux}%</span>
                    </div>
                  </td>
                  <td className="py-4.5 px-6 text-center font-sans">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                        r.taux >= 90
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : r.taux >= 75
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {r.taux >= 90 ? 'Clôturé' : 'En cours'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
