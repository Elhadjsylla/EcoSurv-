import React from 'react';
import { CreditCard, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { AdminEcoleItem } from './AdminEcolesPage';

interface AdminAbonnementsPageProps {
  ecoles: AdminEcoleItem[];
}

export const AdminAbonnementsPage: React.FC<AdminAbonnementsPageProps> = ({ ecoles }) => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-page-enter">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Abonnements & Licences
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Suivi commercial et facturation des écoles partenaires EcoSurv
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
            {ecoles.filter((e) => e.statut_abonnement === 'essai').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Écoles en découverte de la solution</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            <CheckCircle2 className="h-4 w-4" />
            <span>Abonnements Actifs</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {ecoles.filter((e) => e.statut_abonnement === 'actif').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Facturation mensuelle ou trimestrielle</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Tarif Standard</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            15 000 MRU <span className="text-xs font-normal text-slate-400">/ mois</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Support dédié & WhatsApp illimité</p>
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
              <th className="py-3 px-4 text-right">Montant Récurrent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {ecoles.map((ecole) => (
              <tr key={ecole.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ecole.nom}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{ecole.directeur_nom || 'Directeur'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    {ecole.statut_abonnement === 'essai' ? 'Essai 14 jours' : ecole.statut_abonnement}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                  15 000 MRU / mois
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
