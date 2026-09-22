import React from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutGrid,
  WalletCards,
  GraduationCap,
  CalendarDays,
  Users,
  HeartHandshake,
} from 'lucide-react';
import { CURRENT_PARENT, MOCK_PARENT_ENFANTS_DETAILS } from '../../lib/mockData';
import { useAuthStore } from '../../store/useAuthStore';
import { Tooltip, TooltipLabel } from '../ui/Tooltip';
import { SidebarShell } from '../ui/SidebarShell';

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
  const authProfile = useAuthStore((s) => s.profile);
  const isReal = Boolean(authProfile?.ecole_id);
  const enfantsIds = isReal ? [] : CURRENT_PARENT.enfants_ids;

  const navItems: Array<{
    id: ParentNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'parent_dashboard',
      label: 'Accueil Famille',
      icon: <LayoutGrid className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'parent_paiements',
      label: 'Frais & Paiements',
      icon: <WalletCards className="h-4 w-4 shrink-0" />,
      badge:
        !isReal && MOCK_PARENT_ENFANTS_DETAILS[selectedChildId]?.reste_a_payer > 0
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
      icon: <CalendarDays className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <SidebarShell
      role="parent"
      logoIcon={<HeartHandshake className="h-5 w-5 min-h-5 min-w-5 shrink-0" />}
      subtitle="Espace Famille"
      className={className}
    >
      {(isCollapsed) => (
        <>
          {/* Parent & Children Selector (expanded only) */}
          {!isCollapsed && (
            <div className="p-3 mx-3 mt-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-2">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Enfants scolarisés ({enfantsIds.length})</span>
                </div>
              </div>

              {enfantsIds.length === 0 ? (
                <div className="p-2 text-center text-[11px] text-slate-400">
                  Aucun élève rattaché
                </div>
              ) : (
                <div className="space-y-1">
                  {enfantsIds.map((id) => {
                    const enf = MOCK_PARENT_ENFANTS_DETAILS[id];
                    if (!enf) return null;
                    const isChildSelected = selectedChildId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => onSelectChild(id)}
                        className={cn(
                          'w-full text-left p-2 rounded-lg transition-all flex items-center justify-between',
                          isChildSelected
                            ? 'bg-purple-600 text-white shadow-xs font-semibold'
                            : 'hover:bg-purple-100/60 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="text-xs truncate font-bold">
                            {enf.prenom} {enf.nom}
                          </div>
                          <div
                            className={cn(
                              'text-[10px] truncate',
                              isChildSelected
                                ? 'text-purple-100'
                                : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {enf.classe}
                          </div>
                        </div>

                        {enf.reste_a_payer > 0 ? (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0',
                              isChildSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                            )}
                          >
                            Solde
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0',
                              isChildSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            )}
                          >
                            À jour
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation items */}
          <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Espace Parent
              </div>
            )}

            {navItems.map((item) => {
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
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
                      isCollapsed && 'justify-center px-2.5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          'transition-colors shrink-0',
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
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
                            ? 'bg-white text-purple-700'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
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
        </>
      )}
    </SidebarShell>
  );
};
