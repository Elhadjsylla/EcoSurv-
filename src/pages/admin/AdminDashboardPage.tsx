import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'ecoles' | 'utilisateurs' | 'abonnements') => void;
  totalEcolesCount: number;
  activeEcolesCount: number;
  pendingEcolesCount: number;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  totalEcolesCount,
  activeEcolesCount,
  pendingEcolesCount,
}) => {
  const [period, setPeriod] = useState<'7' | '30' | '365'>('30');

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-page-enter">
      {/* Title Header style Sama Boutik */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Vue globale des performances d'EcoSurv Mauritanie
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Plateforme en ligne (Production)
          </span>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Écoles Totales */}
        <div
          onClick={() => onNavigateTab('ecoles')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Écoles Enregistrées
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalEcolesCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +100%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeEcolesCount} active{activeEcolesCount > 1 ? 's' : ''} • {pendingEcolesCount} en attente
          </p>
        </div>

        {/* Nouveaux Comptes */}
        <div
          onClick={() => onNavigateTab('utilisateurs')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comptes Utilisateurs
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalEcolesCount + 2}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +6 ce mois
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Directeurs & Administrateurs
          </p>
        </div>

        {/* Abonnements en essai */}
        <div
          onClick={() => onNavigateTab('abonnements')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Abonnements Essai
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalEcolesCount}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              14 jours gratuits
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toutes les nouvelles inscriptions
          </p>
        </div>

        {/* Sécurité RLS & Trigger */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Isolation Multi-Tenant
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              RLS Strict
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Actif
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cloisonnement des données par école
          </p>
        </div>
      </div>

      {/* Grid: Sama Boutik style Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Trafic & Nouveaux Comptes (Référence exacte Sama Boutik) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Trafic & Nouveaux Comptes
            </h3>

            <div className="relative inline-block">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="7">7 Derniers Jours</option>
                <option value="30">30 Derniers Jours</option>
                <option value="365">Cette Année</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Comptes créés
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {totalEcolesCount + 2}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +%
                </span>
              </div>

              <div className="mt-6 space-y-2 text-xs font-medium">
                <div className="flex items-center justify-between gap-8 text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Directeurs d'école
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{totalEcolesCount}</span>
                </div>
                <div className="flex items-center justify-between gap-8 text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Super Administrateurs
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">2</span>
                </div>
              </div>
            </div>

            {/* Visual Bar style Sama Boutik */}
            <div className="relative w-full sm:w-56 h-40 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-800 flex items-end justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full bg-emerald-500 rounded-t-lg transition-all hover:brightness-110" style={{ height: '75%' }} />
                <span className="text-[10px] font-bold text-slate-500">Directeurs</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full bg-blue-500 rounded-t-lg transition-all hover:brightness-110" style={{ height: '35%' }} />
                <span className="text-[10px] font-bold text-slate-500">Admins</span>
              </div>

              {/* Tooltip badge floating like Sama Boutik */}
              <div className="absolute top-2 right-2 bg-slate-900 dark:bg-slate-950 text-white px-2.5 py-1.5 rounded-lg shadow-lg text-[11px] font-semibold">
                <div className="text-slate-400 text-[9px]">Rôles actifs</div>
                <div className="text-emerald-400">Directeurs: {totalEcolesCount}</div>
                <div className="text-blue-400">Admins: 2</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Revenus & Croissance (Référence Sama Boutik) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Revenus & Croissance
            </h3>

            <div className="relative inline-block">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="7">7 Derniers Jours</option>
                <option value="30">30 Derniers Jours</option>
                <option value="365">Cette Année</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Modèle d'Abonnement SaaS
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  15 000 MRU / mois / école
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Tarif Standard
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500">Potentiel Récurrent (MRR)</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {(totalEcolesCount * 15000).toLocaleString('fr-FR')} MRU
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500">Taux d'Activation</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalEcolesCount > 0 ? Math.round((activeEcolesCount / totalEcolesCount) * 100) : 100}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
