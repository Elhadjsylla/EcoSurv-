import React from 'react';
import {
  CURRENT_ECOLE,
  CURRENT_DIRECTEUR,
  CURRENT_ENSEIGNANT,
  CURRENT_CAISSIER,
  CURRENT_PARENT,
} from '../../lib/mockData';
import { StudentInitials } from './StudentInitials';
import { Building2, Calendar, ShieldCheck, Bell } from 'lucide-react';

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
  const getUserData = () => {
    switch (currentRole) {
      case 'enseignant':
        return {
          user: CURRENT_ENSEIGNANT,
          colorTheme: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
          badgeText: 'RLS Enseignant (6ème A, CM2)',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          roleLabel: 'Enseignant • 6ème A & CM2',
        };
      case 'caissier':
        return {
          user: CURRENT_CAISSIER,
          colorTheme: 'text-amber-700 bg-amber-50 border-amber-200/60',
          badgeText: 'RLS Caissier (Finance Uniquement)',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          roleLabel: `Caissier • ${CURRENT_CAISSIER.guichet}`,
        };
      case 'parent':
        return {
          user: CURRENT_PARENT,
          colorTheme: 'text-indigo-700 bg-indigo-50 border-indigo-200/60',
          badgeText: 'RLS Parent (Enfants Famille Diallo)',
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          roleLabel: 'Parent d\'élève (2 enfants)',
        };
      case 'directeur':
      default:
        return {
          user: CURRENT_DIRECTEUR,
          colorTheme: 'text-blue-700 bg-blue-50 border-blue-200/60',
          badgeText: 'RLS Directeur (Accès Complet École)',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
          roleLabel: 'Directeur d\'Établissement',
        };
    }
  };

  const { user, colorTheme, badgeText, badgeColor, roleLabel } = getUserData();

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: School Name & Academic Year */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md border ${colorTheme}`}
          >
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {CURRENT_ECOLE.nom}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <span>{CURRENT_ECOLE.ville}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                {CURRENT_ECOLE.code_ecole}
              </span>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Année Scolaire {CURRENT_ECOLE.annee_scolaire}</span>
        </div>
      </div>

      {/* Right: Role Switcher, Security Badge & Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Pill for Multi-Portal Demo */}
        {onRoleChange && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 overflow-x-auto text-[11px] font-bold">
            <button
              onClick={() => onRoleChange('directeur')}
              className={`px-2 py-1 rounded transition-all ${
                currentRole === 'directeur'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Directeur
            </button>
            <button
              onClick={() => onRoleChange('enseignant')}
              className={`px-2 py-1 rounded transition-all ${
                currentRole === 'enseignant'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enseignant
            </button>
            <button
              onClick={() => onRoleChange('caissier')}
              className={`px-2 py-1 rounded transition-all ${
                currentRole === 'caissier'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Caissier
            </button>
            <button
              onClick={() => onRoleChange('parent')}
              className={`px-2 py-1 rounded transition-all ${
                currentRole === 'parent'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parent
            </button>
          </div>
        )}

        {/* Security Badge */}
        <div
          className={`hidden xl:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${badgeColor}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{badgeText}</span>
        </div>

        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Info with Initials Avatar */}
        <div className="flex items-center gap-2">
          <StudentInitials
            nom={user.nom}
            prenom={user.prenom}
            size="sm"
          />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user.prenom} {user.nom}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

