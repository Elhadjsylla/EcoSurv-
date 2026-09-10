import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  Home,
  CreditCard,
  GraduationCap,
  CalendarCheck,
  ChevronLeft,
  ShieldCheck,
  Users,
  HeartHandshake,
} from 'lucide-react';
import { CURRENT_PARENT, MOCK_PARENT_ENFANTS_DETAILS } from '../../lib/mockData';

export type ParentNavTab =
  | 'parent_dashboard'
  | 'parent_paiements'
  | 'parent_pedagogie'
  | 'parent_assiduite';

interface ParentSidebarProps {
  activeTab: ParentNavTab;
  onTabChange: (tab: ParentNavTab) => void;
  selectedChildId: string;
  onSelectChild: (id: string) => void;
  className?: string;
}

export const ParentSidebar: React.FC<ParentSidebarProps> = ({
  activeTab,
  onTabChange,
  selectedChildId,
  onSelectChild,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: Array<{
    id: ParentNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'parent_dashboard',
      label: 'Accueil Famille',
      icon: <Home className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'parent_paiements',
      label: 'Frais & Paiements',
      icon: <CreditCard className="h-4 w-4 shrink-0" />,
      badge:
        MOCK_PARENT_ENFANTS_DETAILS[selectedChildId]?.reste_a_payer > 0
          ? 'À régler'
          : undefined,
    },
    {
      id: 'parent_pedagogie',
      label: 'Notes & Bulletins',
      icon: <GraduationCap className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'parent_assiduite',
      label: 'Assiduité & Absences',
      icon: <CalendarCheck className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shrink-0 h-screen transition-all duration-200 z-20',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand Header (Minimalist Nexoov style) */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 shrink-0">
            <HeartHandshake className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                ecosurv
              </span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Parent
              </span>
            </div>
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

      {/* Switcher d'enfant */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mt-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              Mes Enfants ({CURRENT_PARENT.enfants_ids.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {CURRENT_PARENT.enfants_ids.map((id) => {
              const item = MOCK_PARENT_ENFANTS_DETAILS[id];
              const isSelected = selectedChildId === id;
              if (!item) return null;

              return (
                <button
                  key={id}
                  onClick={() => onSelectChild(id)}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border text-xs',
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800 shadow-xs ring-1 ring-purple-500/20'
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      )}
                    >
                      {item.prenom.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item.prenom}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.classe}
                      </div>
                    </div>
                  </div>

                  {item.reste_a_payer > 0 ? (
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Impayé en cours" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="À jour" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Espace Suivi
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                isActive
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                isCollapsed && 'justify-center px-0'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  'transition-colors',
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              >
                {item.icon}
              </span>

              {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

              {!isCollapsed && item.badge && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-bold rounded-full',
                    isActive
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Security & RLS Footer */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Cloisonnement RLS</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                Restreint aux enfants de la famille.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center" title="RLS Famille Actif">
          <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
      )}
    </aside>
  );
};
