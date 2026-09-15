import React from 'react';
import { AlertTriangle, GraduationCap, Loader2, LogOut, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/Button';

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-center space-y-4">
      {children}
    </div>
  </div>
);

/** Affiché pendant la lecture de la session et du profil. */
export const SplashScreen: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
      <GraduationCap className="h-6 w-6" />
    </div>
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
      <Loader2 className="h-4 w-4 animate-spin" />
      Chargement de votre espace…
    </div>
  </div>
);

interface ProfileErrorScreenProps {
  onRetry: () => void;
  onSignOut: () => void;
}

/** Session valide mais profil illisible : on ne devine jamais un rôle par défaut. */
export const ProfileErrorScreen: React.FC<ProfileErrorScreenProps> = ({ onRetry, onSignOut }) => (
  <Frame>
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <h1 className="text-lg font-bold">Impossible de charger votre profil</h1>
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Votre connexion a réussi, mais votre rôle n'a pas pu être vérifié. Réessayez dans un instant.
    </p>
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="outline" size="sm" onClick={onSignOut}>
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </Button>
      <Button size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </Button>
    </div>
  </Frame>
);

/** Variables d'environnement absentes ou refusées : aucun appel réseau n'est tenté. */
export const ConfigErrorScreen: React.FC<{ message: string }> = ({ message }) => (
  <Frame>
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
      <Settings className="h-5 w-5" />
    </div>
    <h1 className="text-lg font-bold">Configuration Supabase invalide</h1>
    <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    <p className="text-xs text-slate-400">Voir .env.example et SECURITY_RULES.md §3.</p>
  </Frame>
);
