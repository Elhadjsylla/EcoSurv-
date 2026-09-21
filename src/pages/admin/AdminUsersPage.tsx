import React, { useState } from 'react';
import { Users, Search, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react';

export interface AdminUserRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone?: string | null;
  ecole_nom?: string;
  actif: boolean;
}

interface AdminUsersPageProps {
  users: AdminUserRow[];
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ users }) => {
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.ecole_nom && u.ecole_nom.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Utilisateurs de la Plateforme
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Comptes administrateurs, directeurs et membres du personnel ({users.length} comptes)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4">Utilisateur</th>
              <th className="py-3.5 px-4">Rôle</th>
              <th className="py-3.5 px-4">Établissement Rattaché</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4 text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Aucun utilisateur trouvé.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                        {u.prenom.charAt(0)}{u.nom.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.prenom} {u.nom}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {u.role === 'super_admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <ShieldCheck className="h-3 w-3" />
                        Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <UserCheck className="h-3 w-3" />
                        Directeur
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {u.ecole_nom || 'Gestion Plateforme (Globale)'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {u.telephone || '—'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Actif
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
