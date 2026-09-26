import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ScrollText,
  LogOut,
  ShieldCheck,
  School,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { supabase } from '../../lib/supabase';

export type AdminTab = 'dashboard' | 'ecoles' | 'utilisateurs' | 'abonnements' | 'audit';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onReturnToLanding?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  onReturnToLanding,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    useAuthStore.getState().logout();
    useNavigationStore.getState().reset();
    useNavigationStore.getState().setViewMode('landing');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { id: 'ecoles', label: 'Écoles', icon: <Building2 className="h-4.5 w-4.5" /> },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: <Users className="h-4.5 w-4.5" /> },
    { id: 'abonnements', label: 'Abonnements', icon: <CreditCard className="h-4.5 w-4.5" /> },
    { id: 'audit', label: 'Audit Logs', icon: <ScrollText className="h-4.5 w-4.5" /> },
  ];

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 shrink-0 selection:bg-emerald-500 selection:text-white">
      {/* Top section */}
      <div className="space-y-6">
        {/* Brand header style Sama Boutik */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <School className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              EcoSurv
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3" />
              <span>Super Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-600 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Admin User & Logout */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Profile Card */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
            {profile?.prenom?.charAt(0) || 'E'}{profile?.nom?.charAt(0) || 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {profile ? `${profile.prenom} ${profile.nom}` : 'Elhadj Sylla'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user?.email || profile?.email || 'admin@ecosurv.mr'}
            </div>
          </div>
        </div>

        {/* Return to landing button */}
        {onReturnToLanding && (
          <button
            type="button"
            onClick={onReturnToLanding}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Voir site vitrine</span>
          </button>
        )}

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
};
