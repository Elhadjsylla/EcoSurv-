import React from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutGrid,
  UsersRound,
  CalendarCheck2,
  BookOpenCheck,
  GraduationCap,
  BookMarked,
} from 'lucide-react';
import { CURRENT_ENSEIGNANT } from '../../lib/mockData';
import { Tooltip, TooltipLabel } from '../ui/Tooltip';
import { SidebarShell } from '../ui/SidebarShell';

export type TeacherNavTab =
  | 'teacher_dashboard'
  | 'teacher_classes'
  | 'teacher_absences'
  | 'teacher_grades';

interface TeacherSidebarProps {
  activeTab: TeacherNavTab;
  onTabChange: (tab: TeacherNavTab) => void;
  className?: string;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  const navItems: Array<{
    id: TeacherNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'teacher_dashboard',
      label: 'Tableau de Bord',
      icon: <LayoutGrid className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'teacher_classes',
      label: 'Mes Classes',
      icon: <UsersRound className="h-4 w-4 shrink-0" />,
      badge: `${CURRENT_ENSEIGNANT.classes_assignees.length}`,
    },
    {
      id: 'teacher_absences',
      label: 'Saisie des Absences',
      icon: <CalendarCheck2 className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'teacher_grades',
      label: 'Saisie des Notes',
      icon: <BookOpenCheck className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <SidebarShell
      role="enseignant"
      logoIcon={<GraduationCap className="h-5 w-5 min-h-5 min-w-5 shrink-0" />}
      subtitle="Espace Enseignant"
      className={className}
    >
      {(isCollapsed) => (
        <>
          {/* Teacher Info Card in Sidebar (expanded only) */}
          {!isCollapsed && (
            <div className="p-4 mx-3 mt-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {CURRENT_ENSEIGNANT.prenom[0]}
                  {CURRENT_ENSEIGNANT.nom[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {CURRENT_ENSEIGNANT.prenom} {CURRENT_ENSEIGNANT.nom}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate font-medium">
                    {CURRENT_ENSEIGNANT.matieres[0]}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <BookMarked className="h-3 w-3 text-emerald-600" />
                  Classes :
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {CURRENT_ENSEIGNANT.classes_assignees.join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Espace Pédagogique
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
                        ? 'bg-emerald-600 text-white shadow-xs'
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
                            ? 'bg-white text-emerald-700'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
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
