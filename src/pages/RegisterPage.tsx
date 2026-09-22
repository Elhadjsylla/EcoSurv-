import React, { useState, useRef } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Users,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore, UserProfile, EcoleInfo } from '../store/useAuthStore';
import { useEcoleStore } from '../store/useEcoleStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { Select } from '../components/ui/Select';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import type { UserRole } from '../components/ui/Header';

interface RegisterPageProps {
  onReturnToLanding?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onReturnToLanding,
  onNavigateToLogin,
}) => {
  const [nomEcole, setNomEcole] = useState('');
  const [ville, setVille] = useState('');
  const [nomResponsable, setNomResponsable] = useState('');
  const [prenomResponsable, setPrenomResponsable] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [effectifApprox, setEffectifApprox] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleReturn = () => {
    if (onReturnToLanding) {
      onReturnToLanding();
    } else {
      useNavigationStore.getState().setViewMode('landing');
    }
  };

  const handleGoToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      useNavigationStore.getState().navigateToLogin();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validation des champs obligatoires
    if (!nomEcole.trim()) {
      setError("Veuillez renseigner le nom de l'établissement.");
      return;
    }
    if (!ville.trim()) {
      setError('Veuillez renseigner la ville ou le quartier.');
      return;
    }
    if (!nomResponsable.trim() || !prenomResponsable.trim()) {
      setError('Veuillez renseigner le nom et le prénom du responsable.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!telephone.trim()) {
      setError('Veuillez renseigner un numéro de téléphone / WhatsApp.');
      return;
    }
    if (!password) {
      setError('Veuillez renseigner un mot de passe.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    // Validation des limites de taille (spécifications backend trigger inscrire_ecole_depuis_compte)
    if (nomEcole.trim().length > 150) {
      setError("Le nom de l'établissement ne peut pas dépasser 150 caractères.");
      return;
    }
    if (nomResponsable.trim().length > 100) {
      setError("Le nom du responsable ne peut pas dépasser 100 caractères.");
      return;
    }
    if (prenomResponsable.trim().length > 100) {
      setError("Le prénom du responsable ne peut pas dépasser 100 caractères.");
      return;
    }
    if (ville.trim().length > 100) {
      setError("La ville ou quartier ne peut pas dépasser 100 caractères.");
      return;
    }
    if (telephone.trim().length > 30) {
      setError("Le numéro de téléphone / WhatsApp ne peut pas dépasser 30 caractères.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Inscription Auth Supabase avec métadonnées complètes pour le trigger inscrire_ecole_depuis_compte
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            type_inscription: 'ecole',
            nom_ecole: nomEcole.trim(),
            nom: nomResponsable.trim(),
            prenom: prenomResponsable.trim(),
            telephone: telephone.trim(),
            ville: ville.trim(),
            effectif: effectifApprox || undefined,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      // Si Supabase Auth renvoie une erreur : arrêt immédiat, affichage de l'erreur, JAMAIS de redirection vers le succès
      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          setError('Un compte existe déjà avec cette adresse email. Veuillez vous connecter.');
        } else if (msg.includes('api key') || msg.includes('invalid api key')) {
          setError("Erreur d'authentification Supabase : clé API anon invalide ou non configurée en local. Vérifiez VITE_SUPABASE_ANON_KEY.");
        } else if (msg.includes('rate limit')) {
          setError("Trop de tentatives d'inscription. Veuillez patienter quelques minutes avant de réessayer.");
        } else if (msg.includes('database error saving new user')) {
          setError("Erreur backend lors de l'enregistrement de l'école (vérifiez les informations renseignées).");
        } else {
          setError(signUpError.message || "Erreur lors de l'enregistrement de l'école.");
        }
        setSubmitting(false);
        return;
      }

      if (!signUpData?.user) {
        setError("Erreur : aucun compte utilisateur n'a été retourné par Supabase. Veuillez réessayer.");
        setSubmitting(false);
        return;
      }

      // Détection Supabase: si un compte existe déjà, Supabase renvoie identities: [] sans erreur explicite.
      // Dans ce cas, aucun compte ni école n'a été créé par le trigger.
      if (signUpData.user.identities && signUpData.user.identities.length === 0) {
        setError("Un compte existe déjà avec cette adresse email (" + email.trim() + "). Veuillez vous connecter ou utiliser une autre adresse.");
        setSubmitting(false);
        return;
      }

      // 2. Connexion immédiate pour obtenir une session active si confirmation auto
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      const activeUser = signInData?.user || signUpData.user;

      // 3. Récupération du statut d'accès calculé par la RPC backend ou via requête profil
      let ecoleId: string | null = null;
      let statutActivation: 'en_attente' | 'active' | 'suspendue' = 'en_attente';
      let nomEnregistre = nomEcole.trim();

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('mon_statut_acces');
        if (!rpcError && rpcData && rpcData.length > 0) {
          const row = rpcData[0];
          if (row.ecole_id) ecoleId = row.ecole_id;
          if (row.statut_activation) statutActivation = row.statut_activation;
          if (row.ecole_nom) nomEnregistre = row.ecole_nom;
        }
      } catch (rpcErr) {
        console.warn('[EcoSurv Inscription] RPC mon_statut_acces:', rpcErr);
      }

      // Fallback consultation du profil créé par le trigger si la RPC n'était pas disponible
      if (!ecoleId && activeUser.id) {
        try {
          const { data: profileRow } = await supabase
            .from('profils')
            .select('ecole_id, role, nom, prenom')
            .eq('id', activeUser.id)
            .maybeSingle();

          if (profileRow?.ecole_id) {
            ecoleId = profileRow.ecole_id;
            const { data: ecoleRow } = await supabase
              .from('ecoles')
              .select('id, nom, statut_activation')
              .eq('id', profileRow.ecole_id)
              .maybeSingle();
            if (ecoleRow?.nom) nomEnregistre = ecoleRow.nom;
            if (ecoleRow?.statut_activation) statutActivation = ecoleRow.statut_activation;
          }
        } catch (fetchErr) {
          console.warn('[EcoSurv Inscription] Consultation profil/école:', fetchErr);
        }
      }

      // 4. Initialisation du profil et de l'école dans le store pour l'écran d'attente
      const profile: UserProfile = {
        id: activeUser.id,
        ecole_id: ecoleId || `ecole-${activeUser.id.slice(0, 8)}`,
        nom: nomResponsable.trim(),
        prenom: prenomResponsable.trim(),
        telephone: telephone.trim(),
        role: 'directeur' as UserRole,
        actif: true,
      };

      const ecoleInfo: EcoleInfo = {
        id: ecoleId || `ecole-${activeUser.id.slice(0, 8)}`,
        nom: nomEnregistre,
        ville: ville.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        statut_activation: statutActivation,
        statut_abonnement: 'essai',
      };

      useAuthStore.getState().setUser(activeUser);
      useAuthStore.getState().setProfile(profile);
      useAuthStore.getState().setEcole(ecoleInfo);

      // Synchroniser useEcoleStore avec les vraies données de l'école créée
      useEcoleStore.getState().updateEcole({
        id: ecoleId || `ecole-${activeUser.id.slice(0, 8)}`,
        nom: nomEnregistre,
        ville: ville.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        statut_activation: 'en_attente',
        code_ecole: nomEnregistre.slice(0, 4).toUpperCase(),
      });

      // 5. Redirection vers l'écran en attente d'activation : seul le Super Admin peut valider
      useNavigationStore.getState().navigateToPendingActivation();
    } catch (err: any) {
      console.error('[EcoSurv Inscription] Erreur inattendue:', err);
      setError(err?.message || "Une erreur est survenue lors de l'inscription.");
      setSubmitting(false);
    }
  };

  const TRANCHE_OPTIONS = [
    { value: '', label: "Sélectionnez une tranche d'élèves" },
    { value: 'moins_150', label: 'Moins de 150 élèves' },
    { value: '150_350', label: '150 à 350 élèves' },
    { value: '350_700', label: '350 à 700 élèves' },
    { value: 'plus_700', label: 'Plus de 700 élèves' },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Bar with Return Button & Brand */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour au site</span>
        </button>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button
            type="button"
            onClick={handleGoToLogin}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Déjà un compte ? Se connecter
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
            ES
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-2xl mx-auto my-auto py-8">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Créer mon école sur EcoSurv</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Digitalisez la gestion de votre établissement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Renseignez les informations de votre école. Votre espace Directeur sera créé immédiatement en attente d'activation.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-9 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-scale-in"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1 : Établissement */}
            <div className="space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>1. Informations sur l'école</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-nom-ecole"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Nom de l'école <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-nom-ecole"
                      type="text"
                      required
                      value={nomEcole}
                      disabled={submitting}
                      onChange={(e) => setNomEcole(e.target.value)}
                      placeholder="Ex: Complexe Scolaire Al-Hikma"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-ville"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Ville / Quartier <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-ville"
                      type="text"
                      required
                      value={ville}
                      disabled={submitting}
                      onChange={(e) => setVille(e.target.value)}
                      placeholder="Ex: Nouakchott — Tevragh-Zeina"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Effectif approximatif d'élèves (Optionnel) */}
              <div className="space-y-1.5">
                <Select
                  id="reg-effectif"
                  label="Effectif approximatif d'élèves"
                  options={TRANCHE_OPTIONS}
                  value={effectifApprox}
                  onChange={(val) => setEffectifApprox(val)}
                  disabled={submitting}
                  icon={<Users className="h-4 w-4" />}
                  placeholder="Sélectionnez une tranche d'élèves"
                  className="w-full"
                  triggerClassName="w-full h-11 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-sm rounded-xl"
                />
              </div>
            </div>

            {/* Section 2 : Responsable & Coordonnées */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>2. Responsable de l'établissement</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-prenom"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Prénom du responsable <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-prenom"
                    type="text"
                    required
                    value={prenomResponsable}
                    disabled={submitting}
                    onChange={(e) => setPrenomResponsable(e.target.value)}
                    placeholder="Ex: Mamadou"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-nom"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Nom de famille <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-nom"
                    type="text"
                    required
                    value={nomResponsable}
                    disabled={submitting}
                    onChange={(e) => setNomResponsable(e.target.value)}
                    placeholder="Ex: Diallo"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Email professionnel <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      disabled={submitting}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="direction@ecole.mr"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-tel"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Téléphone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-tel"
                      type="tel"
                      required
                      value={telephone}
                      disabled={submitting}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="+222 46 00 00 00"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 : Mot de passe */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>3. Sécurité du compte Directeur</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-pwd"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={passwordRef}
                      id="reg-pwd"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      disabled={submitting}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-pwd-confirm"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Confirmer le mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-pwd-confirm"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={passwordConfirm}
                      disabled={submitting}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm((v) => !v)}
                      aria-label={showPasswordConfirm ? 'Masquer' : 'Afficher'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Création de votre école en cours…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Créer mon école & accéder à l'espace</span>
                  </>
                )}
              </button>
            </div>

            {/* Note sur la conformité & activation */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                <span>Processus de vérification institutionnelle</span>
              </div>
              <p>
                Dès validation de votre inscription, votre école sera enregistrée et placée en attente d'activation. Nos équipes basées à Nouakchott confirment l'établissement sous 2 à 4h ouvrées.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} EcoSurv Mauritanie &bull; Plateforme agréée de gestion scolaire
      </div>
    </div>
  );
};
