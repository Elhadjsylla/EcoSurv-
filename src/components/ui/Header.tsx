import React, { useState, useRef, useEffect } from 'react';
import {
  CURRENT_ECOLE,
  CURRENT_DIRECTEUR,
  CURRENT_ENSEIGNANT,
  CURRENT_CAISSIER,
  CURRENT_PARENT,
} from '../../lib/mockData';
import { StudentInitials } from './StudentInitials';
import {
  Building2,
  Calendar,
  ShieldCheck,
  Bell,
  ChevronDown,
  UserCheck,
  GraduationCap,
  CreditCard,
  HeartHandshake,
  Check,
} from 'lucide-react';

export type UserRole = 'directeur' | 'enseignant' | 'caissier' | 'parent';

interface HeaderProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'directeur',
  onRoleChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermeture du dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      colorTheme: 'text-blue-700 bg-blue-50 border-blue-200/60',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeText: 'RLS Directeur',
      badgeScope: 'Accès complet école, élèves & trésorerie',
      user: CURRENT_DIRECTEUR,
    },
    enseignant: {
      label: 'Enseignant',
      roleTitle: 'Enseignant • 6ème A & CM2',
      icon: <GraduationCap className="h-4 w-4 text-emerald-600" />,
      colorTheme: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeText: 'RLS Enseignant',
      badgeScope: 'Restreint aux classes assignées (zéro données financières)',
      user: CURRENT_ENSEIGNANT as any,
    },
    caissier: {
      label: 'Caissier',
      roleTitle: `Caissier • ${CURRENT_CAISSIER.guichet}`,
      icon: <CreditCard className="h-4 w-4 text-amber-600" />,
      colorTheme: 'text-amber-700 bg-amber-50 border-amber-200/60',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeText: 'RLS Caissier',
      badgeScope: 'Encaissement & quittances (zéro données pédagogiques)',
      user: CURRENT_CAISSIER as any,
    },
    parent: {
      label: 'Parent',
      roleTitle: 'Parent d\'élève (2 enfants)',
      icon: <HeartHandshake className="h-4 w-4 text-indigo-600" />,
      colorTheme: 'text-indigo-700 bg-indigo-50 border-indigo-200/60',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badgeText: 'RLS Parent',
      badgeScope: 'Restreint strictement aux enfants de la famille Diallo',
      user: CURRENT_PARENT as any,
    },
  };

  const currentConfig = rolesConfig[currentRole];

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* Left: School Name & Academic Year */}
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg border shrink-0 ${currentConfig.colorTheme}`}
          >
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
              {CURRENT_ECOLE.nom}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium truncate mt-0.5">
              <span>{CURRENT_ECOLE.ville}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 font-mono">
                {CURRENT_ECOLE.code_ecole}
              </span>
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Année Scolaire {CURRENT_ECOLE.annee_scolaire}</span>
        </div>
      </div>

      {/* Right: Discrete Role Dropdown, Compact Security Badge & Profile Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Sélecteur de rôle discret en dropdown */}
        {onRoleChange && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 shadow-2xs"
              title="Changer de rôle pour tester les différents portails"
            >
              <div className="flex items-center gap-1.5">
                {currentConfig.icon}
                <span className="text-slate-500 font-normal hidden sm:inline">Vue :</span>
                <span className="font-bold text-slate-900">{currentConfig.label}</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-slate-700' : ''
                }`}
              />
            </button>

            {/* Menu Déroulant */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Changer de vue (Simulation RLS)
                </div>
                {(Object.keys(rolesConfig) as UserRole[]).map((role) => {
                  const item = rolesConfig[role];
                  const isSelected = currentRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0">{item.icon}</div>
                        <div className="text-left">
                          <div>{item.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-[130px]">
                            {item.roleTitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Compact Security Badge with Tooltip */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-help ${currentConfig.badgeColor}`}
          title={`${currentConfig.badgeText} : ${currentConfig.badgeScope}`}
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden md:inline">{currentConfig.badgeText}</span>
        </div>

        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Info with Initials Avatar */}
        <div className="flex items-center gap-2.5">
          <StudentInitials
            nom={currentConfig.user.nom}
            prenom={currentConfig.user.prenom}
            size="sm"
          />
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {currentConfig.user.prenom} {currentConfig.user.nom}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              {currentConfig.roleTitle}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


