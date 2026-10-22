import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
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
  isSimulating?: boolean;
  simulationRole?: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  user,
  roleTitle,
  roleBadge,
  isSimulating,
  simulationRole,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeStore();
  const ecole = useAuthStore((s) => s.ecole);

  // Sub-view navigation ('main' | 'language')
  const [currentView, setCurrentView] = useState<'main' | 'language'>('main');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr');

  const languages = [
    { id: 'fr', name: 'Français', native: 'Français', available: true },
    { id: 'ar', name: 'Arabe', native: 'العربية', available: false },
    { id: 'en', name: 'Anglais', native: 'English', available: false },
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

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-md bg-surface-elevated border border-subtle shadow-elevated z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {currentView === 'main' ? (
        <div className="p-4 space-y-4">
          {/* User Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-subtle">
            <StudentInitials nom={user.nom} prenom={user.prenom} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-main truncate">
                  {user.prenom} {user.nom}
                </h4>
                <span className="rounded-sm bg-surface-subtle border border-subtle px-2 py-0.5 text-xs font-bold text-primary-text">
                  {roleBadge}
                </span>
                {isSimulating && (
                  <span className="rounded-sm bg-warning-surface border border-warning-border px-1.5 py-0.5 text-[10px] font-bold text-warning-text uppercase tracking-wider">
                    Simulation {simulationRole ? `(${simulationRole})` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted truncate mt-0.5">
                {roleTitle} {isSimulating && simulationRole ? `• Portail simulé : ${simulationRole}` : ''}
              </p>
            </div>
          </div>

          {/* School Card Switcher */}
          <div className="rounded-sm p-3 bg-surface-subtle border border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-sm bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-main truncate">
                  {ecole ? ecole.nom : 'Établissement…'}
                </div>
                <div className="text-xs text-muted tabular-nums truncate">
                  {ecole ? (ecole.ville ? `${ecole.ville} • ${ecole.nom.slice(0, 4).toUpperCase()}` : ecole.nom.slice(0, 4).toUpperCase()) : 'Chargement…'}
                </div>
              </div>
            </div>
            {ecole && (
              <span className="text-xs font-bold uppercase tracking-wider text-success-text bg-success-surface border border-success-border px-2 py-0.5 rounded-sm shrink-0">
                {ecole.statut_activation === 'active' ? 'Actif' : ecole.statut_activation}
              </span>
            )}
          </div>

          {/* Action Links */}
          <div className="space-y-1 text-xs">
            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('config');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-sm text-secondary hover:bg-surface-subtle hover:text-main transition-colors text-left font-semibold focus-halo cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-muted" />
                <span>Gérer les accès & Personnel</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('relances');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-sm text-secondary hover:bg-surface-subtle hover:text-main transition-colors text-left font-semibold focus-halo cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-muted" />
                <span>Notifications & Rappels</span>
              </div>
              <span className="rounded-sm bg-danger-surface border border-danger-border text-danger-text px-1.5 py-0.5 text-xs font-bold">
                2
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('config');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-sm text-secondary hover:bg-surface-subtle hover:text-main transition-colors text-left font-semibold focus-halo cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-muted" />
                <span>Paramètres système</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>

            {/* Language Selector trigger */}
            <button
              type="button"
              onClick={() => setCurrentView('language')}
              className="w-full flex items-center justify-between p-2.5 rounded-sm text-secondary hover:bg-surface-subtle hover:text-main transition-colors text-left font-semibold focus-halo cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-muted" />
                <span>Langue</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="text-xs font-medium">
                  {languages.find((l) => l.id === selectedLanguage)?.name}
                </span>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            </button>

            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-sm text-secondary">
              <div className="flex items-center gap-2.5 font-semibold">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-primary-text" />
                ) : (
                  <Sun className="h-4 w-4 text-warning" />
                )}
                <span>Mode Sombre</span>
              </div>

              {/* Functional Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-sm border-2 border-transparent transition-colors duration-200 ease-in-out focus-halo ${
                  theme === 'dark' ? 'bg-primary' : 'bg-surface-subtle border-default'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-sm bg-white shadow-xs transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Log Out */}
          <div className="pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } catch (err) {
                  console.warn('[EcoSurv] Erreur déconnexion:', err);
                }
                useAuthStore.getState().logout();
                useNavigationStore.getState().reset();
                useNavigationStore.getState().setViewMode('landing');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-sm text-danger-text hover:bg-danger-surface transition-colors text-xs font-bold cursor-pointer focus-halo"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      ) : (
        /* Language Sub-View */
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-subtle">
            <button
              type="button"
              onClick={() => setCurrentView('main')}
              className="p-1 rounded-sm hover:bg-surface-subtle text-muted hover:text-main transition-colors focus-halo cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold text-main">
              Sélectionner la langue
            </h4>
          </div>

          <div className="space-y-1.5 text-xs">
            {languages.map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              const isAvailable = lang.available;
              return (
                <button
                  key={lang.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => isAvailable && setSelectedLanguage(lang.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-sm border transition-all ${
                    !isAvailable
                      ? 'opacity-50 cursor-not-allowed border-subtle bg-surface-subtle text-muted'
                      : isSelected
                      ? 'border-primary bg-surface-subtle text-main font-bold'
                      : 'border-subtle hover:bg-surface-subtle text-secondary font-medium cursor-pointer focus-halo'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{lang.name}</span>
                    <span className="text-xs text-muted">({lang.native})</span>
                    {!isAvailable && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-surface-subtle border border-subtle text-muted">
                        Bientôt disponible
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary-text" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('main')}
            className="w-full mt-2 py-2 rounded-sm bg-primary text-on-primary font-bold text-xs hover:bg-primary-hover transition-colors focus-halo cursor-pointer"
          >
            Valider
          </button>
        </div>
      )}
    </div>
  );
};
