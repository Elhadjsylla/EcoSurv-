import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserRole } from './Header';
import { Tooltip } from './Tooltip';
import { useNavigationStore } from '../../store/useNavigationStore';

// Couleurs d'accent du portail : pastille du logo, sous-titre, bouton Replier / Déplier.
const accent: Record<UserRole, { logo: string; subtitle: string; toggle: string }> = {
  directeur: {
    logo: 'bg-blue-600 shadow-blue-600/20',
    subtitle: 'text-blue-600 dark:text-blue-400',
    toggle:
      'hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 dark:hover:text-blue-300 dark:hover:bg-blue-950/60 dark:hover:border-blue-800 focus-visible:ring-blue-500/40',
  },
  enseignant: {
    logo: 'bg-emerald-600 shadow-emerald-600/20',
    subtitle: 'text-emerald-600 dark:text-emerald-400',
    toggle:
      'hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/60 dark:hover:border-emerald-800 focus-visible:ring-emerald-500/40',
  },
  caissier: {
    logo: 'bg-amber-600 shadow-amber-600/20',
    subtitle: 'text-amber-600 dark:text-amber-400',
    toggle:
      'hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 dark:hover:text-amber-300 dark:hover:bg-amber-950/60 dark:hover:border-amber-800 focus-visible:ring-amber-500/40',
  },
  parent: {
    logo: 'bg-purple-600 shadow-purple-600/20',
    subtitle: 'text-purple-600 dark:text-purple-400',
    toggle:
      'hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200 dark:hover:text-purple-300 dark:hover:bg-purple-950/60 dark:hover:border-purple-800 focus-visible:ring-purple-500/40',
  },
};

interface SidebarShellProps {
  role: UserRole;
  logoIcon: React.ReactNode;
  subtitle?: string;
  className?: string;
  children: (isCollapsed: boolean) => React.ReactNode;
}

/**
 * Cadre commun aux sidebars des 4 portails.
 * - Sur mobile (< md) : la sidebar permanente est masquée pour libérer 100% de la largeur,
 *   et s'ouvre sous forme de tiroir (drawer) coulissant avec fond flouté.
 * - Sur desktop (>= md) : sidebar permanente repliable / dépliable.
 */
export const SidebarShell: React.FC<SidebarShellProps> = ({ role, logoIcon, subtitle, className, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const colors = accent[role];
  const toggleLabel = isCollapsed ? 'Déplier' : 'Replier';
  const isMobileMenuOpen = useNavigationStore((s) => s.isMobileMenuOpen);
  const setMobileMenuOpen = useNavigationStore((s) => s.setMobileMenuOpen);

  return (
    <>
      {/* Fond sombre transparent pour le tiroir mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Tiroir Mobile (Drawer) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xl transition-transform duration-300 md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        {/* En-tête mobile avec bouton fermer */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md',
                colors.logo
              )}
            >
              {logoIcon}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-lg font-black leading-none tracking-tight text-slate-900 dark:text-white">
                EcoSurv
              </span>
              {subtitle && (
                <span className={cn('mt-1 truncate text-[10px] font-bold uppercase tracking-wider', colors.subtitle)}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenu de navigation toujours complet dans le tiroir mobile */}
        <div className="flex-1 overflow-y-auto">
          {children(false)}
        </div>
      </div>

      {/* Sidebar Permanente Desktop (masquée sur mobile < md) */}
      <aside
        className={cn(
          'relative z-20 hidden md:flex h-screen shrink-0 flex-col select-none border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex shrink-0 border-b border-slate-100 dark:border-slate-800 px-5',
            isCollapsed ? 'flex-col items-start gap-2 py-3' : 'h-16 items-center gap-3'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md',
              colors.logo
            )}
          >
            {logoIcon}
          </div>

          {!isCollapsed &&
            (subtitle ? (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-lg font-black leading-none tracking-tight text-slate-900 dark:text-white">
                  EcoSurv
                </span>
                <span className={cn('mt-1 truncate text-[10px] font-bold uppercase tracking-wider', colors.subtitle)}>
                  {subtitle}
                </span>
              </div>
            ) : (
              <span className="min-w-0 flex-1 truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">
                EcoSurv
              </span>
            ))}

          <Tooltip content={toggleLabel} side="right" className="shrink-0">
            <button
              type="button"
              onClick={() => setIsCollapsed((collapsed) => !collapsed)}
              aria-label={toggleLabel}
              aria-expanded={!isCollapsed}
              className={cn(
                'flex h-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2',
                isCollapsed ? 'w-10' : 'w-8',
                colors.toggle
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronLeft className="h-4 w-4 shrink-0" />
              )}
            </button>
          </Tooltip>
        </div>

        {children(isCollapsed)}
      </aside>
    </>
  );
};
