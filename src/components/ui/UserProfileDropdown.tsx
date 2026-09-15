import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useEcole } from '../../data/ecole';
import { StudentInitials } from './StudentInitials';
import {
  Building2,
  Users,
  Bell,
  Settings,
  Globe,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

interface UserProfileDropdownProps {
  user: {
    nom: string;
    prenom: string;
    email?: string;
  };
  roleTitle: string;
  roleBadge: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

const statutAbonnement: Record<string, { label: string; className: string }> = {
  actif: { label: 'Actif', className: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80' },
  essai: { label: 'Essai', className: 'text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/80' },
  suspendu: { label: 'Suspendu', className: 'text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/80' },
  expire: { label: 'Expiré', className: 'text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/80' },
  annule: { label: 'Annulé', className: 'text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/80' },
};

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  user,
  roleTitle,
  roleBadge,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeStore();
  const { data: ecole } = useEcole();
  const role = useAuthStore((s) => s.profile?.role);
  const signOut = useAuthStore((s) => s.signOut);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const estDirecteur = role === 'directeur';

  // Sub-view navigation ('main' | 'language')
  const [currentView, setCurrentView] = useState<'main' | 'language'>('main');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr');

  const languages = [
    { id: 'fr', name: 'Français', native: 'Français' },
    { id: 'ar', name: 'Arabe', native: 'العربية' },
    { id: 'en', name: 'Anglais', native: 'English' },
  ];

  // Close on Escape or click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
        setCurrentView('main');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        setCurrentView('main');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const abonnement = ecole ? statutAbonnement[ecole.statut_abonnement] : null;

  const lien = (tab: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => {
        onNavigateTab?.(tab);
        onClose();
      }}
      className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left font-semibold"
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2.5 w-80 sm:w-88 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {currentView === 'main' ? (
        <div className="p-4 space-y-4">
          {/* User Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <StudentInitials nom={user.nom} prenom={user.prenom} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {user.prenom} {user.nom}
                </h4>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {roleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email ?? roleTitle}</p>
            </div>
          </div>

          {/* École du compte */}
          {ecole && (
            <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{ecole.nom}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {[ecole.ville, ecole.annee_scolaire].filter(Boolean).join(' • ') || '—'}
                  </div>
                </div>
              </div>
              {abonnement && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${abonnement.className}`}>
                  {abonnement.label}
                </span>
              )}
            </div>
          )}

          {/* Action Links */}
          <div className="space-y-1 text-xs">
            {estDirecteur && (
              <>
                {lien('config', 'Gérer les accès & Personnel', <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />)}
                {lien('relances', 'Relances & Impayés', <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />)}
                {lien('config', 'Paramètres de l’établissement', <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />)}
              </>
            )}

            {/* Language Selector trigger */}
            <button
              onClick={() => setCurrentView('language')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span>Langue</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-medium">{languages.find((l) => l.id === selectedLanguage)?.name}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>

            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-xl text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5 font-semibold">
                {theme === 'dark' ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                <span>Mode Sombre</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                aria-label="Mode sombre"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Log Out */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              disabled={isSigningOut}
              onClick={async () => {
                setIsSigningOut(true);
                // Session Supabase fermée, cache et historique vidés : l'écran de connexion prend le relais.
                await signOut();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-xs font-bold disabled:opacity-60 disabled:cursor-wait"
            >
              <LogOut className="h-4 w-4" />
              <span>{isSigningOut ? 'Déconnexion…' : 'Déconnexion'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Language Sub-View */
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentView('main')}
              aria-label="Retour"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sélectionner la langue</h4>
          </div>

          <div className="space-y-1.5 text-xs">
            {languages.map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{lang.name}</span>
                    <span className="text-[11px] text-slate-400">({lang.native})</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentView('main')}
            className="w-full mt-2 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
          >
            Valider
          </button>
        </div>
      )}
    </div>
  );
};
