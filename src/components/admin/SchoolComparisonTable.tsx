import React, { useState, useMemo } from 'react';
import { AdminEcoleItem } from '../../pages/admin/AdminEcolesPage';
import { AdminUserRow } from '../../pages/admin/AdminUsersPage';
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';

interface SchoolComparisonTableProps {
  ecoles: AdminEcoleItem[];
  users: AdminUserRow[];
  onNavigateTab: (tab: 'ecoles' | 'utilisateurs') => void;
}

export const SchoolComparisonTable: React.FC<SchoolComparisonTableProps> = ({
  ecoles,
  users,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'nom' | 'users' | 'date'>('users');
  const [sortAsc, setSortAsc] = useState(false);

  // Croisement 100% réel entre ecoles et profils utilisateurs
  const comparisonData = useMemo(() => {
    return ecoles.map((ecole) => {
      // Compter les utilisateurs dont l'école correspond
      const schoolUsers = users.filter((u) => u.ecole_nom === ecole.nom);
      const directeurs = schoolUsers.filter((u) => u.role === 'directeur');
      const staff = schoolUsers.filter((u) => u.role !== 'directeur' && u.role !== 'super_admin');

      return {
        ...ecole,
        totalUsersCount: schoolUsers.length,
        directeursCount: directeurs.length,
        staffCount: staff.length,
      };
    });
  }, [ecoles, users]);

  const filteredAndSorted = useMemo(() => {
    let result = comparisonData.filter((e) => {
      const q = searchTerm.toLowerCase();
      return (
        e.nom.toLowerCase().includes(q) ||
        (e.ville && e.ville.toLowerCase().includes(q)) ||
        (e.directeur_nom && e.directeur_nom.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nom') {
        cmp = a.nom.localeCompare(b.nom);
      } else if (sortField === 'users') {
        cmp = a.totalUsersCount - b.totalUsersCount;
      } else if (sortField === 'date') {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        cmp = da - db;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [comparisonData, searchTerm, sortField, sortAsc]);

  const toggleSort = (field: 'nom' | 'users' | 'date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // par défaut décroissant
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'en_attente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="h-3 w-3" />
            Suspendue
          </span>
        );
    }
  };

  const getAbonnementBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Payant
          </span>
        );
      case 'essai':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Essai 14j
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Expiré
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Tableau Comparatif des Établissements
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi croisé en temps réel des écoles, comptes rattachés et formules contractuelles
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une école, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <th
                onClick={() => toggleSort('nom')}
                className="py-3 px-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Établissement</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3">Statut Activation</th>
              <th className="py-3 px-3">Formule</th>
              <th
                onClick={() => toggleSort('users')}
                className="py-3 px-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Comptes Rattachés</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3">Directeur</th>
              <th
                onClick={() => toggleSort('date')}
                className="py-3 px-3 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Date d'inscription</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Aucun établissement ne correspond à la recherche.
                </td>
              </tr>
            ) : (
              filteredAndSorted.slice(0, 8).map((ecole) => {
                const dateFormatted = ecole.created_at
                  ? new Date(ecole.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={ecole.id}
                    onClick={() => onNavigateTab('ecoles')}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Nom & Ville */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                          {ecole.nom.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            {ecole.nom}
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {ecole.ville || 'Nouakchott'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Statut Activation */}
                    <td className="py-3 px-3">
                      {getStatusBadge(ecole.statut_activation)}
                    </td>

                    {/* Formule Abonnement */}
                    <td className="py-3 px-3">
                      {getAbonnementBadge(ecole.statut_abonnement)}
                    </td>

                    {/* Comptes rattachés */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white">
                          {ecole.totalUsersCount}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({ecole.directeursCount} dir. • {ecole.staffCount} staff)
                        </span>
                      </div>
                    </td>

                    {/* Directeur */}
                    <td className="py-3 px-3">
                      <div className="truncate max-w-[180px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">
                          {ecole.directeur_nom || 'Directeur'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block truncate">
                          {ecole.directeur_email || ecole.email || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Date d'inscription */}
                    <td className="py-3 px-3 text-right font-medium text-slate-500 dark:text-slate-400">
                      {dateFormatted}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>
          Affichage des {Math.min(filteredAndSorted.length, 8)} sur {filteredAndSorted.length} école(s)
        </span>
        <button
          type="button"
          onClick={() => onNavigateTab('ecoles')}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Ouvrir le registre complet des écoles →
        </button>
      </div>
    </div>
  );
};
