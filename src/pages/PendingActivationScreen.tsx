import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Mail,
  ArrowRight,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useEcoleStore } from '../store/useEcoleStore';
import {
  clearInitialSendError,
  peekInitialSendError,
  requestActivationCode,
} from '../lib/email/sendActivationEmail';
import { Logo } from '../components/ui/Logo';
import type { UserRole } from '../components/ui/Header';

export const PendingActivationScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const ecole = useAuthStore((s) => s.ecole);

  // 6 cases de chiffres
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Résultat du premier envoi, fait à l'inscription : null si l'envoi a réussi ou n'a pas eu lieu ici.
  const [initialSendError] = useState<string | null>(() => peekInitialSendError());
  const [codeSent, setCodeSent] = useState<boolean>(initialSendError === null);

  // Délai avant de pouvoir renvoyer : 60 s après un envoi réussi, 30 s après un échec
  const [cooldown, setCooldown] = useState<number>(initialSendError ? 30 : 60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialSendError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Le code part toujours vers l'adresse du compte connecté (décidé par le serveur)
  const emailDestinataire = user?.email || profile?.email || ecole?.email || '';
  const ecoleNom = ecole?.nom || 'Votre Établissement';
  const ecoleId = ecole?.id || profile?.ecole_id || '';

  // Le message du premier envoi est affiché une fois : on le retire du module
  useEffect(() => {
    clearInitialSendError();
  }, []);

  // Gestion du compte à rebours
  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus sur la première case au chargement
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Le code OTP est généré et expédié une seule fois lors de la soumission du formulaire d'inscription.
  // Les renvois éventuels sont déclenchés uniquement par action explicite de l'utilisateur sur le bouton de renvoi.

  // Gestion de la saisie d'un chiffre
  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage(null);
    const cleaned = value.replace(/[^0-9]/g, '');

    if (!cleaned) {
      const nextDigits = [...codeDigits];
      nextDigits[index] = '';
      setCodeDigits(nextDigits);
      return;
    }

    // Si l'utilisateur a tapé ou collé un seul chiffre
    const char = cleaned.slice(-1);
    const nextDigits = [...codeDigits];
    nextDigits[index] = char;
    setCodeDigits(nextDigits);

    // Déplacer automatiquement le focus vers la case suivante
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si les 6 cases sont remplies, déclencher automatiquement la vérification
    const fullCode = nextDigits.join('');
    if (fullCode.length === 6 && !nextDigits.includes('')) {
      handleVerifyCode(fullCode);
    }
  };

  // Gestion de la touche Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Gestion du collage (Paste) du code complet
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...codeDigits];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setCodeDigits(nextDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyCode(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  // Renvoi d'un nouveau code : le serveur le génère, l'enregistre et l'envoie. Le navigateur ne le voit jamais.
  const handleResendCode = async () => {
    if (!user || !ecoleId) {
      setErrorMessage("Informations d'établissement introuvables. Veuillez vous reconnecter.");
      return;
    }

    if (cooldown > 0) return;

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await requestActivationCode();

      if (!result.ok) {
        setCodeSent(false);
        setErrorMessage(result.error || "L'e-mail n'a pas pu être envoyé, réessayez dans quelques minutes.");
        setCooldown(30);
      } else {
        setCodeSent(true);
        setSuccessMessage(`Un nouveau code de vérification a été envoyé à ${emailDestinataire}.`);
        setCooldown(60);
      }

      setCodeDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('[PendingActivation] Erreur renvoi code:', err);
      setErrorMessage("L'e-mail n'a pas pu être envoyé, réessayez dans quelques minutes.");
      setCooldown(30);
    } finally {
      setIsResending(false);
    }
  };

  // Validation du code : le hash est calculé et comparé côté serveur par la fonction verifier_code_activation
  const handleVerifyCode = async (explicitCode?: string) => {
    const code = explicitCode || codeDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Veuillez saisir les 6 chiffres du code.');
      return;
    }

    if (!ecoleId) {
      setErrorMessage('Établissement non identifié. Veuillez vous reconnecter.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      let result: { succes?: boolean; message?: string } | null = null;

      const { data, error } = await supabase.rpc('verifier_code_activation', { p_code: code });
      if (error) {
        console.warn('[PendingActivation] Erreur RPC verifier_code_activation:', error.message);
        result = { succes: false, message: 'La vérification est momentanément indisponible. Réessayez dans quelques instants.' };
      } else {
        result = data as { succes?: boolean; message?: string } | null;
      }

      if (result && result.succes === true) {
        // SUCCÈS !
        setSuccessMessage('Code validé. Votre établissement est activé.');
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignorer
        }

        // 3. Mise à jour des stores locaux
        if (ecole) {
          useAuthStore.getState().setEcole({ ...ecole, statut_activation: 'active' });
          useEcoleStore.getState().updateEcole({ statut_activation: 'active' });
        }

        // 4. Redirection automatique immédiate vers le Dashboard Directeur
        setTimeout(() => {
          const role = (profile?.role || 'directeur') as UserRole;
          useNavigationStore.getState().setUserRole(role);
          useNavigationStore.getState().launchAppWithPortal(role);
        }, 800);
      } else {
        setErrorMessage(result?.message || 'Code de vérification incorrect ou expiré.');
        // Réinitialiser les cases pour retaper
        setCodeDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      console.error('[PendingActivation] Erreur validation code:', err);
      setErrorMessage(err?.message || 'Erreur lors de la vérification du code.');
    } finally {
      setIsVerifying(false);
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Logo height={28} />
          <span className="text-[10px] text-slate-400 font-semibold block">
            Activation Immédiate
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 relative overflow-hidden">
          {/* Header Icon */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-inner">
              <Mail className="h-7 w-7 animate-bounce-subtle" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Vérifiez votre boîte email
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {codeSent ? 'Un code à 6 chiffres a été envoyé à :' : "Le code n'a pas pu être envoyé à :"}<br />
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {emailDestinataire || 'votre adresse email'}
                </strong>
              </p>
            </div>
          </div>

          {/* School Badge Pill */}
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="truncate font-semibold">{ecoleNom}</span>
          </div>

          {!user && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>Session requise : Pour activer votre établissement, connectez-vous avec les identifiants créés lors de l'inscription.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  useNavigationStore.getState().setViewMode('login');
                  window.history.pushState(null, '', '/login');
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-center block transition-colors"
              >
                Se connecter pour activer →
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* 6-Digit OTP Input Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isVerifying}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                />
              ))}
            </div>

            <p className="text-[11px] text-center text-slate-400 font-medium">
              Saisissez ou collez directement le code à 6 chiffres reçu
            </p>
          </div>

          {/* Action Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleVerifyCode()}
              disabled={isVerifying || codeDigits.includes('')}
              className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Activation en cours...</span>
                </>
              ) : (
                <>
                  <span>Activer et Ouvrir mon École</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Resend Link with Cooldown */}
            <div className="flex items-center justify-center pt-2">
              {cooldown > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Renvoyer un code dans <strong>{cooldown}s</strong></span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleResendCode()}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Envoi en cours...' : 'Renvoyer un nouveau code'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Security Banner */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Code valable 15 minutes</span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-slate-400">
        Besoin d'aide ? Contactez l'assistance EcoSurv Mauritanie.
      </div>
    </div>
  );
};
