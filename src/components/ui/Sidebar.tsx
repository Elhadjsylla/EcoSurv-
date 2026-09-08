import React from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Send,
  FileText,
  Settings,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'eleves' | 'echeances' | 'relances' | 'rapports' | 'config';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, className }) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'eleves', label: 'Gestion des Élèves', icon: <Users className="h-4 w-4" /> },
    { id: 'echeances', label: 'Échéances & Tarifs', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'relances', label: 'Relances Impayés', icon: <Send className="h-4 w-4" />, badge: '2' },
    { id: 'rapports', label: 'Rapports Financiers', icon: <FileText className="h-4 w-4" /> },
    { id: 'config', label: 'Configuration', icon: <Settings className="h-4 w-4" /> },
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-900/50 shrink-0">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-white">EcoSurv</span>
            <span className="rounded bg-blue-900/80 px-1 py-0.2 text-[10px] font-semibold text-blue-300 border border-blue-700/50">
              SaaS
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Gestion de Scolarité</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Menu Directeur
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
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
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
                    isActive ? 'bg-white text-blue-700' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  )}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="h-4 w-4 text-blue-200" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Footer Security Badge */}
      <div className="p-4 m-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Isolation RLS Conforme</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Données strictement filtrées sur l'établissement actif.
        </p>
      </div>
    </aside>
  );
};
