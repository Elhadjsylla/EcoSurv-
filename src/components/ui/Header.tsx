import React from 'react';
import { CURRENT_ECOLE, CURRENT_DIRECTEUR, CURRENT_ENSEIGNANT } from '../../lib/mockData';
import { StudentInitials } from './StudentInitials';
import { Building2, Calendar, ShieldCheck, Bell, ArrowRightLeft } from 'lucide-react';

interface HeaderProps {
  currentRole?: 'directeur' | 'enseignant';
  onRoleChange?: (role: 'directeur' | 'enseignant') => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'directeur',
  onRoleChange,
}) => {
  const isEnseignant = currentRole === 'enseignant';
  const currentUser = isEnseignant ? CURRENT_ENSEIGNANT : CURRENT_DIRECTEUR;

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xs px-6 flex items-center justify-between shadow-2xs">
      {/* Left: School Name & Academic Year */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md border ${
              isEnseignant
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : 'bg-blue-50 text-blue-700 border-blue-200/60'
            }`}
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
              <span className={isEnseignant ? 'text-emerald-700 font-semibold' : 'text-blue-700 font-semibold'}>
                {CURRENT_ECOLE.code_ecole}
              </span>
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Année Scolaire {CURRENT_ECOLE.annee_scolaire}</span>
        </div>
      </div>

      {/* Right: Role Switcher, Security Badge & Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill for Demo */}
        {onRoleChange && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onRoleChange('directeur')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                !isEnseignant
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Directeur
            </button>
            <button
              onClick={() => onRoleChange('enseignant')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                isEnseignant
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Enseignant
            </button>
          </div>
        )}

        {/* Security Badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
            isEnseignant
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <ShieldCheck className={`h-3.5 w-3.5 ${isEnseignant ? 'text-emerald-600' : 'text-blue-600'}`} />
          <span>
            {isEnseignant ? 'RLS Enseignant (6ème A, CM2)' : 'RLS Directeur (Finance)'}
          </span>
        </div>

        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Info with Initials Avatar */}
        <div className="flex items-center gap-2.5">
          <StudentInitials
            nom={currentUser.nom}
            prenom={currentUser.prenom}
            size="md"
          />
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser.prenom} {currentUser.nom}
            </span>
            <span
              className={`text-[11px] font-semibold capitalize ${
                isEnseignant ? 'text-emerald-700' : 'text-blue-600'
              }`}
            >
              {currentUser.role}
              {isEnseignant && ' • 6ème A & CM2'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
