import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
import { supabase } from '../../lib/supabase';
import { ADMIN_EASE, AdminCard, CardTitle, FOCUS_RING, Skeleton } from './adminUi';

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
  const reduce = Boolean(useReducedMotion());

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

  // Une seule teinte (le bleu de la marque) : le type d'action se lit par l'icône et le libellé.
  const getEventBadge = (actionType: string) => {
    if (actionType.startsWith('auth.')) return { label: 'Authentification', icon: KeyRound };
    if (actionType.startsWith('school.')) return { label: 'Établissement', icon: Building2 };
    if (actionType.startsWith('user.')) return { label: 'Utilisateur', icon: UserCheck };
    return { label: 'Système', icon: ShieldCheck };
  };

  const formatActionLabel = (actionType: string, metadata?: Record<string, any> | null) => {
    switch (actionType) {
      case 'auth.login_success':
        return 'Connexion réussie';
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
    <AdminCard testId="audit-feed-card" className="flex flex-col">
      <CardTitle
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Dernières actions"
        subtitle="Les six derniers événements du journal d'audit"
        right={
          <button
            type="button"
            onClick={fetchRecentEvents}
            disabled={isLoading}
            className={`shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60 cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-200 ${FOCUS_RING}`}
            title="Actualiser"
            aria-label="Actualiser les dernières actions"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'motion-safe:animate-spin text-[#1D4ED8]' : ''}`} />
          </button>
        }
      />

      <div className="flex-1 min-h-[200px]">
        {isLoading ? (
          <ul className="space-y-4" aria-label="Chargement">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="mb-1.5 h-6 w-6 text-rose-500" />
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Impossible de charger les dernières actions
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchRecentEvents}
              className={`mt-3 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40 ${FOCUS_RING}`}
            >
              <RefreshCw className="h-3 w-3" /> Réessayer
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-slate-400">
            <Clock className="mb-1.5 h-6 w-6 opacity-40" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Aucune activité enregistrée pour le moment.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {events.map((ev, i) => {
              const badge = getEventBadge(ev.action_type);
              const IconComp = badge.icon;
              return (
                <motion.li
                  key={ev.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: ADMIN_EASE }}
                  className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300">
                    <IconComp className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatActionLabel(ev.action_type, ev.metadata)}
                      </p>
                      <span className="whitespace-nowrap text-[11px] font-medium text-slate-400">
                        {formatRelativeTime(ev.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="max-w-[190px] truncate font-mono text-slate-600 dark:text-slate-300">
                        {ev.actor_email || 'Système'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onNavigateAudit}
          className={`inline-flex items-center gap-1.5 rounded text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer dark:text-blue-300 ${FOCUS_RING}`}
        >
          <span>Consulter le journal complet</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </AdminCard>
  );
};
