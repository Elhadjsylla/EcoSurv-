import React, { useState, useRef, useEffect } from 'react';
import { useEcole } from '../../data/ecole';
import { useAuthStore } from '../../store/useAuthStore';
import type { Portal } from '../../lib/portals';
import { StudentInitials } from './StudentInitials';
import { UserProfileDropdown } from './UserProfileDropdown';
import { NavigationControls } from './NavigationControls';
import { Tooltip } from './Tooltip';
import { Building2, Calendar, Bell, Search, ChevronDown } from 'lucide-react';

export type UserRole = Portal;

interface HeaderProps {
  /** Portail du rôle connecté : il n'est plus choisi dans l'interface. */
  currentRole: UserRole;
  className?: string;
  onNavigateTab?: (tab: string) => void;
}

const rolesConfig: Record<UserRole, { label: string; roleTitle: string; colorTheme: string }> = {
  directeur: {
    label: 'Directeur',
    roleTitle: "Directeur d'établissement",
    colorTheme: 'text-blue-700 bg-blue-50 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  },
  enseignant: {
    label: 'Enseignant',
    roleTitle: 'Enseignant',
    colorTheme: 'text-emerald-700 bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  caissier: {
    label: 'Caissier',
    roleTitle: 'Caissier',
    colorTheme: 'text-amber-700 bg-amber-50 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  parent: {
    label: 'Parent',
    roleTitle: "Parent d'élève",
    colorTheme: 'text-purple-700 bg-purple-50 border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentRole, onNavigateTab }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profile = useAuthStore((s) => s.profile);
  const userEmail = useAuthStore((s) => s.user?.email);

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

  const currentConfig = rolesConfig[currentRole];
  const { data: ecole } = useEcole();
  const nomEcole = ecole?.nom ?? 'Chargement…';
  const user = {
    nom: profile?.nom ?? '',
    prenom: profile?.prenom ?? '',
    email: profile?.email ?? userEmail,
  };
  const fullName = [user.prenom, user.nom].filter(Boolean).join(' ');

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs transition-colors duration-200">
      {/* Left: School Information & Global Search Bar */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1 max-w-2xl">
        {/* Back / Forward navigation */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <NavigationControls role={currentRole} />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${currentConfig.colorTheme}`}
          >
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 hidden md:block">
            <Tooltip content={nomEcole} side="bottom" as="div" className="block min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                {nomEcole}
              </h2>
            </Tooltip>
            {ecole?.ville && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{ecole.ville}</p>
            )}
          </div>
        </div>

        {/* Global Search Bar (Nexoov style with "/" key hint) */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Rechercher quoi que ce soit..."
            className={`w-full h-9 pl-9 pr-10 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all ${
              isSearchFocused
                ? 'border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-600/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Notifications & User Avatar with Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 relative">
        {/* Academic Year pill (desktop) */}
        {ecole?.annee_scolaire && (
          <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{ecole.annee_scolaire}</span>
          </div>
        )}

        {/* Notifications : raccourci vers les relances, réservé au portail Directeur */}
        {currentRole === 'directeur' && (
          <Tooltip content="Notifications" side="bottom">
            <button
              type="button"
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Notifications"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('relances');
              }}
            >
              <Bell className="h-4.5 w-4.5" />
            </button>
          </Tooltip>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Info with Avatar Trigger for UserProfileDropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="Menu du profil"
            aria-expanded={isProfileOpen}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <StudentInitials nom={user.nom} prenom={user.prenom} size="sm" />
            <div className="hidden lg:flex flex-col text-left min-w-0 max-w-[120px]">
              <Tooltip content={fullName} side="bottom" className="flex min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {user.prenom || user.nom}
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
            user={user}
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
