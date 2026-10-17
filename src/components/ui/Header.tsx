import React, { useState, useRef, useEffect } from 'react';
// Rôles et profils réels Supabase
import { useEcoleStore } from '../../store/useEcoleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StudentInitials } from './StudentInitials';
import { Select } from './Select';
import { UserProfileDropdown } from './UserProfileDropdown';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { NavigationControls } from './NavigationControls';
import { Tooltip } from './Tooltip';
import {
  Building2,
  Calendar,
  Bell,
  UserCheck,
  GraduationCap,
  CreditCard,
  HeartHandshake,
  Search,
  ChevronDown,
  Globe,
  Menu,
} from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { LanguageSelector } from './LanguageSelector';
import { useLanguageStore } from '../../i18n/useLanguageStore';
import { isRoleSimulatorAllowed } from '../../config/features';
import type { UserRole, PortalRole } from '../../store/useAuthStore';

export type { UserRole, PortalRole };

interface HeaderProps {
  currentRole?: PortalRole;
  onRoleChange?: (role: PortalRole) => void;
  className?: string;
  onNavigateTab?: (tab: string) => void;
  onReturnToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'directeur',
  onRoleChange,
  onNavigateTab,
  onReturnToLanding,
}) => {
  const t = useLanguageStore((s) => s.t);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toggleMobileMenu = useNavigationStore((s) => s.toggleMobileMenu);
  const userRole = useNavigationStore((s) => s.userRole);

  const unreadCount = useNotificationsStore((s) => s.unreadCount());
  const loadNotificationsForUser = useNotificationsStore((s) => s.loadForUser);

  // Écoute du raccourci clavier "/" pour la recherche globale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const rolesConfig: Record<
    PortalRole,
    {
      label: string;
      roleTitle: string;
      icon: React.ReactNode;
      colorTheme: string;
      badgeColor: string;
      badgeText: string;
      badgeScope: string;
      user: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        telephone?: string | null;
        role: string;
      };
    }
  > = {
    directeur: {
      label: t.common.director,
      roleTitle: t.common.director,
      icon: <UserCheck className="h-4 w-4 text-primary" />,
      colorTheme: 'text-primary bg-surface-subtle border-subtle',
      badgeColor: 'bg-surface-subtle text-primary border-subtle',
      badgeText: 'Portail Direction',
      badgeScope: 'Accès complet école, élèves & trésorerie',
      user: { id: '', nom: 'Direction', prenom: 'Établissement', email: '', role: 'directeur' },
    },
    enseignant: {
      label: t.common.teacher,
      roleTitle: t.common.teacher,
      icon: <GraduationCap className="h-4 w-4 text-primary" />,
      colorTheme: 'text-primary bg-surface-subtle border-subtle',
      badgeColor: 'bg-surface-subtle text-primary border-subtle',
      badgeText: 'Espace Enseignant',
      badgeScope: 'Restreint aux classes assignées (zéro données financières)',
      user: { id: '', nom: 'Enseignant', prenom: '', email: '', role: 'enseignant' },
    },
    caissier: {
      label: t.common.cashier,
      roleTitle: t.common.cashier,
      icon: <CreditCard className="h-4 w-4 text-primary" />,
      colorTheme: 'text-primary bg-surface-subtle border-subtle',
      badgeColor: 'bg-surface-subtle text-primary border-subtle',
      badgeText: 'Guichet Caisse',
      badgeScope: 'Encaissement & quittances (zéro données pédagogiques)',
      user: { id: '', nom: 'Guichetier', prenom: 'Caisse', email: '', role: 'caissier' },
    },
    parent: {
      label: t.common.parent,
      roleTitle: t.common.parent,
      icon: <HeartHandshake className="h-4 w-4 text-primary" />,
      colorTheme: 'text-primary bg-surface-subtle border-subtle',
      badgeColor: 'bg-surface-subtle text-primary border-subtle',
      badgeText: 'Espace Parent',
      badgeScope: 'Restreint strictement aux enfants de la famille',
      user: { id: '', nom: 'Tuteur', prenom: 'Parent', email: '', role: 'parent' },
    },
  };

  const portalKey = (currentRole && currentRole in rolesConfig) ? (currentRole as PortalRole) : 'directeur';
  const currentConfig = rolesConfig[portalKey];
  const authProfile = useAuthStore((s) => s.profile);
  const authEcole = useAuthStore((s) => s.ecole);
  const storeEcole = useEcoleStore((s) => s.ecole);

  // Détection du mode simulation : interdit par défaut pour un compte réel en production
  const isRealAccount = Boolean(authProfile?.ecole_id && authProfile.ecole_id !== 'ecole-demo');
  const showRoleSimulator = isRoleSimulatorAllowed(isRealAccount);

  const ecole = {
    ...storeEcole,
    nom: authEcole?.nom || storeEcole.nom,
    ville: authEcole?.ville || storeEcole.ville,
    code_ecole: authEcole?.nom ? authEcole.nom.slice(0, 4).toUpperCase() : storeEcole.code_ecole,
  };

  const defaultUser = currentConfig?.user || { id: '', nom: 'Direction', prenom: '', email: '', telephone: '', role: 'directeur' };

  // Utilisateur réel prioritaire sur le mock
  const activeUser = authProfile
    ? {
        ...defaultUser,
        id: authProfile.id,
        nom: authProfile.nom,
        prenom: authProfile.prenom,
        email: authProfile.email || defaultUser.email,
        telephone: authProfile.telephone || defaultUser.telephone,
      }
    : defaultUser;

  useEffect(() => {
    loadNotificationsForUser(activeUser.id || 'usr-default', currentRole);
  }, [currentRole, loadNotificationsForUser, activeUser.id]);

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-subtle bg-surface/95 backdrop-blur-xs px-3.5 sm:px-5 lg:px-6 flex items-center justify-between gap-3 sm:gap-4 shadow-xs transition-colors duration-150">
      {/* Left: School Information & Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-4 min-w-0 flex-1 max-w-xl xl:max-w-2xl">
        {/* Mobile menu trigger button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-sm border border-subtle text-secondary hover:bg-surface-subtle hover:text-main transition-colors shrink-0 focus-halo cursor-pointer"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Back / Forward navigation (hidden on mobile, visible from sm:) */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
          <NavigationControls role={currentRole} />
          <div className="h-5 w-px bg-subtle" />
        </div>

        {/* School identity badge with fluid truncation and tooltip */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-sm border shrink-0 ${currentConfig.colorTheme}`}
          >
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 hidden md:block max-w-[130px] lg:max-w-[170px] xl:max-w-[210px] 2xl:max-w-[260px]">
            <Tooltip content={ecole.nom} side="bottom" as="div" className="block min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-main leading-tight truncate">
                {ecole.nom}
              </h2>
            </Tooltip>
            <p className="text-xs text-muted flex items-center gap-1 font-medium truncate mt-0.5">
              <span className="truncate">{ecole.ville}</span>
              <span className="shrink-0">•</span>
              <span className="font-semibold text-secondary tabular-nums shrink-0">
                {ecole.code_ecole}
              </span>
            </p>
          </div>
        </div>

        {/* Global Search Bar with fixed minimum width & responsive max-width */}
        <div className="relative flex-1 min-w-[130px] max-w-[180px] xl:max-w-[240px] 2xl:max-w-xs hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="w-full h-9 pl-8.5 pr-7 rounded-sm border border-default text-xs bg-surface-input text-main placeholder:text-muted focus-halo transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 text-xs font-mono font-semibold text-muted bg-surface-subtle border border-subtle rounded-sm shadow-xs pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Role Switcher, Notifications & User Avatar with Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0 relative">
        {/* Return to Landing / Vitrine button */}
        {onReturnToLanding && (
          <Tooltip content="Retourner à la page vitrine" side="bottom">
            <button
              type="button"
              onClick={onReturnToLanding}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-sm border border-default text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-subtle transition-colors shrink-0 shadow-xs focus-halo cursor-pointer"
            >
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span className="hidden xl:inline">{t.common.viewSite}</span>
            </button>
          </Tooltip>
        )}

        {/* Academic Year pill (desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 h-9 rounded-sm bg-surface-subtle px-2.5 text-xs font-medium text-secondary border border-subtle shrink-0 tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted shrink-0" />
          <span>{ecole.annee_scolaire}</span>
        </div>

        {/* Sélecteur de langue (FR / AR / EN) */}
        <LanguageSelector />

        {/* Role Selector (clean & discrete) - Jamais visible par défaut pour un compte réel en production */}
        {showRoleSimulator && onRoleChange && userRole === 'directeur' && (
          <div className="flex items-center gap-1.5">
            <span className="hidden 2xl:inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-bold bg-warning-surface text-warning-text border border-warning-border">
              Simulation
            </span>
            <Select<PortalRole>
              value={currentRole}
              onChange={onRoleChange}
              prefix={`${t.common.viewAs} :`}
              size="sm"
              variant="subtle"
              align="right"
              className="shrink-0"
              menuClassName="w-56"
              options={(Object.keys(rolesConfig) as PortalRole[]).map((role) => ({
                value: role,
                label: rolesConfig[role].label,
                icon: rolesConfig[role].icon,
                description: rolesConfig[role].roleTitle,
              }))}
            />
          </div>
        )}

        {/* Notifications Icon Button with Dropdown */}
        <div className="relative shrink-0">
          <Tooltip content="Notifications" side="bottom">
            <button
              type="button"
              className={`relative flex h-9 w-9 items-center justify-center transition-colors rounded-sm focus-halo cursor-pointer ${
                isNotificationsOpen
                  ? 'bg-surface-subtle text-primary border border-subtle'
                  : 'text-secondary hover:text-main hover:bg-surface-subtle'
              }`}
              aria-label="Notifications"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-danger px-1 text-xs font-bold text-on-primary ring-2 ring-surface tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </Tooltip>

          <NotificationsDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNavigateTab={onNavigateTab}
          />
        </div>

        <div className="h-5 w-px bg-subtle hidden sm:block" />

        {/* User Info with Avatar Trigger for UserProfileDropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 sm:gap-2 h-9 p-1 pl-1.5 rounded-sm hover:bg-surface-subtle transition-colors focus-halo cursor-pointer"
          >
            <StudentInitials
              nom={activeUser.nom}
              prenom={activeUser.prenom}
              size="sm"
            />
            <div className="hidden lg:flex flex-col text-left min-w-0 max-w-[90px] xl:max-w-[120px]">
              <Tooltip content={`${activeUser.prenom} ${activeUser.nom}`} side="bottom" className="flex min-w-0">
                <span className="text-xs font-bold text-main leading-tight truncate">
                  {activeUser.prenom}
                </span>
              </Tooltip>
              <Tooltip content={currentConfig.roleTitle} side="bottom" className="flex min-w-0">
                <span className="text-xs font-medium text-muted truncate">
                  {currentConfig.label}
                </span>
              </Tooltip>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Profile Panel */}
          <UserProfileDropdown
            user={activeUser}
            roleTitle={currentConfig.roleTitle}
            roleBadge={currentConfig.label}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>
    </header>
  );
};
