import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ScrollText,
  LogOut,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { supabase } from '../../lib/supabase';
import { Logo } from '../ui/Logo';
import { ADMIN_EASE, FOCUS_RING } from './adminUi';

export type AdminTab = 'dashboard' | 'ecoles' | 'utilisateurs' | 'abonnements' | 'audit';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onReturnToLanding?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  onReturnToLanding,
  isOpen = false,
  onClose,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const reduce = Boolean(useReducedMotion());

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
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
    { id: 'ecoles', label: 'Écoles', icon: <Building2 className="h-[18px] w-[18px]" /> },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: <Users className="h-[18px] w-[18px]" /> },
    { id: 'abonnements', label: 'Abonnements', icon: <CreditCard className="h-[18px] w-[18px]" /> },
    { id: 'audit', label: "Journal d'audit", icon: <ScrollText className="h-[18px] w-[18px]" /> },
  ];

  const handleSelectTab = (tab: AdminTab) => {
    onTabChange(tab);
    if (onClose) onClose();
  };

  // `pillId` distingue la barre fixe de bureau et le tiroir mobile : deux pastilles
  // glissantes ne doivent jamais partager le même identifiant.
  const renderSidebar = (pillId: string) => (
    <div className="flex flex-col justify-between h-full p-4 selection:bg-[#1D4ED8] selection:text-white">
      <div className="space-y-7">
        {/* Marque */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: ADMIN_EASE }}
          className="flex items-center justify-between px-2 pt-2"
        >
          <div className="flex flex-col gap-1.5">
            <Logo variant={theme === 'dark' ? 'inverse' : 'couleur'} height={26} />
            <div className="flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-blue-300">
              <ShieldCheck className="h-3 w-3" />
              <span>Super administrateur</span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${FOCUS_RING}`}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </motion.div>

        {/* Navigation : la pastille bleue glisse vers l'onglet choisi */}
        <nav className="space-y-1" aria-label="Navigation de la console">
          {navItems.map((item, i) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                data-testid={`admin-nav-${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleSelectTab(item.id)}
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + i * 0.05, ease: ADMIN_EASE }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer text-left transition-colors ${FOCUS_RING} ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={pillId}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-[#1D4ED8]"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Compte connecté et sorties */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
            {profile?.prenom?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
            {profile?.nom?.charAt(0) || 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {profile ? `${profile.prenom} ${profile.nom}` : user?.email || 'Super administrateur'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user?.email || profile?.email || ''}
            </div>
          </div>
        </div>

        {onReturnToLanding && (
          <button
            type="button"
            onClick={onReturnToLanding}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer ${FOCUS_RING}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Voir le site</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${FOCUS_RING}`}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Barre latérale de bureau */}
      <aside className="hidden md:flex w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
        {renderSidebar('admin-nav-pill-desktop')}
      </aside>

      {/* Fond du tiroir mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Tiroir mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderSidebar('admin-nav-pill-mobile')}
      </aside>
    </>
  );
};
