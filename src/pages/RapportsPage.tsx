import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import {
  MOCK_MONTHLY_REPORTS,
  MonthlyFinancialReport,
} from '../lib/mockData';
import { formatMRU } from '../lib/utils';
import { exportFinancialReportsToExcel } from '../lib/excel/exportFinancialReports';
import {
  FileText,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle,
  X,
  Printer,
  Percent,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { CollectionChart } from '../components/ui/CollectionChart';
import { useAuthStore } from '../store/useAuthStore';

export const RapportsPage: React.FC = () => {
  const authProfile = useAuthStore((s) => s.profile);
  const [reports] = useState<MonthlyFinancialReport[]>(() => {
    if (authProfile?.ecole_id) return [];
    return MOCK_MONTHLY_REPORTS;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportFinancialReportsToExcel(reports);
      showToast('✓ Rapport Financier annuel exporté au format Excel (.xlsx) avec succès.');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'exportation Excel');
    } finally {
      setIsExportingExcel(false);
    }
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
              Rapports Financiers & Comptabilité
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
              Exercice 2025–2026
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
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
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
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

      {/* Summary KPI Tiles (Nexoov Pastel Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Total Attendu Cumulé"
          amount={totalAttenduAnnee}
          unit="MRU"
          subtitle="7 mois d'exercice comptabilisés"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />

        <KpiCard
          staggerIndex={1}
          title="Total Encaissé Cumulé"
          amount={totalEncaisseAnnee}
          unit="MRU"
          progress={tauxGlobalAnnee}
          subtitle="Recouvrés sur l'exercice"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />

        <KpiCard
          staggerIndex={2}
          title="Reste à Recouvrer"
          amount={totalImpayesAnnee}
          unit="MRU"
          subtitle="Total des relances en cours"
          icon={<FileText className="h-5 w-5" />}
          variant="danger"
        />

        <KpiCard
          staggerIndex={3}
          title="Taux Moyen Recouvrement"
          progress={tauxGlobalAnnee}
          subtitle="Taux global d'efficacité"
          icon={<Percent className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Visual Chart: Évolution des encaissements mensuels */}
      <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <CollectionChart data={reports} />
      </Card>

      {/* Monthly Breakdown Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="py-4 px-5 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Tableau Récapitulatif par Mois (Exercice 2025-2026)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Données comptables agrégées et archivées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-5">Période Mensuelle</th>
                <th className="py-4 px-5 text-right">Montant Attendu</th>
                <th className="py-4 px-5 text-right">Montant Encaissé</th>
                <th className="py-4 px-5 text-right">Impayés & Retards</th>
                <th className="py-4 px-5 text-center">Taux de Recouvrement</th>
                <th className="py-4 px-5 text-center">Statut Clôture</th>
                <th className="py-4 px-4 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
              {reports.map((r) => {
                const isMenuOpen = openMenuRowId === r.mois;
                return (
                  <tr key={r.mois} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Période sur 2 lignes */}
                    <td className="py-4.5 px-5 font-sans">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.mois}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        Exercice 2025–2026
                      </div>
                    </td>

                    <td className="py-4.5 px-5 text-right font-bold text-slate-900 dark:text-white">
                      {formatMRU(r.attendu)}
                    </td>

                    <td className="py-4.5 px-5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {formatMRU(r.encaisse)}
                    </td>

                    <td className="py-4.5 px-5 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatMRU(r.impayes)}
                    </td>

                    <td className="py-4.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              r.taux >= 80 ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'
                            }`}
                            style={{ width: `${r.taux}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{r.taux}%</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-5 text-center font-sans">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                          r.taux >= 90
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : r.taux >= 75
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            r.taux >= 90 ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-blue-600 dark:bg-blue-400'
                          }`}
                        />
                        {r.taux >= 90 ? 'Clôturé' : 'En cours'}
                      </span>
                    </td>

                    {/* Context menu "..." */}
                    <td className="py-4.5 px-4 text-center font-sans relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuRowId(isMenuOpen ? null : r.mois)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95 font-sans">
                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              exportFinancialReportsToExcel([r], `Rapport_Financier_${r.mois.replace(/\s+/g, '_')}_2026.xlsx`);
                              showToast(`État financier de ${r.mois} exporté en Excel (.xlsx) avec succès.`);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                          >
                            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Télécharger l'état (.xlsx)</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              window.print();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                            <span>Imprimer journal</span>
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
    </div>
  );
};
