import React from 'react';
import { cn } from '../../lib/utils';
import {
  Home,
  CreditCard,
  GraduationCap,
  CalendarCheck,
  ChevronRight,
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
  const navItems: Array<{
    id: ParentNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'parent_dashboard',
      label: 'Accueil Famille',
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: 'parent_paiements',
      label: 'Frais & Paiements',
      icon: <CreditCard className="h-4 w-4" />,
      badge:
        MOCK_PARENT_ENFANTS_DETAILS[selectedChildId]?.reste_a_payer > 0
          ? 'À régler'
          : undefined,
    },
    {
      id: 'parent_pedagogie',
      label: 'Notes & Bulletins',
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      id: 'parent_assiduite',
      label: 'Assiduité & Absences',
      icon: <CalendarCheck className="h-4 w-4" />,
    },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col w-64 border-r border-slate-200 bg-slate-900 text-slate-300 shrink-0 min-h-screen',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-900/50 shrink-0">
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-white">EcoSurv</span>
            <span className="rounded bg-indigo-950 px-1.5 py-0.2 text-[10px] font-bold text-indigo-400 border border-indigo-800/80">
              Parent
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Espace Famille</span>
        </div>
      </div>

      {/* Switcher d'enfant */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3 text-indigo-400" />
            Mes Enfants ({CURRENT_PARENT.enfants_ids.length})
          </span>
        </div>

        <div className="space-y-1.5">
          {CURRENT_PARENT.enfants_ids.map((enfantId) => {
            const enfant = MOCK_PARENT_ENFANTS_DETAILS[enfantId];
            if (!enfant) return null;
            const isSelected = selectedChildId === enfant.id;

            return (
              <button
                key={enfant.id}
                onClick={() => onSelectChild(enfant.id)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border text-left',
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0',
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    )}
                  >
                    {enfant.photo_initiales}
                  </div>
                  <div className="truncate">
                    <div className="truncate text-slate-100 font-bold">
                      {enfant.prenom}
                    </div>
                    <div className="text-[10px] text-indigo-300/80">{enfant.classe}</div>
                  </div>
                </div>

                {enfant.reste_a_payer > 0 && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Impayé en cours" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Menu Principal
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
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
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
                      ? 'bg-white text-indigo-700'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  )}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="h-4 w-4 text-indigo-200" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Security & RLS Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-slate-200 block">Espace Famille Sécurisé</span>
            <span className="text-slate-400">
              Données strictement isolées à vos enfants légitimes.
            </span>
          </div>
        </div>

        <div className="px-3 py-1 text-[10px] text-slate-500 font-mono text-center">
          EcoSurv Mobile Parent v0.1.0
        </div>
      </div>
    </aside>
  );
};
