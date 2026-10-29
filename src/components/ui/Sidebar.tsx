import React from 'react';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipLabel } from './Tooltip';
import { SidebarShell } from './SidebarShell';
import {
  LayoutGrid,
  GraduationCap,
  CalendarDays,
  BellRing,
  BarChart3,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

export type NavTab = 'dashboard' | 'eleves' | 'echeances' | 'paiements_attente' | 'relances' | 'rapports' | 'config';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  className?: string;
}

interface NavSection {
  label: string;
  items: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }>;
}

import { useLanguageStore } from '../../i18n/useLanguageStore';
import { translations } from '../../i18n/translations';

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, className }) => {
  const storeT = useLanguageStore((s) => s.t);
  const t = storeT?.nav ? storeT : translations.fr;
  const authProfile = useAuthStore((s) => s.profile);
  const [pendingCount, setPendingCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!authProfile?.ecole_id) return;
    let isSubscribed = true;

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('paiements')
          .select('id', { count: 'exact', head: true })
          .eq('ecole_id', authProfile.ecole_id)
          .eq('statut', 'en_attente');

        if (!error && typeof count === 'number' && isSubscribed) {
          setPendingCount(count);
        }
      } catch {
        // Ignorer en cas d'erreur réseau
      }
    };

    fetchPendingCount();

    const handleCountChanged = () => {
      fetchPendingCount();
    };

    window.addEventListener('ecosurv:pending-payments-changed', handleCountChanged);
    const interval = setInterval(fetchPendingCount, 30000);

    return () => {
      isSubscribed = false;
      window.removeEventListener('ecosurv:pending-payments-changed', handleCountChanged);
      clearInterval(interval);
    };
  }, [authProfile?.ecole_id, activeTab]);

  const sections: NavSection[] = [
    {
      label: 'GÉNÉRAL',
      items: [
        { id: 'dashboard', label: t.nav?.dashboard || 'Tableau de bord', icon: <LayoutGrid className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'ACADÉMIQUE',
      items: [
        { id: 'eleves', label: t.nav?.students || 'Élèves', icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'FINANCES',
      items: [
        { id: 'echeances', label: t.nav?.schedule || 'Échéances', icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
        {
          id: 'paiements_attente',
          label: 'Paiements en attente',
          icon: <Clock className="h-4 w-4 shrink-0" />,
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
        },
        { id: 'relances', label: t.nav?.reminders || 'Relances', icon: <BellRing className="h-4 w-4 shrink-0" /> },
        { id: 'rapports', label: t.nav?.reports || 'Rapports', icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'SYSTÈME',
      items: [
        { id: 'config', label: t.nav?.settings || 'Configuration', icon: <SlidersHorizontal className="h-4 w-4 shrink-0" /> },
      ],
    },
  ];

  return (
    <SidebarShell
      role="directeur"
      logoIcon={<GraduationCap className="h-5 w-5 min-h-5 min-w-5 shrink-0" />}
      className={className}
    >
      {(isCollapsed) => (
        /* Navigation Sections */
        <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                  {section.label}
                </div>
              )}

              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Tooltip
                    key={item.id}
                    content={<TooltipLabel label={item.label} badge={item.badge} />}
                    side="right"
                    disabled={!isCollapsed}
                    className="flex w-full"
                  >
                    <button
                      onClick={() => onTabChange(item.id)}
                      aria-label={isCollapsed ? item.label : undefined}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors group cursor-pointer focus-halo',
                        isActive
                          ? 'bg-primary text-on-primary shadow-xs font-bold'
                          : 'text-secondary hover:text-main hover:bg-surface-subtle',
                        isCollapsed && 'justify-center px-2.5'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            'transition-colors shrink-0',
                            isActive ? 'text-on-primary' : 'text-muted group-hover:text-main'
                          )}
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-bold rounded-sm border',
                            isActive
                              ? 'bg-white/20 text-on-primary border-transparent'
                              : 'bg-danger-surface text-danger-text border-danger-border'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </SidebarShell>
  );
};
