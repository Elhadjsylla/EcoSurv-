import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  MOCK_MONTHLY_REPORTS,
  MonthlyFinancialReport,
} from '../lib/mockData';
import { formatMRU } from '../lib/utils';
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportExcel = () => {
    showToast('✓ Rapport Financier récapitulatif exporté au format Excel (.xlsx)');
  };

  const handleExportPDF = () => {
    showToast('✓ Rapport PDF officiel de clôture généré avec succès');
  };

  // Calculs globaux
  const totalAttenduAnnee = reports.reduce((sum, r) => sum + r.attendu, 0);
  const totalEncaisseAnnee = reports.reduce((sum, r) => sum + r.encaisse, 0);
  const totalImpayesAnnee = reports.reduce((sum, r) => sum + r.impayes, 0);
  const tauxGlobalAnnee =
    totalAttenduAnnee > 0
      ? Math.round((totalEncaisseAnnee / totalAttenduAnnee) * 100)
      : 0;

  // Max attendu pour mise à l'échelle des barres
  const maxMonthlyAttendu = Math.max(...reports.map((r) => r.attendu));

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 relative">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Rapports Financiers & Exports
            </h1>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              Bilan 2025–2026
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Génération de bilans comptables, états de recouvrement mensuels et comptabilité analytique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <Printer className="h-4 w-4" />
            Imprimer PDF
          </Button>
          <Button variant="primary" size="sm" className="gap-2" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel (XLSX)
          </Button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Attendu Cumulé
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {formatMRU(totalAttenduAnnee)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              7 mois comptabilisés
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Encaissé Cumulé
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              {formatMRU(totalEncaisseAnnee)}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              Recouvrés sur l'exercice
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Reste à Recouvrer
            </span>
            <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
              {formatMRU(totalImpayesAnnee)}
            </div>
            <span className="text-[11px] text-red-600 font-semibold mt-1 block">
              Total des relances en cours
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Taux Moyen Ancienneté
            </span>
            <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">
              {tauxGlobalAnnee}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Taux global d'efficacité
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Visual Chart: Évolution des encaissements mensuels */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Évolution Chronologique des Encaissements (Septembre 2025 - Mars 2026)
            </h3>
            <p className="text-xs text-slate-500">
              Comparatif mensuel entre le montant attendu (fond gris) et l'encaissement réel (barre bleue/verte).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-blue-600" />
              <span>Encaissé (MRU)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-slate-200" />
              <span>Attendu Total</span>
            </div>
          </div>
        </div>

        {/* Histogramme Pure CSS/SVG */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-7 gap-4 sm:gap-8 items-end h-56 border-b border-slate-200 px-4">
            {reports.map((r) => {
              const heightPercent = Math.round((r.encaisse / maxMonthlyAttendu) * 100);
              const bgClass = r.taux >= 80 ? 'bg-emerald-600' : 'bg-blue-600';
              return (
                <div key={r.mois} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[11px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.taux}%
                  </div>
                  <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden relative border border-slate-200/60">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${bgClass}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 text-center truncate max-w-[70px]">
                    {r.mois.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Monthly Breakdown Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
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
                <th className="py-3.5 px-4">Période Mensuelle</th>
                <th className="py-3.5 px-4 text-right">Montant Attendu</th>
                <th className="py-3.5 px-4 text-right">Montant Encaissé</th>
                <th className="py-3.5 px-4 text-right">Impayés & Retards</th>
                <th className="py-3.5 px-4 text-center">Taux de Recouvrement</th>
                <th className="py-3.5 px-4 text-center">Statut Clôture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reports.map((r) => (
                <tr key={r.mois} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                    {r.mois}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatMRU(r.attendu)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    {formatMRU(r.encaisse)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-red-700">
                    {formatMRU(r.impayes)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
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
                  <td className="py-3.5 px-4 text-center font-sans">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
