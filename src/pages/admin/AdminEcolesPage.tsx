import React, { useState } from 'react';
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

export const AdminEcolesPage: React.FC<AdminEcolesPageProps> = ({
  ecoles,
  onRefresh,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'active' | 'en_attente' | 'suspendue'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-page-enter">
      {/* Toast feedback */}
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
            Gestion des Établissements
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Contrôle global des écoles privées inscrites sur EcoSurv ({ecoles.length} au total)
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Filters & Search bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une école, ville, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'all', label: 'Toutes' },
              { id: 'active', label: 'Actives' },
              { id: 'en_attente', label: 'En attente' },
              { id: 'suspendue', label: 'Suspendues' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterStatut(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatut === t.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Établissement</th>
                <th className="py-3.5 px-4">Localisation & Contact</th>
                <th className="py-3.5 px-4">Directeur / Responsable</th>
                <th className="py-3.5 px-4">Statut d'Activation</th>
                <th className="py-3.5 px-4">Abonnement</th>
                <th className="py-3.5 px-4 text-right">Actions Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {filteredEcoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Aucune école trouvée pour ces critères.</p>
                  </td>
                </tr>
              ) : (
                filteredEcoles.map((ecole) => (
                  <tr
                    key={ecole.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Établissement */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {ecole.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {ecole.nom}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {ecole.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Localisation & Contact */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{ecole.ville || 'Nouakchott'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{ecole.telephone || 'Non renseigné'}</span>
                      </div>
                    </td>

                    {/* Directeur */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {ecole.directeur_nom || 'Responsable de direction'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {ecole.email || ecole.directeur_email || '—'}
                      </div>
                    </td>

                    {/* Statut Activation */}
                    <td className="py-4 px-4">
                      {ecole.statut_activation === 'active' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Active
                        </span>
                      )}
                      {ecole.statut_activation === 'en_attente' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          En attente
                        </span>
                      )}
                      {ecole.statut_activation === 'suspendue' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <PauseCircle className="h-3 w-3 text-rose-500" />
                          Suspendue
                        </span>
                      )}
                    </td>

                    {/* Abonnement */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                        {ecole.statut_abonnement === 'essai' ? 'Essai 14j' : ecole.statut_abonnement}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ecole.statut_activation === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatut(ecole.id, 'active')}
                            disabled={actionLoadingId === ecole.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                            <span>Suspendre</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatut(ecole.id, ecole.statut_activation)}
                            disabled={actionLoadingId === ecole.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Activer l'école</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
