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
} from 'lucide-react';

export type NavTab = 'dashboard' | 'eleves' | 'echeances' | 'relances' | 'rapports' | 'config';

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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, className }) => {
  const t = useLanguageStore((s) => s.t);
  const sections: NavSection[] = [
    {
      label: 'GÉNÉRAL',
      items: [
        { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutGrid className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'ACADÉMIQUE',
      items: [
        { id: 'eleves', label: t.nav.students, icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'FINANCES',
      items: [
        { id: 'echeances', label: t.nav.schedule, icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
        { id: 'relances', label: t.nav.reminders, icon: <BellRing className="h-4 w-4 shrink-0" /> },
        { id: 'rapports', label: t.nav.reports, icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'SYSTÈME',
      items: [
        { id: 'config', label: t.nav.settings, icon: <SlidersHorizontal className="h-4 w-4 shrink-0" /> },
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
        <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                        'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
                        isCollapsed && 'justify-center px-2.5'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            'transition-colors shrink-0',
                            isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                          )}
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded-full',
                            isActive
                              ? 'bg-white text-blue-700'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400'
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
