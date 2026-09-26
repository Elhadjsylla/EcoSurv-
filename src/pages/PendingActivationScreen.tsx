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
  generateOtp,
  hashOtp,
  sendActivationEmail,
} from '../lib/email/sendActivationEmail';
import type { UserRole } from '../components/ui/Header';

export const PendingActivationScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const ecole = useAuthStore((s) => s.ecole);

  // 6 cases de chiffres
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Compte à rebours anti-spam de 60 secondes pour le renvoi
  const [cooldown, setCooldown] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testCode, setTestCode] = useState<string | null>(() => sessionStorage.getItem('ecosurv_test_otp'));

  const emailDestinataire = ecole?.email || user?.email || profile?.email || '';
  const ecoleNom = ecole?.nom || 'Votre Établissement';
  const ecoleId = ecole?.id || profile?.ecole_id || '';
  const directeurNom = profile ? `${profile.prenom} ${profile.nom}` : 'Directeur';

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

  // Renvoi d'un nouveau code
  const handleResendCode = async (isSilent: boolean = false) => {
    if (!emailDestinataire || !ecoleId) {
      setErrorMessage("Informations d'établissement introuvables. Veuillez vous reconnecter.");
      return;
    }

    if (!isSilent && cooldown > 0) return;

    setIsResending(true);
    setErrorMessage(null);
    if (!isSilent) setSuccessMessage(null);

    try {
      const newOtp = generateOtp();
      const codeHash = await hashOtp(newOtp);

      // 1. Enregistrer dans Supabase via RPC ou insert direct
      let rpcSuccess = false;
      try {
        const { error: rpcError } = await supabase.rpc('enregistrer_code_activation', {
          p_ecole_id: ecoleId,
          p_email: emailDestinataire,
          p_code_hash: codeHash,
        });
        if (!rpcError) rpcSuccess = true;
      } catch (e) {
        console.warn('[PendingActivation] RPC non dispo, fallback table directe:', e);
      }

      if (!rpcSuccess) {
        // Fallback d'insertion directe
        await supabase
          .from('codes_activation')
          .update({ utilise: true })
          .eq('ecole_id', ecoleId)
          .eq('utilise', false);

        await supabase.from('codes_activation').insert([
          {
            ecole_id: ecoleId,
            email: emailDestinataire,
            code_hash: codeHash,
            expire_a: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            utilise: false,
          },
        ]);
      }

      // 2. Envoi par email via Resend
      const emailResult = await sendActivationEmail({
        to: emailDestinataire,
        nomDirecteur: directeurNom,
        nomEcole: ecoleNom,
        code: newOtp,
      });

      if (!emailResult.success) {
        console.warn('[Resend] Résultat envoi email:', emailResult.error);
        if (emailResult.code) {
          sessionStorage.setItem('ecosurv_test_otp', emailResult.code);
          setTestCode(emailResult.code);
        }
        if (!isSilent) {
          if (emailResult.isTestModeLimitation) {
            setSuccessMessage(
              `Mode test Resend (onboarding@resend.dev) : Nouveau code de vérification généré (${emailResult.code}).`
            );
          } else {
            setErrorMessage(
              `Email non envoyé via Resend (${emailResult.error}). En mode test, votre code est : ${newOtp}`
            );
          }
        }
      } else {
        sessionStorage.removeItem('ecosurv_test_otp');
        setTestCode(null);
        if (!isSilent) {
          setSuccessMessage(`✓ Un nouveau code de vérification a été expédié à ${emailDestinataire}.`);
        }
      }

      setCooldown(60);
      setCodeDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('[PendingActivation] Erreur renvoi code:', err);
      setErrorMessage(err?.message || "Impossible d'expédier le code d'activation.");
    } finally {
      setIsResending(false);
    }
  };

  // Validation du code OTP
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
      const codeHash = await hashOtp(code);

      // 1. Appel de la fonction de validation et auto-activation
      let result: any = null;

      try {
        const { data, error } = await supabase.rpc('verifier_et_activer_ecole_otp', {
          p_ecole_id: ecoleId,
          p_code_hash: codeHash,
        });

        if (!error && data) {
          result = data;
        } else if (error) {
          console.warn('[PendingActivation] Erreur RPC:', error);
        }
      } catch (e) {
        console.warn('[PendingActivation] RPC indisponible:', e);
      }

      // 2. Fallback direct si la RPC n'est pas encore créée en remote Supabase
      if (!result) {
        const { data: codeRow } = await supabase
          .from('codes_activation')
          .select('*')
          .eq('ecole_id', ecoleId)
          .eq('utilise', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!codeRow) {
          result = { succes: false, message: "Aucun code d'activation en attente." };
        } else if (new Date(codeRow.expire_a).getTime() < Date.now()) {
          result = { succes: false, message: 'Ce code a expiré. Veuillez en demander un nouveau.' };
        } else if (codeRow.code_hash !== codeHash) {
          result = { succes: false, message: 'Code de vérification incorrect.' };
        } else {
          // Activer directement
          await supabase.from('codes_activation').update({ utilise: true }).eq('id', codeRow.id);
          await supabase.from('ecoles').update({ statut_activation: 'active' }).eq('id', ecoleId);
          if (user) {
            await supabase.from('profils').update({ actif: true }).eq('id', user.id);
          }
          result = { succes: true };
        }
      }

      if (result && result.succes === true) {
        // Nettoyer le code de test temporaire
        sessionStorage.removeItem('ecosurv_test_otp');
        setTestCode(null);

        // SUCCÈS !
        setSuccessMessage('🎉 Code validé ! Votre établissement est activé avec succès.');
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
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
            ES
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block">
              EcoSurv Mauritanie
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">
              Activation Immédiate
            </span>
          </div>
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
                Un code à 6 chiffres a été envoyé à :<br />
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

          {/* Test Mode Helper (utile quand le domaine Resend n'est pas encore vérifié pour l'adresse testée) */}
          {testCode && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Mode test Resend (onboarding@resend.dev)
                </span>
                <span className="font-mono font-black text-sm px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 tracking-wider">
                  {testCode}
                </span>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                Resend envoie les vrais emails vers l'adresse du compte (<strong>elhadjsylla667@gmail.com</strong>). Pour cette adresse de test, voici le code généré :
              </p>
              <button
                type="button"
                onClick={() => {
                  const digits = testCode.split('').slice(0, 6);
                  setCodeDigits(digits);
                  handleVerifyCode(testCode);
                }}
                className="text-left font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>⚡ Cliquer ici pour remplir et valider automatiquement</span>
              </button>
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
                  onClick={() => handleResendCode(false)}
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
            <span>Code chiffré SHA-256 • Validité 15 minutes</span>
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
