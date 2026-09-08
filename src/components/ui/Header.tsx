import React from 'react';
import { CURRENT_ECOLE, CURRENT_DIRECTEUR } from '../../lib/mockData';
import { StudentInitials } from './StudentInitials';
import { Building2, Calendar, ShieldCheck, Bell } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xs px-6 flex items-center justify-between shadow-2xs">
      {/* Left: School Name & Academic Year */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {CURRENT_ECOLE.nom}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <span>{CURRENT_ECOLE.ville}</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">{CURRENT_ECOLE.code_ecole}</span>
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Année Scolaire {CURRENT_ECOLE.annee_scolaire}</span>
        </div>
      </div>

      {/* Right: Security Badge & Profile Avatar */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Isolation RLS Conforme</span>
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
            nom={CURRENT_DIRECTEUR.nom}
            prenom={CURRENT_DIRECTEUR.prenom}
            size="md"
          />
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {CURRENT_DIRECTEUR.prenom} {CURRENT_DIRECTEUR.nom}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 capitalize">
              {CURRENT_DIRECTEUR.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
