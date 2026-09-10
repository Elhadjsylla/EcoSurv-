import React from 'react';
import {
  CURRENT_DIRECTEUR,
  CURRENT_ENSEIGNANT,
  CURRENT_CAISSIER,
  CURRENT_PARENT,
} from '../../lib/mockData';
import { useEcoleStore } from '../../store/useEcoleStore';
import { StudentInitials } from './StudentInitials';
import { Select } from './Select';
import {
  Building2,
  Calendar,
  ShieldCheck,
  Bell,
  UserCheck,
  GraduationCap,
  CreditCard,
  HeartHandshake,
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
  const ecole = useEcoleStore((s) => s.ecole);

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
            <h2 title={ecole.nom} className="text-sm font-bold text-slate-900 leading-tight truncate">
              {ecole.nom}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium truncate mt-0.5">
              <span>{ecole.ville}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 font-mono">
                {ecole.code_ecole}
              </span>
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Année Scolaire {ecole.annee_scolaire}</span>
        </div>
      </div>

      {/* Right: Discrete Role Dropdown, Compact Security Badge & Profile Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Sélecteur de rôle via Select unifié */}
        {onRoleChange && (
          <Select<UserRole>
            value={currentRole}
            onChange={onRoleChange}
            prefix="Vue :"
            size="sm"
            variant="subtle"
            align="right"
            menuClassName="w-56"
            options={(Object.keys(rolesConfig) as UserRole[]).map((role) => ({
              value: role,
              label: rolesConfig[role].label,
              icon: rolesConfig[role].icon,
              description: rolesConfig[role].roleTitle,
            }))}
          />
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
        <div className="flex items-center gap-2.5 min-w-0">
          <StudentInitials
            nom={currentConfig.user.nom}
            prenom={currentConfig.user.prenom}
            size="sm"
          />
          <div className="hidden lg:flex flex-col text-left min-w-0 max-w-[140px] xl:max-w-[180px]">
            <span
              title={`${currentConfig.user.prenom} ${currentConfig.user.nom}`}
              className="text-xs font-bold text-slate-900 leading-tight truncate"
            >
              {currentConfig.user.prenom} {currentConfig.user.nom}
            </span>
            <span
              title={currentConfig.roleTitle}
              className="text-[10px] font-medium text-slate-500 truncate"
            >
              {currentConfig.roleTitle}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


