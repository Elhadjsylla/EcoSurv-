import React, { useState, useRef, useEffect } from 'react';
import {
  CURRENT_DIRECTEUR,
  CURRENT_ENSEIGNANT,
  CURRENT_CAISSIER,
  CURRENT_PARENT,
} from '../../lib/mockData';
import { useEcoleStore } from '../../store/useEcoleStore';
import { StudentInitials } from './StudentInitials';
import { Select } from './Select';
import { UserProfileDropdown } from './UserProfileDropdown';
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
} from 'lucide-react';

export type UserRole = 'directeur' | 'enseignant' | 'caissier' | 'parent';

interface HeaderProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    UserRole,
    {
      label: string;
      roleTitle: string;
      icon: React.ReactNode;
      colorTheme: string;
      badgeColor: string;
      badgeText: string;
      badgeScope: string;
      user: typeof CURRENT_DIRECTEUR;
    }
  > = {
    directeur: {
      label: 'Directeur',
      roleTitle: 'Directeur d\'Établissement',
      icon: <UserCheck className="h-4 w-4 text-blue-600" />,
      colorTheme: 'text-blue-700 bg-blue-50 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      badgeText: 'Portail Direction',
      badgeScope: 'Accès complet école, élèves & trésorerie',
      user: CURRENT_DIRECTEUR,
    },
    enseignant: {
      label: 'Enseignant',
      roleTitle: 'Enseignant • 6ème A & CM2',
      icon: <GraduationCap className="h-4 w-4 text-emerald-600" />,
      colorTheme: 'text-emerald-700 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      badgeText: 'Espace Enseignant',
      badgeScope: 'Restreint aux classes assignées (zéro données financières)',
      user: CURRENT_ENSEIGNANT as any,
    },
    caissier: {
      label: 'Caissier',
      roleTitle: `Caissier • ${CURRENT_CAISSIER.guichet}`,
      icon: <CreditCard className="h-4 w-4 text-amber-600" />,
      colorTheme: 'text-amber-700 bg-amber-50 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      badgeText: 'Guichet Caisse',
      badgeScope: 'Encaissement & quittances (zéro données pédagogiques)',
      user: CURRENT_CAISSIER as any,
    },
    parent: {
      label: 'Parent',
      roleTitle: 'Parent d\'élève (2 enfants)',
      icon: <HeartHandshake className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      colorTheme: 'text-purple-700 bg-purple-50 border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      badgeText: 'Espace Parent',
      badgeScope: 'Restreint strictement aux enfants de la famille Diallo',
      user: CURRENT_PARENT as any,
    },
  };

  const currentConfig = rolesConfig[currentRole];
  const ecole = useEcoleStore((s) => s.ecole);

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3.5 sm:px-5 lg:px-6 flex items-center justify-between gap-3 sm:gap-4 shadow-2xs transition-colors duration-200">
      {/* Left: School Information & Global Search Bar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 lg:gap-4 min-w-0 flex-1 max-w-xl xl:max-w-2xl">
        {/* Back / Forward navigation */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <NavigationControls role={currentRole} />
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* School identity badge with fluid truncation and tooltip */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${currentConfig.colorTheme}`}
          >
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 hidden md:block max-w-[130px] lg:max-w-[170px] xl:max-w-[210px] 2xl:max-w-[260px]">
            <Tooltip content={ecole.nom} side="bottom" as="div" className="block min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                {ecole.nom}
              </h2>
            </Tooltip>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate mt-0.5">
              <span className="truncate">{ecole.ville}</span>
              <span className="shrink-0">•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono shrink-0">
                {ecole.code_ecole}
              </span>
            </p>
          </div>
        </div>

        {/* Global Search Bar with fixed minimum width & responsive max-width */}
        <div className="relative flex-1 min-w-[130px] max-w-[180px] xl:max-w-[240px] 2xl:max-w-xs hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Rechercher..."
            className={`w-full h-9 pl-8.5 pr-7 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all ${
              isSearchFocused
                ? 'border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-600/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs pointer-events-none">
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
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 shadow-2xs"
            >
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden xl:inline">Site vitrine</span>
            </button>
          </Tooltip>
        )}

        {/* Academic Year pill (desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span>{ecole.annee_scolaire}</span>
        </div>

        {/* Role Selector (clean & discrete) */}
        {onRoleChange && (
          <Select<UserRole>
            value={currentRole}
            onChange={onRoleChange}
            prefix="Vue :"
            size="sm"
            variant="subtle"
            align="right"
            className="shrink-0"
            menuClassName="w-56"
            options={(Object.keys(rolesConfig) as UserRole[]).map((role) => ({
              value: role,
              label: rolesConfig[role].label,
              icon: rolesConfig[role].icon,
              description: rolesConfig[role].roleTitle,
            }))}
          />
        )}

        {/* Notifications Icon Button */}
        <Tooltip content="Notifications" side="bottom">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Notifications"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('relances');
            }}
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>
        </Tooltip>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Info with Avatar Trigger for UserProfileDropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 sm:gap-2 h-9 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <StudentInitials
              nom={currentConfig.user.nom}
              prenom={currentConfig.user.prenom}
              size="sm"
            />
            <div className="hidden lg:flex flex-col text-left min-w-0 max-w-[90px] xl:max-w-[120px]">
              <Tooltip content={`${currentConfig.user.prenom} ${currentConfig.user.nom}`} side="bottom" className="flex min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {currentConfig.user.prenom}
                </span>
              </Tooltip>
              <Tooltip content={currentConfig.roleTitle} side="bottom" className="flex min-w-0">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {currentConfig.label}
                </span>
              </Tooltip>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Profile Panel */}
          <UserProfileDropdown
            user={currentConfig.user}
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


