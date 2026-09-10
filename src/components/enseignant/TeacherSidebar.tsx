import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ShieldCheck,
  BookMarked,
} from 'lucide-react';
import { CURRENT_ENSEIGNANT } from '../../lib/mockData';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: Array<{
    id: TeacherNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'teacher_dashboard',
      label: 'Tableau de Bord',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'teacher_classes',
      label: 'Mes Classes',
      icon: <Users className="h-4 w-4 shrink-0" />,
      badge: `${CURRENT_ENSEIGNANT.classes_assignees.length}`,
    },
    {
      id: 'teacher_absences',
      label: 'Saisie des Absences',
      icon: <CalendarCheck className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'teacher_grades',
      label: 'Saisie des Notes',
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                ecosurv
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Enseignant
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

      {/* Classes Banner Pill */}
      {!isCollapsed && (
        <div className="mx-4 mt-4 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2.5">
          <BookMarked className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-tight overflow-hidden">
            <div className="text-slate-700 dark:text-slate-300 font-bold">Classes Assignées</div>
            <div className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
              {CURRENT_ENSEIGNANT.classes_assignees.join(' • ')}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu Pédagogique
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
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                isCollapsed && 'justify-center px-0'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  'transition-colors',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
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
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
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
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Cloisonnement RLS</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                Données financières restreintes par sécurité.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center" title="RLS Actif">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}
    </aside>
  );
};
