import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Building2,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Clock,
} from 'lucide-react';

export interface LiveAuditEvent {
  id: string;
  actor_email?: string | null;
  action_type: string;
  target_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface LiveAuditFeedProps {
  onNavigateAudit?: () => void;
}

export const LiveAuditFeed: React.FC<LiveAuditFeedProps> = ({ onNavigateAudit }) => {
  const [events, setEvents] = useState<LiveAuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (dbError) {
        console.error('[LiveAuditFeed] Erreur lecture audit_logs:', dbError.message);
        setError(dbError.message);
        setEvents([]);
      } else {
        setEvents((data as LiveAuditEvent[]) || []);
      }
    } catch (err: any) {
      console.error('[LiveAuditFeed] Exception:', err);
      setError(err?.message || 'Erreur réseau');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentEvents();
  }, []);

  const getEventBadge = (actionType: string) => {
    if (actionType.startsWith('auth.')) {
      return {
        label: 'Authentification',
        icon: KeyRound,
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
      };
    }
    if (actionType.startsWith('school.')) {
      return {
        label: 'Établissement',
        icon: Building2,
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
      };
    }
    if (actionType.startsWith('user.')) {
      return {
        label: 'Utilisateur',
        icon: UserCheck,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
      };
    }
    return {
      label: 'Système',
      icon: ShieldCheck,
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
    };
  };

  const formatActionLabel = (actionType: string, metadata?: Record<string, any> | null) => {
    switch (actionType) {
      case 'auth.login_success':
        return 'Connexion Super Admin validée';
      case 'school.self_activated':
        return 'Auto-activation établissement (OTP validé)';
      case 'school.status_changed':
        return metadata?.nouveau_statut
          ? `Statut établissement changé en « ${metadata.nouveau_statut} »`
          : "Modification du statut d'un établissement";
      case 'user.status_changed':
        return metadata?.nouveau_statut
          ? `Compte utilisateur passé à « ${metadata.nouveau_statut} »`
          : "Modification de l'état d'un compte utilisateur";
      case 'user.details_viewed':
        return "Consultation détaillée d'une fiche utilisateur";
      default:
        return actionType.replace(/[._]/g, ' ');
    }
  };

  const formatRelativeTime = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 2) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Flux d'Activité en Direct
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dernières actions réelles enregistrées dans <code className="font-mono text-purple-600 dark:text-purple-400">audit_logs</code>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRecentEvents}
          disabled={isLoading}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Actualiser le flux"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-2 min-h-[160px] flex flex-col justify-center">
        {isLoading ? (
          <div className="py-8 text-center text-slate-400">
            <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin text-purple-500" />
            <p className="text-xs">Chargement du flux d'audit...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-rose-500">
            <AlertCircle className="h-6 w-6 mx-auto mb-1 text-rose-500" />
            <p className="text-xs font-semibold">Impossible de charger le flux d'activité</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
            <button
              type="button"
              onClick={fetchRecentEvents}
              className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              <RefreshCw className="h-3 w-3" /> Réessayer
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Aucune activité enregistrée pour le moment.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Les événements s'afficheront en temps réel.</p>
          </div>
        ) : (
          events.map((ev) => {
            const badge = getEventBadge(ev.action_type);
            const IconComp = badge.icon;
            return (
              <div
                key={ev.id}
                className="py-3 px-2 flex items-start gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div
                  className={`h-8 w-8 rounded-lg ${badge.bg} ${badge.text} flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  <IconComp className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {formatActionLabel(ev.action_type, ev.metadata)}
                    </p>
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(ev.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[190px]">
                      {ev.actor_email || 'Système'}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Traçabilité sécurisée • RLS certifié
        </span>
        <button
          type="button"
          onClick={onNavigateAudit}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer"
        >
          <span>Consulter le journal complet</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
