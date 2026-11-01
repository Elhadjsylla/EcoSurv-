import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Building2,
  Users,
  CreditCard,
  Clock,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  UsersRound,
} from 'lucide-react';
import { AdminEcoleItem } from './AdminEcolesPage';
import { AdminUserRow } from './AdminUsersPage';
import { SchoolDistributionDonut } from '../../components/admin/SchoolDistributionDonut';
import { LiveAuditFeed } from '../../components/admin/LiveAuditFeed';
import { SchoolComparisonTable } from '../../components/admin/SchoolComparisonTable';
import { PlatformActivationGauge } from '../../components/admin/PlatformActivationGauge';
import {
  ADMIN_EASE,
  AdminCard,
  AdminPage,
  AdminPageHeader,
  AnimatedNumber,
  CardTitle,
  FOCUS_RING,
  SegmentedBar,
  Skeleton,
  STATUS_PILL,
} from '../../components/admin/adminUi';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'ecoles' | 'utilisateurs' | 'abonnements' | 'audit') => void;
  ecoles: AdminEcoleItem[];
  users: AdminUserRow[];
  /** Chargement en cours des écoles et des profils (facultatif : sans lui, la page s'affiche comme avant). */
  isLoading?: boolean;
  loadError?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
}

interface KpiProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  hint: string;
  /** Part de 0 à 1 affichée dans la fine barre sous le chiffre. */
  progress?: number;
  attention?: boolean;
  loading?: boolean;
  onClick: () => void;
  testId: string;
}

const Kpi: React.FC<KpiProps> = ({
  label,
  value,
  icon,
  hint,
  progress,
  attention = false,
  loading = false,
  onClick,
  testId,
}) => {
  const reduce = Boolean(useReducedMotion());
  return (
    <AdminCard interactive onClick={onClick} testId={testId} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            attention
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              : 'bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300'
          }`}
        >
          {icon}
        </span>
      </div>

      <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {loading ? <Skeleton className="h-9 w-16" /> : <AnimatedNumber value={value} />}
      </div>

      {progress !== undefined && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className={`h-full w-full origin-left rounded-full ${
              attention ? 'bg-amber-500' : 'bg-[#1D4ED8]'
            }`}
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: loading ? 0 : Math.min(1, Math.max(0, progress)) }}
            transition={{ duration: 0.8, delay: 0.2, ease: ADMIN_EASE }}
          />
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{hint}</p>
    </AdminCard>
  );
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  ecoles,
  users,
  isLoading = false,
  loadError = false,
  lastUpdated = null,
  onRefresh,
}) => {
  const reduce = Boolean(useReducedMotion());

  // Calculs réels à partir des écoles et des profils chargés
  const totalEcoles = ecoles.length;
  const activeEcoles = ecoles.filter((e) => e.statut_activation === 'active').length;
  const pendingEcoles = ecoles.filter((e) => e.statut_activation === 'en_attente').length;
  const suspendedEcoles = ecoles.filter((e) => e.statut_activation === 'suspendue').length;

  const activeAbonnements = ecoles.filter((e) => e.statut_abonnement === 'actif').length;
  const trialAbonnements = ecoles.filter((e) => e.statut_abonnement === 'essai').length;
  const expiredAbonnements = ecoles.filter((e) => e.statut_abonnement === 'expire').length;
  const otherAbonnements = totalEcoles - activeAbonnements - trialAbonnements - expiredAbonnements;

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.actif).length;
  const directeursCount = users.filter((u) => u.role === 'directeur').length;
  const superAdminsCount = users.filter((u) => u.role === 'super_admin').length;
  const staffCount = users.filter((u) => !['directeur', 'super_admin'].includes(u.role)).length;

  const firstLoad = isLoading && totalEcoles === 0 && totalUsers === 0;

  const statusChip = loadError ? (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_PILL.bad}`}
    >
      <AlertCircle className="h-3.5 w-3.5" />
      Données indisponibles
    </span>
  ) : isLoading ? (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_PILL.info}`}
    >
      <RefreshCw className="h-3.5 w-3.5 motion-safe:animate-spin" />
      Chargement
    </span>
  ) : lastUpdated ? (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_PILL.neutral}`}
    >
      <Clock className="h-3.5 w-3.5" />
      Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  ) : null;

  const usersRows = [
    { id: 'directeurs', label: "Directeurs d'école", count: directeursCount, bar: 'bg-[#1D4ED8]' },
    { id: 'staff', label: 'Enseignants, caissiers et parents', count: staffCount, bar: 'bg-blue-300 dark:bg-blue-400' },
    { id: 'admins', label: 'Super administrateurs', count: superAdminsCount, bar: 'bg-slate-700 dark:bg-slate-300' },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        title="Tableau de bord"
        subtitle="Supervision de la plateforme EcoSurv"
        actions={
          <>
            {statusChip}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Actualiser les données"
                className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${FOCUS_RING}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'motion-safe:animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            )}
          </>
        }
      />

      {/* Quatre chiffres clés, chacun mène à l'onglet correspondant */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          testId="kpi-ecoles"
          label="Écoles enregistrées"
          value={totalEcoles}
          icon={<Building2 className="h-5 w-5" />}
          progress={totalEcoles > 0 ? activeEcoles / totalEcoles : 0}
          loading={firstLoad}
          hint={`${activeEcoles} active${activeEcoles > 1 ? 's' : ''} · ${pendingEcoles} en attente · ${suspendedEcoles} suspendue${suspendedEcoles > 1 ? 's' : ''}`}
          onClick={() => onNavigateTab('ecoles')}
        />
        <Kpi
          testId="kpi-comptes"
          label="Comptes utilisateurs"
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
          progress={totalUsers > 0 ? activeUsers / totalUsers : 0}
          loading={firstLoad}
          hint={`${activeUsers} actif${activeUsers > 1 ? 's' : ''} · ${directeursCount} directeur${directeursCount > 1 ? 's' : ''} · ${staffCount} autre${staffCount > 1 ? 's' : ''} rôle${staffCount > 1 ? 's' : ''}`}
          onClick={() => onNavigateTab('utilisateurs')}
        />
        <Kpi
          testId="kpi-abonnements"
          label="Abonnements actifs"
          value={activeAbonnements}
          icon={<CreditCard className="h-5 w-5" />}
          progress={totalEcoles > 0 ? activeAbonnements / totalEcoles : 0}
          loading={firstLoad}
          hint={`${trialAbonnements} en essai · ${expiredAbonnements} expiré${expiredAbonnements > 1 ? 's' : ''}`}
          onClick={() => onNavigateTab('abonnements')}
        />
        <Kpi
          testId="kpi-a-traiter"
          label="À traiter"
          value={pendingEcoles}
          icon={<Clock className="h-5 w-5" />}
          attention={pendingEcoles > 0}
          loading={firstLoad}
          hint={
            pendingEcoles > 0
              ? `École${pendingEcoles > 1 ? 's' : ''} en attente d'activation : à examiner`
              : "Aucune école en attente d'activation"
          }
          onClick={() => onNavigateTab('ecoles')}
        />
      </div>

      {/* Répartition des écoles et journal d'audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SchoolDistributionDonut ecoles={ecoles} onNavigateTab={onNavigateTab} />
        <LiveAuditFeed onNavigateAudit={() => onNavigateTab('audit')} />
      </div>

      {/* Déploiement des écoles et abonnements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformActivationGauge ecoles={ecoles} onNavigateTab={onNavigateTab} />

        <AdminCard testId="abonnements-card" className="flex flex-col">
          <CardTitle
            icon={<CreditCard className="h-4 w-4" />}
            title="Abonnements"
            subtitle="Statut d'abonnement des écoles enregistrées"
          />
          <div className="space-y-5 flex-1">
            <SegmentedBar
              total={totalEcoles}
              segments={[
                { id: 'actif', value: activeAbonnements, className: 'bg-[#1D4ED8]', label: 'Actifs' },
                { id: 'essai', value: trialAbonnements, className: 'bg-amber-400', label: 'En essai' },
                { id: 'expire', value: expiredAbonnements, className: 'bg-slate-400', label: 'Expirés' },
                { id: 'autre', value: Math.max(0, otherAbonnements), className: 'bg-slate-300 dark:bg-slate-600', label: 'Autres' },
              ]}
            />
            <dl className="grid grid-cols-3 gap-3">
              {[
                { label: 'Actifs', value: activeAbonnements, dot: 'bg-[#1D4ED8]' },
                { label: 'En essai', value: trialAbonnements, dot: 'bg-amber-400' },
                { label: 'Expirés', value: expiredAbonnements, dot: 'bg-slate-400' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                    <AnimatedNumber value={row.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Les montants contractuels ne sont pas encore gérés dans cette console.
            </p>
          </div>
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onNavigateTab('abonnements')}
              className={`inline-flex items-center gap-1.5 rounded text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer dark:text-blue-300 ${FOCUS_RING}`}
            >
              <span>Voir les abonnements</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </AdminCard>
      </div>

      {/* Tableau comparatif des écoles */}
      <SchoolComparisonTable ecoles={ecoles} users={users} onNavigateTab={onNavigateTab} />

      {/* Répartition des comptes par rôle */}
      <AdminCard testId="users-repartition">
        <CardTitle
          icon={<UsersRound className="h-4 w-4" />}
          title="Répartition des comptes"
          subtitle={`${totalUsers} compte${totalUsers > 1 ? 's' : ''} au total, ${activeUsers} actif${activeUsers > 1 ? 's' : ''}`}
        />
        <div className="space-y-4">
          {usersRows.map((row, i) => {
            const pct = totalUsers > 0 ? (row.count / totalUsers) * 100 : 0;
            return (
              <div key={row.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
                  <span className="tabular-nums text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      <AnimatedNumber value={row.count} />
                    </span>{' '}
                    · {Math.round(pct)} %
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    className={`h-full w-full origin-left rounded-full ${row.bar}`}
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: ADMIN_EASE }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </AdminPage>
  );
};
