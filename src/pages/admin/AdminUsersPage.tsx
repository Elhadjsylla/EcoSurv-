import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserCheck,
  GraduationCap,
  Briefcase,
  User,
  Power,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { logUserDetailsViewed, logUserStatusChanged } from '../../lib/auditLogger';

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
  onRefresh?: () => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ users: initialUsers, onRefresh }) => {
  const currentProfile = useAuthStore((s) => s.profile);
  const currentAuthUser = useAuthStore((s) => s.user);
  const currentUserId = currentProfile?.id || currentAuthUser?.id;
  const currentUserEmail = (currentProfile?.email || currentAuthUser?.email || '').toLowerCase();

  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<AdminUserRow | null>(null);

  // Synchroniser avec les props
  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Empêcher le scroll d'arrière-plan et fermer sur Escape quand la modale est ouverte
  useEffect(() => {
    if (selectedUserForDetails) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedUserForDetails(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedUserForDetails]);

  // Consultation des détails d'un utilisateur avec journalisation d'audit
  const handleInspectUser = async (user: AdminUserRow) => {
    setSelectedUserForDetails(user);
    await logUserDetailsViewed(user.id, user);
  };

  const handleToggleUserActif = async (user: AdminUserRow) => {
    // Garde-fou de sécurité : interdiction de se désactiver soi-même
    const isSelf =
      user.id === currentUserId ||
      (currentUserEmail && user.email.toLowerCase() === currentUserEmail);

    if (isSelf) {
      setToastMessage('Sécurité : Interdiction de désactiver votre propre compte administrateur.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const newActifState = !user.actif;
    setActionLoadingId(user.id);
    try {
      const { error } = await supabase
        .from('profils')
        .update({ actif: newActifState })
        .eq('id', user.id);

      if (error) {
        console.error('[AdminUsers] Erreur toggle actif:', error);
        setToastMessage(`Erreur: ${error.message}`);
      } else {
        // Mettre à jour localement
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, actif: newActifState } : u))
        );
        setToastMessage(
          `Compte de ${user.prenom} ${user.nom} passé au statut ${newActifState ? 'Actif' : 'Inactif'}.`
        );

        // Journaliser dans audit_logs
        await logUserStatusChanged(user.id, user.actif, newActifState, user.email);

        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setToastMessage(`Erreur réseau: ${err.message}`);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      u.nom.toLowerCase().includes(term) ||
      u.prenom.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.ecole_nom && u.ecole_nom.toLowerCase().includes(term));

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'actif' && u.actif) ||
      (filterStatus === 'inactif' && !u.actif);

    const matchRole = filterRole === 'all' || u.role === filterRole;

    return matchSearch && matchStatus && matchRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </span>
        );
      case 'directeur':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <UserCheck className="h-3 w-3" />
            Directeur
          </span>
        );
      case 'enseignant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <GraduationCap className="h-3 w-3" />
            Enseignant
          </span>
        );
      case 'caissier':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Briefcase className="h-3 w-3" />
            Caissier
          </span>
        );
      case 'parent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <User className="h-3 w-3" />
            Parent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {role}
          </span>
        );
    }
  };

  const actifsCount = users.filter((u) => u.actif).length;
  const inactifsCount = users.filter((u) => !u.actif).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-page-enter">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Utilisateurs de la Plateforme
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Comptes administrateurs, directeurs, enseignants et personnels ({users.length} comptes au total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualiser</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Comptes
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {users.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Comptes Actifs
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {actifsCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Comptes Inactifs / En Attente
          </div>
          <div className="text-2xl font-black text-slate-500 mt-1">
            {inactifsCount}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, école..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs uniquement</option>
            <option value="inactif">Inactifs uniquement</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="super_admin">Super Admin</option>
            <option value="directeur">Directeur</option>
            <option value="enseignant">Enseignant</option>
            <option value="caissier">Caissier</option>
            <option value="parent">Parent</option>
          </select>
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
              <th className="py-3.5 px-4 text-center">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Aucun utilisateur trouvé.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isLoading = actionLoadingId === u.id;
                const isSelf =
                  u.id === currentUserId ||
                  (currentUserEmail && u.email.toLowerCase() === currentUserEmail);

                return (
                  <tr
                    key={u.id}
                    onClick={() => handleInspectUser(u)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.prenom ? u.prenom.charAt(0) : 'U'}{u.nom ? u.nom.charAt(0) : ''}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{u.prenom} {u.nom}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {u.ecole_nom || 'Gestion Globale'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {u.telephone || '—'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {u.actif ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <XCircle className="h-3 w-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td
                      className="py-4 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleInspectUser(u)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Consulter les détails du compte"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {isSelf ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed select-none border border-slate-200 dark:border-slate-700"
                            title="Sécurité : Vous ne pouvez pas désactiver votre propre compte administrateur"
                          >
                            <Lock className="h-3 w-3" />
                            <span>Votre compte</span>
                          </span>
                        ) : u.role === 'super_admin' ? (
                          <span className="text-[11px] text-slate-400 italic px-2">
                            Protégé
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleUserActif(u)}
                            disabled={isLoading}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                              u.actif
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                            }`}
                          >
                            <Power className="h-3 w-3" />
                            <span>{isLoading ? '...' : u.actif ? 'Désactiver' : 'Activer'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de consultation des détails utilisateur (avec événement audit_logs déclenché) */}
      {selectedUserForDetails &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Détails du compte utilisateur
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Fermer
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">ID Système :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUserForDetails.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Nom complet :</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUserForDetails.prenom} {selectedUserForDetails.nom}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Adresse Email :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUserForDetails.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Rôle :</span>
                  <span>{getRoleBadge(selectedUserForDetails.role)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Établissement :</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedUserForDetails.ecole_nom || 'Gestion Globale Plateforme'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Téléphone :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedUserForDetails.telephone || 'Non renseigné'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Statut actuel :</span>
                  <span>
                    {selectedUserForDetails.actif ? (
                      <span className="text-emerald-600 font-bold">Actif (accès autorisé)</span>
                    ) : (
                      <span className="text-rose-600 font-bold">Inactif (accès bloqué)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400">
                <span>Événement consigné dans la table audit_logs</span>
                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
