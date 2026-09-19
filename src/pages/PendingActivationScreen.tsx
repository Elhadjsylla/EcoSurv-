import React, { useState } from 'react';
import {
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  MessageCircle,
  LogOut,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import type { UserRole } from '../components/ui/Header';

export const PendingActivationScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const ecole = useAuthStore((s) => s.ecole);

  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRefreshStatus = async () => {
    setChecking(true);
    setStatusMessage(null);

    try {
      // 1. Appel de la RPC backend mon_statut_acces
      let isActive = false;

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('mon_statut_acces');
        if (!rpcError && rpcData && rpcData.length > 0) {
          const row = rpcData[0];
          if (row.statut_activation === 'active' || row.acces_donnees === true) {
            isActive = true;
          }
        }
      } catch (e) {
        console.warn('[EcoSurv] RPC non disponible, vérification table ecoles:', e);
      }

      // 2. Si non confirmé par RPC, vérification directe de la table ecoles
      if (!isActive && profile?.ecole_id) {
        const { data: ecoleData } = await supabase
          .from('ecoles')
          .select('statut_activation')
          .eq('id', profile.ecole_id)
          .maybeSingle();

        if (ecoleData?.statut_activation === 'active') {
          isActive = true;
        }
      }

      if (isActive) {
        // L'école est activée : mise à jour du store et lancement du portail
        if (ecole) {
          useAuthStore.getState().setEcole({ ...ecole, statut_activation: 'active' });
        }
        const role = (profile?.role || 'directeur') as UserRole;
        useNavigationStore.getState().setUserRole(role);
        useNavigationStore.getState().launchAppWithPortal(role);
      } else {
        setStatusMessage(
          "Votre école est toujours en cours de vérification. Nos équipes traitent votre dossier dans les plus brefs délais."
        );
      }
    } catch (err) {
      console.error('[EcoSurv] Erreur vérification activation:', err);
      setStatusMessage("Impossible de vérifier le statut pour l'instant. Réessayez dans quelques minutes.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    useAuthStore.getState().logout();
    useNavigationStore.getState().reset();
    useNavigationStore.getState().setViewMode('landing');
  };

  const nomEcoleAffiche = ecole?.nom || 'Votre Établissement Scolaire';
  const nomResponsableAffiche = profile ? `${profile.prenom} ${profile.nom}` : 'Responsable Direction';
  const emailAffiche = ecole?.email || user?.email || 'Non renseigné';
  const telAffiche = ecole?.telephone || profile?.telephone || 'Non renseigné';
  const villeAffiche = ecole?.ville || 'Mauritanie';

  const whatsappMessage = encodeURIComponent(
    `Bonjour EcoSurv, je viens d'inscrire l'établissement "${nomEcoleAffiche}" (${villeAffiche}) et je souhaite demander l'activation de notre espace.`
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Bar with Brand & Logout */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
            ES
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block">
              EcoSurv Mauritanie
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">
              Plateforme de Gestion Scolaire
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Se déconnecter</span>
        </button>
      </div>

      {/* Main Status Container */}
      <div className="w-full max-w-2xl mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 p-6 sm:p-10 shadow-xl shadow-amber-500/5 dark:shadow-none space-y-8">
          {/* Status Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 shadow-md shadow-amber-500/10 animate-pulse">
              <Clock className="h-8 w-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-extrabold uppercase tracking-wide">
              <span>École en attente d'activation</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Votre établissement est bien enregistré
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Pour garantir la conformité et la sécurité des encaissements scolaires, l'accès au tableau de bord sera débloqué dès validation par notre équipe.
            </p>
          </div>

          {/* Feedback message if refresh clicked */}
          {statusMessage && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-3.5 text-xs font-semibold text-blue-800 dark:text-blue-300 animate-scale-in">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Summary Card of registered school */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5 space-y-3.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              <span>Récapitulatif du dossier</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                Statut : En cours d'examen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">École :</span>
                <strong className="text-slate-900 dark:text-white font-bold">{nomEcoleAffiche}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Ville :</span>
                <strong className="text-slate-900 dark:text-white font-bold">{villeAffiche}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Responsable :</span>
                <strong className="text-slate-900 dark:text-white font-bold">{nomResponsableAffiche}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Téléphone :</span>
                <strong className="text-slate-900 dark:text-white font-bold">{telAffiche}</strong>
              </div>

              <div className="flex items-center gap-2.5 sm:col-span-2">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Email :</span>
                <strong className="text-slate-900 dark:text-white font-bold">{emailAffiche}</strong>
              </div>
            </div>
          </div>

          {/* Process Timeline Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Délai habituel d'activation : 2 à 4 heures</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dès que l'administrateur confirme votre établissement, ce message disparaîtra automatiquement et vous serez directement redirigé vers votre espace Directeur. Vous pouvez également cliquer sur « Vérifier l'état » ci-dessous.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={checking}
              onClick={handleRefreshStatus}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Vérification en cours…' : 'Vérifier le statut d\'activation'}</span>
            </button>

            <a
              href={`https://wa.me/22246000000?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Accélérer l'activation sur WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} EcoSurv Mauritanie &bull; Support technique : +222 46 00 00 00
      </div>
    </div>
  );
};
