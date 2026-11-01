import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, CheckCircle2, Clock, Info } from 'lucide-react';
import { AdminEcoleItem } from './AdminEcolesPage';
import {
  ADMIN_EASE,
  AdminCard,
  AdminPage,
  AdminPageHeader,
  AnimatedNumber,
  STATUS_PILL,
} from '../../components/admin/adminUi';

interface AdminAbonnementsPageProps {
  ecoles: AdminEcoleItem[];
}

export const AdminAbonnementsPage: React.FC<AdminAbonnementsPageProps> = ({ ecoles }) => {
  const reduce = Boolean(useReducedMotion());
  const trialCount = ecoles.filter((e) => e.statut_abonnement === 'essai').length;
  const activeCount = ecoles.filter((e) => e.statut_abonnement === 'actif').length;
  const expiredCount = ecoles.filter((e) => e.statut_abonnement === 'expire').length;

  const summary = [
    { id: 'actif', label: 'Abonnements actifs', value: activeCount, icon: CheckCircle2, hint: 'Écoles avec un abonnement actif' },
    { id: 'essai', label: 'En essai', value: trialCount, icon: Clock, hint: "Écoles dont le statut d'abonnement est « essai »" },
    { id: 'expire', label: 'Expirés', value: expiredCount, icon: CreditCard, hint: "Écoles dont l'abonnement est expiré" },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        title="Abonnements"
        subtitle="Statut d'abonnement de chaque école enregistrée"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <AdminCard key={s.id} testId={`abo-${s.id}`} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {s.label}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                <AnimatedNumber value={s.value} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.hint}</p>
            </AdminCard>
          );
        })}
      </div>

      <AdminCard className="flex items-start gap-3 !p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8] dark:text-blue-300" />
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Les montants contractuels ne sont pas encore gérés dans cette console : la colonne « Montant »
          reste à définir pour les abonnements actifs.
        </p>
      </AdminCard>

      <AdminCard testId="abo-table-card" className="!p-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 p-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
          <CreditCard className="h-4 w-4 text-[#1D4ED8] dark:text-blue-300" />
          <span>État des abonnements par école</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3">Établissement</th>
                <th className="px-4 py-3">Directeur</th>
                <th className="px-4 py-3">Abonnement</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
              {ecoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Aucun établissement enregistré.
                  </td>
                </tr>
              ) : (
                ecoles.map((ecole, i) => {
                  const isActif = ecole.statut_abonnement === 'actif';
                  const isEssai = ecole.statut_abonnement === 'essai';
                  const pill = isActif ? STATUS_PILL.info : isEssai ? STATUS_PILL.wait : STATUS_PILL.neutral;
                  const label = isActif ? 'Actif' : isEssai ? 'Essai' : ecole.statut_abonnement === 'expire' ? 'Expiré' : ecole.statut_abonnement;
                  return (
                    <motion.tr
                      key={ecole.id}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + Math.min(i, 12) * 0.03, ease: ADMIN_EASE }}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{ecole.nom}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {ecole.directeur_nom || 'Non assigné'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${pill}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {isActif ? 'À définir' : '—'}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminPage>
  );
};
