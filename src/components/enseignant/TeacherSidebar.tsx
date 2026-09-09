import React from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  GraduationCap,
  ChevronRight,
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
  const navItems: Array<{
    id: TeacherNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'teacher_dashboard',
      label: 'Tableau de Bord',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'teacher_classes',
      label: 'Mes Classes',
      icon: <Users className="h-4 w-4" />,
      badge: `${CURRENT_ENSEIGNANT.classes_assignees.length}`,
    },
    {
      id: 'teacher_absences',
      label: 'Saisie des Absences',
      icon: <CalendarCheck className="h-4 w-4" />,
    },
    {
      id: 'teacher_grades',
      label: 'Saisie des Notes',
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col w-64 border-r border-slate-200 bg-slate-900 text-slate-300 shrink-0 h-screen overflow-y-auto',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-900/50 shrink-0">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-white">EcoSurv</span>
            <span className="rounded bg-emerald-950 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-800/80">
              Enseignant
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Espace Pédagogique</span>
        </div>
      </div>

      {/* Classes Banner Pill */}
      <div className="mx-3 mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
        <BookMarked className="h-4 w-4 text-emerald-400 shrink-0" />
        <div className="text-[11px] leading-tight overflow-hidden">
          <div className="text-slate-300 font-bold">Classes Assignées</div>
          <div className="text-emerald-400 font-semibold truncate">
            {CURRENT_ENSEIGNANT.classes_assignees.join(' • ')}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Menu Pédagogique
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full',
                    isActive
                      ? 'bg-white text-emerald-700'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  )}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="h-4 w-4 text-emerald-200" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Security & RLS Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-slate-200 block">Cloisonnement RLS</span>
            <span className="text-slate-400">
              Données financières inaccessibles conformément aux règles de sécurité.
            </span>
          </div>
        </div>

        <div className="px-3 py-1 text-[10px] text-slate-500 font-mono text-center">
          EcoSurv SaaS v0.1.0 • Pédagogique
        </div>
      </div>
    </aside>
  );
};
