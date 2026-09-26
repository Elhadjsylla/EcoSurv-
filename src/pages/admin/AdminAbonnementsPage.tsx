import React from 'react';
import { CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { AdminEcoleItem } from './AdminEcolesPage';
import { formatMRU } from '../../lib/utils';

interface AdminAbonnementsPageProps {
  ecoles: AdminEcoleItem[];
}

export const AdminAbonnementsPage: React.FC<AdminAbonnementsPageProps> = ({ ecoles }) => {
  const trialCount = ecoles.filter((e) => e.statut_abonnement === 'essai').length;
  const activeCount = ecoles.filter((e) => e.statut_abonnement === 'actif').length;

  // Option A MRR calculation
  const mrrContractuel = activeCount * 15000;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-page-enter">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Abonnements & Licences
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Suivi commercial et statut contractuel des écoles partenaires EcoSurv
        </p>
      </div>

      {/* Plan summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
            <Clock className="h-4 w-4" />
            <span>Période d'Essai (14 jours)</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {trialCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Écoles en découverte • 0 MRU comptabilisé</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            <CheckCircle2 className="h-4 w-4" />
            <span>Abonnements Actifs</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {activeCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Contrats actifs (15 000 MRU / mois)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
            <CreditCard className="h-4 w-4" />
            <span>MRR Contractuel Estimé</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatMRU(mrrContractuel)} <span className="text-xs font-normal text-slate-400">/ mois</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Option A : calculé sur les écoles actives</p>
        </div>
      </div>

      {/* Note de non-automatisation */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Précision sur la facturation :</strong> Les abonnements EcoSurv sont actuellement réglés par virement bancaire ou espèces selon les contrats signés avec les directions d'écoles. Aucun service de prélèvement bancaire automatique en ligne n'est branché sur ce montant.
        </div>
      </div>

      {/* Table of active licenses */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          <span>État des licences par école</span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Établissement</th>
              <th className="py-3 px-4">Directeur</th>
              <th className="py-3 px-4">Statut d'Abonnement</th>
              <th className="py-3 px-4 text-right">Montant Contractuel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {ecoles.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Aucun établissement enregistré.
                </td>
              </tr>
            ) : (
              ecoles.map((ecole) => {
                const isActif = ecole.statut_abonnement === 'actif';
                const isEssai = ecole.statut_abonnement === 'essai';

                return (
                  <tr key={ecole.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{ecole.nom}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{ecole.directeur_nom || 'Directeur'}</td>
                    <td className="py-3.5 px-4">
                      {isActif ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Abonnement Actif
                        </span>
                      ) : isEssai ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Essai 14 jours
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {ecole.statut_abonnement}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {isActif ? '15 000 MRU / mois' : '0 MRU (Essai gratuit)'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
