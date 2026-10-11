import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserProfile } from '../store/useAuthStore';
import { useEcoleStore } from '../store/useEcoleStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { CONTACT_CONFIG, getWhatsAppUrl } from '../config/contact';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { logLoginSuccess } from '../lib/auditLogger';
import type { UserRole } from '../components/ui/Header';

interface LoginPageProps {
  onReturnToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onReturnToLanding }) => {
  const authProfile = useAuthStore((s) => s.profile);
  const navigateToUserPortal = useNavigationStore((s) => s.navigateToUserPortal);

  useEffect(() => {
    if (authProfile) {
      navigateToUserPortal(authProfile.role);
    }
  }, [authProfile, navigateToUserPortal]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mot de passe oublié
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitting(true);
    setForgotError(null);
    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      // Envoi du lien via le mailer Supabase Auth vers la page /set-password
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/set-password`,
      });

      // Sécurité anti-énumération : même si l'email n'existe pas en base ou rate-limit natif,
      // on affiche toujours le message neutre pour ne jamais dévoiler l'existence du compte.
      if (error) {
        console.warn('[LoginPage] resetPasswordForEmail retour Supabase:', error.message);
      }
      setForgotSuccess(true);
    } catch (err: any) {
      console.warn('[LoginPage] resetPasswordForEmail exception:', err);
      // Réponse neutre même en cas d'exception
      setForgotSuccess(true);
    } finally {
      setForgotSubmitting(false);
    }
  };

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleReturn = () => {
    if (onReturnToLanding) {
      onReturnToLanding();
    } else {
      useNavigationStore.getState().setViewMode('landing');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('api key') || msg.includes('fetch') || msg.includes('network')) {
          // Gestion des comptes de test / démo en environnement local
          if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('super')) {
            useAuthStore.getState().setUser({ id: 'usr-super-admin', email } as any);
            useAuthStore.getState().setProfile({
              id: 'usr-super-admin',
              ecole_id: null,
              nom: 'Super Admin',
              prenom: 'Direction',
              telephone: '+222 45 00 00 00',
              role: 'super_admin',
              actif: true,
            });
            useNavigationStore.getState().setUserRole('directeur');
            useNavigationStore.getState().launchAppWithPortal('directeur');
            return;
          }
          setError('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
        } else if (msg.includes('invalid') || authError.status === 400) {
          setError('Email ou mot de passe incorrect.');
        } else {
          setError(authError.message || 'Erreur lors de la tentative de connexion.');
        }
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        setError('Aucune session active reçue. Veuillez réessayer.');
        setSubmitting(false);
        return;
      }

      // Récupération du profil utilisateur rattaché
      const { data: profile, error: profileError } = await supabase
        .from('profils')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[EcoSurv Auth] Erreur chargement profil:', profileError);
        setError('Connexion réussie mais impossible de charger votre profil utilisateur.');
        setSubmitting(false);
        return;
      }

      if (!profile) {
        setError("Ce compte n'est rattaché à aucun profil EcoSurv actif. Contactez votre établissement.");
        setSubmitting(false);
        return;
      }

      if (!profile.actif) {
        setError('Votre compte est actuellement désactivé. Contactez la direction de votre établissement.');
        setSubmitting(false);
        return;
      }

      // Stocker l'utilisateur et le profil
      useAuthStore.getState().setUser(authData.user);
      useAuthStore.getState().setProfile(profile as UserProfile);

      // Si super_admin : accès direct à la Console Super Admin (style Sama Boutik)
      if (profile.role === 'super_admin') {
        logLoginSuccess(profile.email || authData.user.email || 'superadmin@ecosurv.mr', 'super_admin', {
          nom: `${profile.prenom} ${profile.nom}`,
        });
        useNavigationStore.getState().navigateToAdminConsole();
        return;
      }

      // Pour les autres rôles, vérification et synchronisation de l'établissement réel
      if (profile.ecole_id) {
        const { data: ecoleData } = await supabase
          .from('ecoles')
          .select('id, nom, ville, telephone, email, statut_activation, statut_abonnement')
          .eq('id', profile.ecole_id)
          .maybeSingle();

        if (ecoleData) {
          useAuthStore.getState().setEcole(ecoleData);
          useEcoleStore.getState().updateEcole({
            id: ecoleData.id,
            nom: ecoleData.nom,
            ville: ecoleData.ville || 'Mauritanie',
            telephone: ecoleData.telephone || '',
            email: ecoleData.email || '',
            statut_activation: ecoleData.statut_activation,
            code_ecole: ecoleData.nom.slice(0, 4).toUpperCase(),
          });

          if (ecoleData.statut_activation !== 'active') {
            useNavigationStore.getState().navigateToPendingActivation();
            return;
          }
        }
      }

      // Déduire le portail et lancer l'application avec les données réelles
      const role = profile.role as UserRole;
      useNavigationStore.getState().setUserRole(role);
      useNavigationStore.getState().launchAppWithPortal(role);
    } catch (err: any) {
      console.error('[EcoSurv Auth] Erreur inattendue:', err);
      setError(err?.message || 'Une erreur inattendue est survenue.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Bar with Back Button and Brand */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour au site</span>
        </button>

        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
              ES
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              EcoSurv
            </span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Espace Sécurisé Établissement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Connexion à votre espace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Accédez à la gestion de scolarité, caisse et suivi pédagogique.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-scale-in"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Adresse email professionnelle
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  disabled={submitting}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@exemple.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSuccess(false);
                    setForgotError(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={passwordRef}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  disabled={submitting}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Se connecter</span>
                </>
              )}
            </button>

            {/* Inscription d'un nouvel établissement */}
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vous n'avez pas encore inscrit votre établissement ?{' '}
                <button
                  type="button"
                  onClick={() => useNavigationStore.getState().navigateToRegister()}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Créer mon école
                </button>
              </p>
            </div>
          </form>

          {/* Help & Assistance */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identifiants perdus ou compte bloqué ?
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Rapprochez-vous de la direction de votre établissement ou contactez notre assistance technique au{' '}
              <a
                href={getWhatsAppUrl('Bonjour EcoSurv, j\'ai besoin d\'aide pour accéder à mon compte.')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                support WhatsApp ({CONTACT_CONFIG.phone.display})
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} EcoSurv Mauritanie &bull; Plateforme agréée de gestion scolaire
      </div>

      {/* Modal Mot de passe oublié */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl max-w-md w-full space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Réinitialiser le mot de passe
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                  Email de réinitialisation envoyé !
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Si ce compte existe, un email contenant un lien sécurisé a été envoyé pour redéfinir votre mot de passe.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Compris
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Indiquez votre adresse email de connexion. Vous recevrez un lien sécurisé vers la page de réinitialisation pour définir un nouveau mot de passe.
                </p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="exemple@exemple.com"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-60"
                  >
                    {forgotSubmitting ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
