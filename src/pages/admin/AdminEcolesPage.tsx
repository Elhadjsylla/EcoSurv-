import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAuditEvent } from '../../lib/auditLogger';
import {
  ADMIN_EASE,
  AdminCard,
  AdminPage,
  AdminPageHeader,
  FOCUS_RING,
  STATUS_PILL,
} from '../../components/admin/adminUi';

export interface AdminEcoleItem {
  id: string;
  nom: string;
  ville: string;
  telephone?: string | null;
  email?: string | null;
  statut_activation: 'active' | 'en_attente' | 'suspendue';
  statut_abonnement: 'essai' | 'actif' | 'expire';
  created_at?: string;
  directeur_nom?: string;
  directeur_email?: string;
}

interface AdminEcolesPageProps {
  ecoles: AdminEcoleItem[];
  onRefresh: () => void;
  isLoading: boolean;
}

type StatutFilter = 'all' | 'active' | 'en_attente' | 'suspendue';

export const AdminEcolesPage: React.FC<AdminEcolesPageProps> = ({
  ecoles,
  onRefresh,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutFilter>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const reduce = Boolean(useReducedMotion());

  const handleToggleStatut = async (ecoleId: string, currentStatut: 'active' | 'en_attente' | 'suspendue') => {
    const newStatut = currentStatut === 'active' ? 'suspendue' : 'active';
    setActionLoadingId(ecoleId);
    try {
      const { error } = await supabase.rpc('changer_statut_activation_ecole', {
        p_ecole_id: ecoleId,
        p_statut: newStatut,
      });

      if (error) {
        console.error('[Admin] Erreur changement statut:', error);
        setToastMessage(`Erreur: ${error.message}`);
      } else {
        setToastMessage(`École passée au statut « ${newStatut} » avec succès.`);
        await logAuditEvent({
          actionType: 'school.status_changed',
          targetId: ecoleId,
          metadata: {
            precedent_statut: currentStatut,
            nouveau_statut: newStatut,
          },
        });
        onRefresh();
      }
    } catch (err: any) {
      setToastMessage(`Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const filteredEcoles = ecoles.filter((e) => {
    const matchQuery =
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      (e.ville && e.ville.toLowerCase().includes(search.toLowerCase())) ||
      (e.email && e.email.toLowerCase().includes(search.toLowerCase()));

    const matchStatut = filterStatut === 'all' || e.statut_activation === filterStatut;

    return matchQuery && matchStatut;
  });

  const filters: { id: StatutFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Toutes', count: ecoles.length },
    { id: 'active', label: 'Actives', count: ecoles.filter((e) => e.statut_activation === 'active').length },
    { id: 'en_attente', label: 'En attente', count: ecoles.filter((e) => e.statut_activation === 'en_attente').length },
    { id: 'suspendue', label: 'Suspendues', count: ecoles.filter((e) => e.statut_activation === 'suspendue').length },
  ];

  return (
    <AdminPage>
      {/* Confirmation d'action */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: ADMIN_EASE }}
            className="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminPageHeader
        title="Écoles"
        subtitle={`${ecoles.length} établissement${ecoles.length > 1 ? 's' : ''} enregistré${ecoles.length > 1 ? 's' : ''} sur EcoSurv`}
        actions={
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${FOCUS_RING}`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'motion-safe:animate-spin text-[#1D4ED8]' : ''}`} />
            <span>Actualiser</span>
          </button>
        }
      />

      {/* Recherche et filtres */}
      <AdminCard className="flex flex-col items-stretch justify-between gap-4 !p-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher une école"
            placeholder="Rechercher une école, une ville, un e-mail"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filtrer par statut d'activation"
          className="flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto dark:bg-slate-800"
        >
          {filters.map((t) => {
            const selected = filterStatut === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilterStatut(t.id)}
                className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors ${FOCUS_RING} ${
                  selected
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="ecoles-filter-pill"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-slate-900"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10">
                  {t.label} <span className="tabular-nums text-slate-400">{t.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </AdminCard>

      {/* Tableau des écoles */}
      <AdminCard testId="ecoles-table-card" className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-4 py-3.5">Établissement</th>
                <th className="px-4 py-3.5">Localisation et contact</th>
                <th className="px-4 py-3.5">Directeur</th>
                <th className="px-4 py-3.5">Activation</th>
                <th className="px-4 py-3.5">Abonnement</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium dark:divide-slate-800">
              {filteredEcoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>
                      {ecoles.length === 0
                        ? 'Aucun établissement enregistré.'
                        : 'Aucune école ne correspond à ces critères.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEcoles.map((ecole, i) => (
                  <motion.tr
                    key={ecole.id}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + Math.min(i, 12) * 0.03, ease: ADMIN_EASE }}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300">
                          {ecole.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{ecole.nom}</div>
                          <div className="font-mono text-[11px] text-slate-400">
                            ID : {ecole.id.slice(0, 8)}…
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{ecole.ville || 'Non renseignée'}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>{ecole.telephone || 'Non renseigné'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {ecole.directeur_nom || 'Non assigné'}
                      </div>
                      <div className="max-w-[180px] truncate text-[11px] text-slate-500">
                        {ecole.email || ecole.directeur_email || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {ecole.statut_activation === 'active' && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_PILL.ok}`}>
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      )}
                      {ecole.statut_activation === 'en_attente' && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_PILL.wait}`}>
                          <AlertTriangle className="h-3 w-3" />
                          En attente
                        </span>
                      )}
                      {ecole.statut_activation === 'suspendue' && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_PILL.bad}`}>
                          <PauseCircle className="h-3 w-3" />
                          Suspendue
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center text-[11px] font-semibold capitalize text-slate-600 dark:text-slate-400">
                        {ecole.statut_abonnement}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ecole.statut_activation === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatut(ecole.id, 'active')}
                            disabled={actionLoadingId === ecole.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 cursor-pointer dark:border-rose-900 dark:hover:bg-rose-950/40 ${FOCUS_RING}`}
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                            <span>Suspendre</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatut(ecole.id, ecole.statut_activation)}
                            disabled={actionLoadingId === ecole.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60 cursor-pointer ${FOCUS_RING}`}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Activer l'école</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminPage>
  );
};
