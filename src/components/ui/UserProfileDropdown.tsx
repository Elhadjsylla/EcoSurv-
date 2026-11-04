import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { StudentInitials } from './StudentInitials';
import { ThemeSwitch } from './ThemeSwitch';
import { AnimatePresence, motion } from 'framer-motion';
import { DURATION, EASE, popoverVariants, useMotionPrefs } from '../../lib/motion';
import { useNotificationsStore } from '../../store/useNotificationsStore';
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
  const unreadCount = useNotificationsStore((s) => s.unreadCount());
  const { reduce } = useMotionPrefs();

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
      const target = event.target as Node;
      // Le déclencheur gère lui-même l'ouverture et la fermeture (data-profile-trigger).
      const trigger = document.querySelector('[data-profile-trigger]');
      if (trigger && trigger.contains(target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
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

  // Rend le focus au déclencheur quand le menu se ferme (Échap, choix d'une entrée).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      const active = document.activeElement;
      const insideMenu = dropdownRef.current?.contains(active) ?? false;
      if (insideMenu || active === document.body || active === null) {
        (document.querySelector('[data-profile-trigger]') as HTMLElement | null)?.focus();
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const rowClass =
    'w-full min-h-11 flex items-center gap-3 px-2.5 py-2 rounded-md text-secondary hover:bg-surface-subtle hover:text-main active:bg-surface-subtle active:scale-[0.99] transition-colors text-left font-semibold focus-halo cursor-pointer';
  const iconCol = 'flex h-5 w-5 shrink-0 items-center justify-center text-muted';

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      ref={dropdownRef}
      role="menu"
      aria-label="Menu du profil"
      variants={popoverVariants}
      initial={reduce ? false : 'closed'}
      animate="open"
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE.out } }}
      style={{ transformOrigin: 'top right' }}
      className="absolute right-0 top-full mt-2 w-80 sm:w-88 max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-lg bg-surface-elevated border border-subtle shadow-elevated z-50"
    >
      {currentView === 'main' ? (
        <div className="p-4 space-y-3">
          {/* User Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-default">
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
                {(!ecole || ecole.ville) && (
                  <div className="text-xs text-muted tabular-nums truncate">
                    {ecole ? ecole.ville : 'Chargement…'}
                  </div>
                )}
              </div>
            </div>
            {ecole && (
              <span className="text-xs font-bold uppercase tracking-wider text-success-text bg-success-surface border border-success-border px-2 py-0.5 rounded-sm shrink-0">
                {ecole.statut_activation === 'active' ? 'Actif' : ecole.statut_activation}
              </span>
            )}
          </div>

          {/* Action Links */}
          <div className="text-xs space-y-1 border-t border-default pt-3">
            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('config');
                onClose();
              }}
              role="menuitem"
              className={rowClass}
            >
              <span className={iconCol}><Users className="h-4 w-4" /></span>
              <span className="flex-1 min-w-0 truncate">Gérer les accès & Personnel</span>
              <span className={iconCol}><ChevronRight className="h-4 w-4" /></span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('relances');
                onClose();
              }}
              role="menuitem"
              className={rowClass}
            >
              <span className={iconCol}><Bell className="h-4 w-4" /></span>
              <span className="flex-1 min-w-0 truncate">Notifications & Rappels</span>
              {/* Compteur réel (useNotificationsStore) : masqué quand il n'y a rien de non lu */}
              {unreadCount > 0 ? (
                <span
                  aria-label={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-surface border border-danger-border text-danger-text px-1.5 text-xs font-bold tabular-nums"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : (
                <span className={iconCol}><ChevronRight className="h-4 w-4" /></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('config');
                onClose();
              }}
              role="menuitem"
              className={rowClass}
            >
              <span className={iconCol}><Settings className="h-4 w-4" /></span>
              <span className="flex-1 min-w-0 truncate">Paramètres système</span>
              <span className={iconCol}><ChevronRight className="h-4 w-4" /></span>
            </button>

            {/* Language Selector trigger */}
            <button
              type="button"
              onClick={() => setCurrentView('language')}
              role="menuitem"
              className={rowClass}
            >
              <span className={iconCol}><Globe className="h-4 w-4" /></span>
              <span className="flex-1 min-w-0 truncate">Langue</span>
              <span className="text-xs font-medium text-muted">
                {languages.find((l) => l.id === selectedLanguage)?.name}
              </span>
              <span className={iconCol}><ChevronRight className="h-4 w-4" /></span>
            </button>

            {/* Dark Mode Switch */}
            <div className="min-h-11 flex items-center gap-3 pl-2.5 pr-0 text-secondary">
              <span className={iconCol}>
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </span>
              <span className="flex-1 min-w-0 truncate font-semibold">Mode Sombre</span>
              {/* Interrupteur : même action qu'avant (toggleTheme), seul l'aspect change */}
              <ThemeSwitch checked={theme === 'dark'} onToggle={toggleTheme} />
            </div>
          </div>

          {/* Log Out */}
          <div className="pt-3 border-t border-default">
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
              role="menuitem"
              className="group w-full min-h-11 flex items-center gap-3 px-2.5 py-2 rounded-md border border-transparent text-danger-text hover:bg-danger-surface hover:border-danger-border active:scale-[0.99] transition-colors text-xs font-bold cursor-pointer focus-halo"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <LogOut className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
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
              aria-label="Retour au menu"
              className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface-subtle text-muted hover:text-main transition-colors focus-halo cursor-pointer"
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
    </motion.div>
      )}
    </AnimatePresence>
  );
};
