import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserRole } from './Header';
import { Tooltip } from './Tooltip';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Logo, LogoIcone } from './Logo';

// Couleurs d'accent unifiées sur le design system EcoSurv (Palette A)
const accent: Record<UserRole, { logo: string; subtitle: string; toggle: string }> = {
  directeur: {
    logo: 'bg-primary text-on-primary shadow-xs',
    subtitle: 'text-primary',
    toggle: 'hover:text-primary hover:bg-surface-subtle hover:border-default focus-halo',
  },
  enseignant: {
    logo: 'bg-primary text-on-primary shadow-xs',
    subtitle: 'text-primary',
    toggle: 'hover:text-primary hover:bg-surface-subtle hover:border-default focus-halo',
  },
  caissier: {
    logo: 'bg-primary text-on-primary shadow-xs',
    subtitle: 'text-primary',
    toggle: 'hover:text-primary hover:bg-surface-subtle hover:border-default focus-halo',
  },
  parent: {
    logo: 'bg-primary text-on-primary shadow-xs',
    subtitle: 'text-primary',
    toggle: 'hover:text-primary hover:bg-surface-subtle hover:border-default focus-halo',
  },
  super_admin: {
    logo: 'bg-primary text-on-primary shadow-xs',
    subtitle: 'text-primary',
    toggle: 'hover:text-primary hover:bg-surface-subtle hover:border-default focus-halo',
  },
};

interface SidebarShellProps {
  role: UserRole;
  logoIcon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  children: (isCollapsed: boolean) => React.ReactNode;
}

/**
 * Cadre commun aux sidebars des 4 portails, conforme aux tokens EcoSurv :
 * - Sur mobile (< md) : la sidebar permanente est masquée pour libérer 100% de la largeur,
 *   et s'ouvre sous forme de tiroir (drawer) coulissant avec fond flouté.
 * - Sur desktop (>= md) : sidebar permanente repliable / dépliable.
 */
export const SidebarShell: React.FC<SidebarShellProps> = ({ role, subtitle, className, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const colors = accent[role];
  const toggleLabel = isCollapsed ? 'Déplier' : 'Replier';
  const isMobileMenuOpen = useNavigationStore((s) => s.isMobileMenuOpen);
  const setMobileMenuOpen = useNavigationStore((s) => s.setMobileMenuOpen);
  const theme = useThemeStore((s) => s.theme);
  const logoVariant = theme === 'dark' ? 'inverse' : 'couleur';

  return (
    <>
      {/* Fond sombre transparent pour le tiroir mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-page-bg/80 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Tiroir Mobile (Drawer) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-subtle bg-surface text-secondary shadow-elevated transition-transform duration-300 md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        {/* En-tête mobile avec bouton fermer */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-subtle px-5">
          <div className="flex min-w-0 flex-1 flex-col">
            <Logo variant={logoVariant} height={26} />
            {subtitle && (
              <span className={cn('mt-1 truncate text-xs font-bold uppercase tracking-wider', colors.subtitle)}>
                {subtitle}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-subtle text-muted hover:text-main hover:bg-surface-subtle transition-colors focus-halo cursor-pointer"
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
          'relative z-20 hidden md:flex h-screen shrink-0 flex-col select-none border-r border-subtle bg-surface text-secondary transition-all duration-200',
          isCollapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex shrink-0 border-b border-subtle px-5',
            isCollapsed ? 'flex-col items-center gap-2 py-3' : 'h-16 items-center justify-between gap-3'
          )}
        >
          {isCollapsed ? (
            <LogoIcone size={36} />
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              <Logo variant={logoVariant} height={26} />
              {subtitle && (
                <span className={cn('mt-1 truncate text-xs font-bold uppercase tracking-wider', colors.subtitle)}>
                  {subtitle}
                </span>
              )}
            </div>
          )}

          <Tooltip content={toggleLabel} side="right" className="shrink-0">
            <button
              type="button"
              onClick={() => setIsCollapsed((collapsed) => !collapsed)}
              aria-label={toggleLabel}
              aria-expanded={!isCollapsed}
              className={cn(
                'flex h-8 cursor-pointer items-center justify-center rounded-sm border border-subtle bg-surface text-muted transition-colors focus-halo',
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
