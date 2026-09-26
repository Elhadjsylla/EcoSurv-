import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import type { UserRole } from '../components/ui/Header';

export const SetPasswordPage: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const ecole = useAuthStore((s) => s.ecole);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabel =
    profile?.role === 'enseignant'
      ? 'Espace Enseignant'
      : profile?.role === 'caissier'
      ? 'Espace Caissier'
      : profile?.role === 'parent'
      ? 'Espace Parent'
      : 'Espace Collaborateur';

  const ecoleNom = ecole?.nom || 'Votre établissement';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!password || password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Mettre à jour le mot de passe dans Supabase Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateAuthError) {
        throw updateAuthError;
      }

      // 2. Activer le profil dans public.profils
      if (profile?.id) {
        const { error: profileError } = await supabase
          .from('profils')
          .update({ actif: true })
          .eq('id', profile.id);

        if (profileError) {
          console.warn('[SetPassword] Note mise à jour profil actif:', profileError.message);
        }

        useAuthStore.getState().setProfile({
          ...profile,
          actif: true,
        });
      }

      // 3. Nettoyer le hash de l'URL
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      // 4. Lancer le portail correspondant au rôle
      const role = (profile?.role as UserRole) || 'enseignant';
      useNavigationStore.getState().setUserRole(role);
      useNavigationStore.getState().launchAppWithPortal(role);
    } catch (err: any) {
      console.error('[SetPassword] Erreur activation mot de passe:', err);
      setError(err?.message || 'Erreur lors de la définition de votre mot de passe.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
            ES
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
            EcoSurv
          </span>
        </div>
        <LanguageSelector />
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
              {roleLabel} • {ecoleNom}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Bienvenue, {profile?.prenom || ''} {profile?.nom || ''}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Votre invitation a été validée. Définissez votre mot de passe pour finaliser l'activation de votre compte professionnel.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="6 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Répétez votre mot de passe"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{submitting ? 'Activation en cours...' : 'Activer mon compte et accéder'}</span>
              </button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Connexion chiffrée de bout en bout • EcoSurv MR</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400">
        EcoSurv Mauritanie • Sécurité et intégrité des données scolaires
      </div>
    </div>
  );
};
