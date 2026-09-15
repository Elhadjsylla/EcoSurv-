import React, { useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Compte super_admin : authentifié, mais sans portail d'école dans
 * l'application web. La console du §5.9 (gestion du parc d'écoles et des
 * abonnements) passera par des Edge Functions et reste à construire.
 */
export const SuperAdminPage: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [leaving, setLeaving] = useState(false);

  const fullName = [profile?.prenom, profile?.nom].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight">Espace super administrateur</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {fullName || 'Super admin'} • {profile?.email ?? user?.email}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <p className="font-semibold text-slate-900 dark:text-white">Console super admin disponible prochainement</p>
          <p>
            Votre compte est bien reconnu. La gestion du parc d'écoles et des abonnements n'est pas encore
            disponible dans l'application web, et les portails d'école ne sont pas ouverts à ce rôle.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            loading={leaving}
            loadingText="Déconnexion…"
            onClick={async () => {
              setLeaving(true);
              await signOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};
