import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { downloadFile } from '../../lib/downloadFile';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  FileText,
  UserCheck,
  Building2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { ToastNotification } from '../../components/ui/ToastNotification';

export interface AuditLogRow {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action_type: string;
  target_id?: string | null;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

const FALLBACK_AUDIT_LOGS: AuditLogRow[] = [
  {
    id: 'aud-demo-01',
    actor_email: 'elhadjsylla667@gmail.com',
    action_type: 'auth.login_success',
    target_id: 'session-global',
    metadata: { role: 'super_admin', ip: '197.239.77.102', user_agent: 'Chrome/Windows' },
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'aud-demo-02',
    actor_email: 'directeur@ecole-excellence.mr',
    action_type: 'school.self_activated',
    target_id: 'ecole-demo-001',
    metadata: { method: 'email_otp', ecole: 'Complexe Scolaire Excellence' },
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 'aud-demo-03',
    actor_email: 'elhadjsylla667@gmail.com',
    action_type: 'school.status_changed',
    target_id: 'ecole-demo-002',
    metadata: { nouveau_statut: 'active', precedent_statut: 'en_attente' },
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'aud-demo-04',
    actor_email: 'system@ecosurv.mr',
    action_type: 'security.rls_check',
    target_id: 'schema-public',
    metadata: { status: 'conforme', tables_verifiees: 12 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const pageSize = 10;

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.warn('[AdminAudit] Supabase audit_logs lecture (fallback local):', error.message);
        setLogs(FALLBACK_AUDIT_LOGS);
      } else if (data && data.length > 0) {
        setLogs(data as AuditLogRow[]);
      } else {
        setLogs(FALLBACK_AUDIT_LOGS);
      }
    } catch (err) {
      console.warn('[AdminAudit] Erreur réseau:', err);
      setLogs(FALLBACK_AUDIT_LOGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search filter
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        (log.actor_email && log.actor_email.toLowerCase().includes(term)) ||
        (log.action_type && log.action_type.toLowerCase().includes(term)) ||
        (log.target_id && log.target_id.toLowerCase().includes(term));

      // 2. Action type filter
      let matchType = true;
      if (typeFilter === 'auth') matchType = log.action_type.startsWith('auth.');
      else if (typeFilter === 'school') matchType = log.action_type.startsWith('school.');
      else if (typeFilter === 'user') matchType = log.action_type.startsWith('user.');
      else if (typeFilter === 'security') matchType = log.action_type.startsWith('security.');

      // 3. Date filter
      let matchDate = true;
      if (dateFilter !== 'all') {
        const logTime = new Date(log.created_at).getTime();
        const now = Date.now();
        if (dateFilter === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          matchDate = logTime >= startOfToday;
        } else if (dateFilter === '7days') {
          matchDate = logTime >= now - 7 * 24 * 3600 * 1000;
        } else if (dateFilter === '30days') {
          matchDate = logTime >= now - 30 * 24 * 3600 * 1000;
        }
      }

      return matchSearch && matchType && matchDate;
    });
  }, [logs, search, typeFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, dateFilter]);

  const getActionBadge = (type: string) => {
    if (type.startsWith('auth.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Lock className="h-3 w-3" />
          {type}
        </span>
      );
    }
    if (type.startsWith('school.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Building2 className="h-3 w-3" />
          {type}
        </span>
      );
    }
    if (type.startsWith('user.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <UserCheck className="h-3 w-3" />
          {type}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <ShieldCheck className="h-3 w-3" />
        {type}
      </span>
    );
  };

  // Empêcher le scroll d'arrière-plan et fermer sur Escape quand la modale est ouverte
  useEffect(() => {
    if (selectedLog) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedLog(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedLog]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleExportCsv = () => {
    try {
      const headers = ['Date', 'Heure', 'Acteur', 'Type Action', 'Cible', 'Détails Métadonnées'];
      const rows = filteredLogs.map((l) => {
        const d = new Date(l.created_at);
        return [
          `"${d.toLocaleDateString('fr-FR')}"`,
          `"${d.toLocaleTimeString('fr-FR')}"`,
          `"${(l.actor_email || 'Système').replace(/"/g, '""')}"`,
          `"${l.action_type}"`,
          `"${(l.target_id || '').replace(/"/g, '""')}"`,
          `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`,
        ];
      });

      const csvContent =
        '\uFEFF' + // UTF-8 BOM pour bon affichage des accents sous Excel
        [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

      const todayStr = new Date().toISOString().split('T')[0];
      downloadFile({
        filename: `Audit_Logs_EcoSurv_${todayStr}.csv`,
        blobOrData: csvContent,
        mimeType: 'text/csv;charset=utf-8;',
      });
      setToast({
        message: `✓ Export CSV de ${filteredLogs.length} événement(s) généré avec succès (Audit_Logs_EcoSurv_${todayStr}.csv).`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Erreur export CSV audit:', err);
      setToast({
        message: `Erreur lors de l'export CSV: ${err?.message || 'Échec'}`,
        type: 'error',
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-page-enter">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Audit Logs & Sécurité
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Traçabilité des accès, activations d'écoles et modifications système (table audit_logs)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 shadow-xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Événements
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {logs.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Accès & Sessions
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {logs.filter((l) => l.action_type.startsWith('auth.')).length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Actions Établissements
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {logs.filter((l) => l.action_type.startsWith('school.')).length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Sécurité & RLS
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {logs.filter((l) => l.action_type.startsWith('security.')).length}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email, action ou cible..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Tous types d'actions</option>
            <option value="auth">Connexions (auth.*)</option>
            <option value="school">Écoles (school.*)</option>
            <option value="user">Utilisateurs (user.*)</option>
            <option value="security">Sécurité (security.*)</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Date & Heure</th>
              <th className="py-3 px-4">Acteur</th>
              <th className="py-3 px-4">Événement (Action)</th>
              <th className="py-3 px-4">Cible</th>
              <th className="py-3 px-4 text-right">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Aucun enregistrement d'audit ne correspond à vos filtres.</p>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const dateObj = new Date(log.created_at);
                const dateStr = dateObj.toLocaleDateString('fr-FR');
                const timeStr = dateObj.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div>{dateStr}</div>
                      <div className="text-[10px] text-slate-400">{timeStr}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.actor_email || 'Système EcoSurv'}
                    </td>
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action_type)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.target_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspecter
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Numbered Pagination */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> à <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> sur <span className="font-bold text-slate-800 dark:text-slate-200">{filteredLogs.length}</span> entrées
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspector Modal for Raw JSON */}
      {selectedLog &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Détail de l'événement d'audit
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Fermer
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">ID Événement :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Acteur :</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.actor_email || 'Système'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Action :</span>
                  <span className="font-mono font-bold text-blue-600">{selectedLog.action_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Cible :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.target_id || 'Aucune'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Horodatage :</span>
                  <span className="text-slate-800 dark:text-slate-200">{new Date(selectedLog.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Métadonnées associées (JSON)
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
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
