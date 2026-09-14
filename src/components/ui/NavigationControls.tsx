import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserRole } from './Header';
import {
  useNavigationStore,
  selectCanGoBack,
  selectCanGoForward,
} from '../../store/useNavigationStore';

// Couleur d'accent du portail, appliquée uniquement au survol d'un bouton actif.
const accentHover: Record<UserRole, string> = {
  directeur:
    'enabled:hover:text-blue-600 enabled:hover:bg-blue-50 enabled:hover:border-blue-200 dark:enabled:hover:text-blue-300 dark:enabled:hover:bg-blue-950/60 dark:enabled:hover:border-blue-800',
  enseignant:
    'enabled:hover:text-emerald-600 enabled:hover:bg-emerald-50 enabled:hover:border-emerald-200 dark:enabled:hover:text-emerald-300 dark:enabled:hover:bg-emerald-950/60 dark:enabled:hover:border-emerald-800',
  caissier:
    'enabled:hover:text-amber-600 enabled:hover:bg-amber-50 enabled:hover:border-amber-200 dark:enabled:hover:text-amber-300 dark:enabled:hover:bg-amber-950/60 dark:enabled:hover:border-amber-800',
  parent:
    'enabled:hover:text-purple-600 enabled:hover:bg-purple-50 enabled:hover:border-purple-200 dark:enabled:hover:text-purple-300 dark:enabled:hover:bg-purple-950/60 dark:enabled:hover:border-purple-800',
};

interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  role: UserRole;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, disabled, onClick, role }) => (
  <div className="relative group/nav">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        accentHover[role]
      )}
    >
      {icon}
    </button>
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[10px] font-semibold text-white shadow-lg opacity-0 transition-opacity group-hover/nav:opacity-100 group-focus-within/nav:opacity-100 z-50"
    >
      {label}
    </span>
  </div>
);

export const NavigationControls: React.FC<{ role: UserRole }> = ({ role }) => {
  const canGoBack = useNavigationStore(selectCanGoBack);
  const canGoForward = useNavigationStore(selectCanGoForward);
  const back = useNavigationStore((s) => s.back);
  const forward = useNavigationStore((s) => s.forward);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <NavButton
        label="Précédent"
        icon={<ChevronLeft className="h-4 w-4" />}
        disabled={!canGoBack}
        onClick={back}
        role={role}
      />
      <NavButton
        label="Suivant"
        icon={<ChevronRight className="h-4 w-4" />}
        disabled={!canGoForward}
        onClick={forward}
        role={role}
      />
    </div>
  );
};
