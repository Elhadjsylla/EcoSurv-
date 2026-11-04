import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Building2,
  Wallet,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserProfile } from '../store/useAuthStore';
import { useEcoleStore } from '../store/useEcoleStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { CONTACT_CONFIG, getWhatsAppUrl } from '../config/contact';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { Logo } from '../components/ui/Logo';
import { AuthAside, AUTH_SMOOTH_EASE, useAuthPanelVariants } from '../components/auth/AuthAside';
import { logLoginSuccess } from '../lib/auditLogger';
import { LegalLinks } from '../components/legal/LegalLinks';
import type { UserRole } from '../components/ui/Header';

interface LoginPageProps {
  onReturnToLanding?: () => void;
}

const SMOOTH_EASE = AUTH_SMOOTH_EASE;

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]';

// Les quatre accès de l'application, avec ce que chacun fait dans le code :
// PaiementsAttentePage (confirmer ou rejeter), CaissierGuichetPage et CaissierJournalPage
// (encaisser, clôturer la caisse), TeacherAbsencesPage (absences par classe),
// ParentAssiduitePage (relevé d'assiduité des enfants).
const LOGIN_ROLES = [
  { id: 'directeur', label: 'Directeur', text: 'Confirme ou rejette les paiements en attente', icon: Building2 },
  { id: 'caissier', label: 'Caissier', text: 'Encaisse au guichet et clôture la caisse', icon: Wallet },
  { id: 'enseignant', label: 'Enseignant', text: 'Saisit les absences de ses classes', icon: ClipboardCheck },
  { id: 'parent', label: 'Parent', text: "Consulte le relevé d'assiduité de ses enfants", icon: Users },
];

/** Liste des quatre accès : l'accès en surbrillance change toutes les 2,6 s (fixe en mouvement réduit). */
const LoginRoles: React.FC = () => {
  const { shouldReduceMotion, panelItemVariants } = useAuthPanelVariants();
  const [activeRole, setActiveRole] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = window.setInterval(() => setActiveRole((i) => (i + 1) % LOGIN_ROLES.length), 2600);
    return () => window.clearInterval(id);
  }, [shouldReduceMotion]);

  return (
    <ul className="space-y-[clamp(0.5rem,1.5vh,0.75rem)] max-w-md">
      {LOGIN_ROLES.map((role, i) => {
        const RoleIcon = role.icon;
        const active = activeRole === i;
        return (
          <motion.li
            key={role.id}
            variants={panelItemVariants}
            data-testid={`login-role-${role.id}`}
            data-active={active}
            className={`flex items-center gap-4 rounded-2xl border bg-slate-900 px-4 py-[clamp(0.5rem,1.6vh,0.875rem)] transition-colors duration-500 ${
              active ? 'border-[#1D4ED8]' : 'border-slate-800'
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                active ? 'bg-[#1D4ED8] text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <RoleIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-white">{role.label}</span>
              <span className="block text-xs text-slate-400">{role.text}</span>
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
};

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

  // Entrée : le panneau de gauche arrive élément par élément, puis le formulaire monte et
  // ses éléments suivent un par un. En mouvement réduit : simple fondu.
  const shouldReduceMotion = Boolean(useReducedMotion());
  const formVariants: Variants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.2, staggerChildren: 0.09 } },
  };
  const itemVariants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: SMOOTH_EASE } },
      };

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

      // Stocker l'utilisateur
      useAuthStore.getState().setUser(authData.user);

      // Si super_admin : accès direct à la Console Super Admin (style Sama Boutik)
      if (profile.role === 'super_admin') {
        useAuthStore.getState().setProfile(profile as UserProfile);
        logLoginSuccess(profile.email || authData.user.email || 'superadmin@ecosurv.mr', 'super_admin', {
          nom: `${profile.prenom} ${profile.nom}`,
        });
        useNavigationStore.getState().navigateToAdminConsole();
        return;
      }

      // Pour les autres rôles (directeur, caissier, enseignant, parent) :
      // charger et synchroniser l'établissement AVANT setProfile pour éviter toute redirection prématurée sans ecole
      if (profile.ecole_id) {
        const { data: ecoleData } = await supabase
          .from('ecoles')
          .select('id, nom, ville, adresse, telephone, email, annee_scolaire, statut_activation, statut_abonnement')
          .eq('id', profile.ecole_id)
          .maybeSingle();

        if (ecoleData) {
          useAuthStore.getState().setEcole(ecoleData);
          useEcoleStore.getState().updateEcole({
            id: ecoleData.id,
            nom: ecoleData.nom || '',
            ville: ecoleData.ville || '',
            adresse: ecoleData.adresse || '',
            telephone: ecoleData.telephone || '',
            email: ecoleData.email || '',
            annee_scolaire: ecoleData.annee_scolaire || '',
            statut_activation: ecoleData.statut_activation,
            statut_abonnement: ecoleData.statut_abonnement as any,
          });

          if (ecoleData.statut_activation !== 'active') {
            useAuthStore.getState().setProfile(profile as UserProfile);
            useNavigationStore.getState().navigateToPendingActivation();
            return;
          }
        }
      }

      useAuthStore.getState().setProfile(profile as UserProfile);

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
    <div
      data-testid="login-page"
      className="min-h-[100dvh] lg:grid lg:grid-cols-[5fr_6fr] font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#1D4ED8] selection:text-white"
    >
      {/* Panneau de gauche (grands écrans) : marque, promesse et les quatre accès */}
      <AuthAside
        heading={
          <>
            Un accès pour <span className="text-[#60A5FA]">chaque rôle</span> de votre école.
          </>
        }
        description="Accédez à la gestion de scolarité, caisse et suivi pédagogique."
        footer="Pensé pour les écoles en Mauritanie (MRU, +222)"
      >
        <LoginRoles />
      </AuthAside>

      {/* Panneau de droite : retour, langue, puis le formulaire de connexion */}
      <main className="flex min-h-[100dvh] flex-col bg-white dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 pt-6 sm:px-0">
          <button
            type="button"
            onClick={handleReturn}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer ${FOCUS_RING}`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour au site</span>
          </button>
          <LanguageSelector />
        </div>

        <motion.div
          data-testid="login-card"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8 sm:px-0"
        >
          <motion.div variants={itemVariants} className="mb-6 lg:hidden">
            <Logo height={30} />
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Connexion à votre espace
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Accédez à la gestion de scolarité, caisse et suivi pédagogique.
            </p>
          </motion.div>

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
            <motion.div variants={itemVariants} className="space-y-1.5">
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
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
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
                  className={`text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer rounded ${FOCUS_RING}`}
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
                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${FOCUS_RING}`}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] ${FOCUS_RING}`}
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
            </motion.div>

            {/* Inscription d'un nouvel établissement */}
            <motion.div variants={itemVariants} className="pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vous n'avez pas encore inscrit votre établissement ?{' '}
                <button
                  type="button"
                  onClick={() => useNavigationStore.getState().navigateToRegister()}
                  className={`text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer rounded ${FOCUS_RING}`}
                >
                  Créer mon école
                </button>
              </p>
            </motion.div>
          </form>

          {/* Help & Assistance */}
          <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
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
          </motion.div>
        </motion.div>

        {/* Pied de page */}
        <div className="px-5 pb-6 text-center text-[11px] text-slate-400 dark:text-slate-500 space-y-2">
          <LegalLinks className="!text-[11px]" />
          <div>&copy; {new Date().getFullYear()} EcoSurv</div>
        </div>
      </main>

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
