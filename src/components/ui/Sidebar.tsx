import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutGrid,
  GraduationCap,
  CalendarDays,
  BellRing,
  BarChart3,
  SlidersHorizontal,
  ChevronLeft,
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections: NavSection[] = [
    {
      label: 'GÉNÉRAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'ACADÉMIQUE',
      items: [
        { id: 'eleves', label: 'Gestion Élèves', icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'FINANCES',
      items: [
        { id: 'echeances', label: 'Échéances & Tarifs', icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
        { id: 'relances', label: 'Relances Impayés', icon: <BellRing className="h-4 w-4 shrink-0" />, badge: '5' },
        { id: 'rapports', label: 'Rapports Financiers', icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      label: 'SYSTÈME',
      items: [
        { id: 'config', label: 'Configuration', icon: <SlidersHorizontal className="h-4 w-4 shrink-0" /> },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none shrink-0 z-20',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand Header (Minimalist Nexoov style) */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              EcoSurv
            </span>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={isCollapsed ? 'Déplier' : 'Replier'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', isCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation Sections */}
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
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
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
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};
