import React from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { AdminEcoleItem } from './AdminEcolesPage';
import { AdminUserRow } from './AdminUsersPage';
import { formatMRU } from '../../lib/utils';
import { SchoolDistributionDonut } from '../../components/admin/SchoolDistributionDonut';
import { LiveAuditFeed } from '../../components/admin/LiveAuditFeed';
import { SchoolComparisonTable } from '../../components/admin/SchoolComparisonTable';
import { PlatformActivationGauge } from '../../components/admin/PlatformActivationGauge';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'ecoles' | 'utilisateurs' | 'abonnements' | 'audit') => void;
  ecoles: AdminEcoleItem[];
  users: AdminUserRow[];
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  ecoles,
  users,
}) => {
  // Real calculations
  const totalEcoles = ecoles.length;
  const activeEcoles = ecoles.filter((e) => e.statut_activation === 'active').length;
  const pendingEcoles = ecoles.filter((e) => e.statut_activation === 'en_attente').length;
  const suspendedEcoles = ecoles.filter((e) => e.statut_activation === 'suspendue').length;

  const activeAbonnements = ecoles.filter((e) => e.statut_abonnement === 'actif').length;
  const trialAbonnements = ecoles.filter((e) => e.statut_abonnement === 'essai').length;

  // Option A MRR calculation: only schools with statut_abonnement = 'actif'
  const mrrContractuel = activeAbonnements * 15000;

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.actif).length;
  const directeursCount = users.filter((u) => u.role === 'directeur').length;
  const superAdminsCount = users.filter((u) => u.role === 'super_admin').length;
  const staffCount = users.filter((u) => !['directeur', 'super_admin'].includes(u.role)).length;

  const activationRate = totalEcoles > 0 ? Math.round((activeEcoles / totalEcoles) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-page-enter">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Tableau de bord Super Admin
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Supervision centrale de la plateforme EcoSurv Mauritanie
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Infrastructure Opérationnelle
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
              {totalEcoles}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {activationRate}% actives
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeEcoles} active{activeEcoles > 1 ? 's' : ''} • {pendingEcoles} en attente • {suspendedEcoles} suspendue{suspendedEcoles > 1 ? 's' : ''}
          </p>
        </div>

        {/* Comptes Utilisateurs */}
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
              {totalUsers}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {activeUsers} actifs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {directeursCount} directeurs • {superAdminsCount} admins • {staffCount} personnels
          </p>
        </div>

        {/* Abonnements en essai */}
        <div
          onClick={() => onNavigateTab('abonnements')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Abonnements Essai (14j)
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {trialAbonnements}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              0 MRU (Essai gratuit)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeAbonnements} convertie{activeAbonnements > 1 ? 's' : ''} en payant
          </p>
        </div>

        {/* Isolation Multi-Tenant */}
        <div
          onClick={() => onNavigateTab('audit')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit & Sécurité
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Table audit_logs
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Traçabilité des accès & RLS actif
          </p>
        </div>
      </div>

      {/* Row 1: Donut de répartition (Étape 1) & Flux d'Activité Live (Étape 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SchoolDistributionDonut ecoles={ecoles} onNavigateTab={onNavigateTab} />
        <LiveAuditFeed onNavigateAudit={() => onNavigateTab('audit')} />
      </div>

      {/* Row 2: Jauge d'Activation Plateforme (Étape 4) & MRR Contractuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformActivationGauge ecoles={ecoles} onNavigateTab={onNavigateTab} />

        {/* Card: Revenus & Croissance (Option A : MRR Contractuel Estimé) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              MRR Contractuel Estimé
            </h3>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Option A
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Revenu Mensuel Récurrent Contractuel (MRR)
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatMRU(mrrContractuel)} <span className="text-xs font-normal text-slate-400">/ mois</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Calculé uniquement sur les <strong>{activeAbonnements} école(s)</strong> disposant d'un abonnement actif (15 000 MRU / mois). Les {trialAbonnements} école(s) en période d'essai gratuit comptent pour 0 MRU.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500">Abonnements Actifs</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {activeAbonnements} école(s)
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500">Essais Gratuits (14j)</div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                  {trialAbonnements} école(s)
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
              Note de transparence : la facturation est actuellement opérée manuellement ou par virement bancaire. Aucun prélèvement automatique récurrent n'est branché sur ce montant.
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Tableau Comparatif des Établissements (Étape 3) */}
      <SchoolComparisonTable
        ecoles={ecoles}
        users={users}
        onNavigateTab={onNavigateTab}
      />

      {/* Row 4: Répartition des Utilisateurs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Répartition des Utilisateurs de la Plateforme
          </h3>

          <div className="text-xs font-semibold text-slate-500">
            {totalUsers} compte(s) au total
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comptes enregistrés
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-900 dark:text-white">
                {totalUsers}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {activeUsers} actifs
              </span>
            </div>

            <div className="mt-6 space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between gap-8 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Directeurs d'école
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{directeursCount}</span>
              </div>
              <div className="flex items-center justify-between gap-8 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  Super Administrateurs
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{superAdminsCount}</span>
              </div>
              <div className="flex items-center justify-between gap-8 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Enseignants / Caissiers / Autres
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{staffCount}</span>
              </div>
            </div>
          </div>

          {/* Proportional visual display */}
          <div className="relative w-full sm:w-64 h-44 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-end justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div
                className="w-full bg-blue-500 rounded-t-lg transition-all"
                style={{
                  height: `${totalUsers > 0 ? Math.max(15, (directeursCount / totalUsers) * 100) : 50}%`,
                }}
              />
              <span className="text-[10px] font-bold text-slate-500">Directeurs</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div
                className="w-full bg-purple-500 rounded-t-lg transition-all"
                style={{
                  height: `${totalUsers > 0 ? Math.max(15, (superAdminsCount / totalUsers) * 100) : 25}%`,
                }}
              />
              <span className="text-[10px] font-bold text-slate-500">Admins</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
              <div
                className="w-full bg-emerald-500 rounded-t-lg transition-all"
                style={{
                  height: `${totalUsers > 0 ? Math.max(15, (staffCount / totalUsers) * 100) : 25}%`,
                }}
              />
              <span className="text-[10px] font-bold text-slate-500">Staff</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
