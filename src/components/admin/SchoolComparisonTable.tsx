import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';
import { AdminEcoleItem } from '../../pages/admin/AdminEcolesPage';
import { AdminUserRow } from '../../pages/admin/AdminUsersPage';
import { ADMIN_EASE, AdminCard, CardTitle, FOCUS_RING, STATUS_PILL } from './adminUi';

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
  const reduce = Boolean(useReducedMotion());

  // Croisement réel entre écoles et profils utilisateurs
  const comparisonData = useMemo(() => {
    return ecoles.map((ecole) => {
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
    const result = comparisonData.filter((e) => {
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
      setSortAsc(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'active':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_PILL.ok}`}>
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'en_attente':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_PILL.wait}`}>
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_PILL.bad}`}>
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
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${STATUS_PILL.info}`}>
            Actif
          </span>
        );
      case 'essai':
        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${STATUS_PILL.wait}`}>
            Essai
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${STATUS_PILL.neutral}`}>
            Expiré
          </span>
        );
    }
  };

  const sortableTh = (field: 'nom' | 'users' | 'date', label: string, align = '') => (
    <th
      aria-sort={sortField === field ? (sortAsc ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-3 ${align}`}
    >
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1.5 rounded uppercase tracking-wider font-extrabold cursor-pointer transition-colors hover:text-slate-700 dark:hover:text-slate-200 ${FOCUS_RING} ${
          sortField === field ? 'text-[#1D4ED8] dark:text-blue-300' : ''
        }`}
      >
        <span>{label}</span>
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );

  return (
    <AdminCard testId="comparison-table-card" className="space-y-4">
      <CardTitle
        icon={<Building2 className="h-4 w-4" />}
        title="Comparatif des établissements"
        subtitle="Écoles, comptes rattachés et abonnements"
        right={
          <div className="relative w-full max-w-[16rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Rechercher une école ou une ville"
              placeholder="Rechercher une école, une ville"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
            />
          </div>
        }
      />

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200/80 text-[11px] text-slate-400 dark:border-slate-800">
              {sortableTh('nom', 'Établissement')}
              <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider">Activation</th>
              <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider">Abonnement</th>
              {sortableTh('users', 'Comptes')}
              <th className="px-3 py-3 text-[11px] font-extrabold uppercase tracking-wider">Directeur</th>
              {sortableTh('date', "Inscription", 'text-right')}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/60">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  {ecoles.length === 0
                    ? 'Aucun établissement enregistré.'
                    : 'Aucun établissement ne correspond à la recherche.'}
                </td>
              </tr>
            ) : (
              filteredAndSorted.slice(0, 8).map((ecole, i) => {
                const dateFormatted = ecole.created_at
                  ? new Date(ecole.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <motion.tr
                    key={ecole.id}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + i * 0.04, ease: ADMIN_EASE }}
                    onClick={() => onNavigateTab('ecoles')}
                    className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300">
                          {ecole.nom.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 transition-colors group-hover:text-[#1D4ED8] dark:text-white dark:group-hover:text-blue-300">
                            {ecole.nom}
                            <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {ecole.ville && ecole.ville !== '—' ? ecole.ville : 'Ville non renseignée'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">{getStatusBadge(ecole.statut_activation)}</td>
                    <td className="px-3 py-3">{getAbonnementBadge(ecole.statut_abonnement)}</td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {ecole.totalUsersCount}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({ecole.directeursCount} dir. · {ecole.staffCount} autre{ecole.staffCount > 1 ? 's' : ''})
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="max-w-[180px] truncate">
                        <span className="block truncate font-semibold text-slate-700 dark:text-slate-300">
                          {ecole.directeur_nom || 'Non assigné'}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-slate-400">
                          {ecole.directeur_email || ecole.email || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-medium text-slate-500 dark:text-slate-400">
                      {dateFormatted}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
        <span>
          {Math.min(filteredAndSorted.length, 8)} sur {filteredAndSorted.length} école
          {filteredAndSorted.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => onNavigateTab('ecoles')}
          className={`rounded text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer dark:text-blue-300 ${FOCUS_RING}`}
        >
          Ouvrir le registre des écoles
        </button>
      </div>
    </AdminCard>
  );
};
