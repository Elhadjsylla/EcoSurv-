import React, { useId, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, GraduationCap, Info, Lock, LogIn, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const signIn = useAuthStore((s) => s.signIn);
  const notice = useAuthStore((s) => s.notice);

  const [email, setEmail] = useState('');
  // Le mot de passe ne vit que dans ce champ contrôlé : jamais journalisé, jamais stocké ailleurs.
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      setError('Renseignez votre email et votre mot de passe.');
      return;
    }

    setError(null);
    setSubmitting(true);
    const message = await signIn(email, password);
    setPassword('');

    if (message) {
      setError(message);
      setSubmitting(false);
      passwordRef.current?.focus();
    }
    // En cas de succès, l'écran est remplacé dès que la session et le profil sont chargés.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-slate-100 antialiased">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Connexion à EcoSurv</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Accédez à l'espace de votre établissement.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5"
        >
          {notice && !error && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs font-medium text-blue-800 dark:text-blue-300"
            >
              <Info className="h-4 w-4 shrink-0 mt-px" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div
              id={errorId}
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={emailId}
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                autoFocus
                required
                value={email}
                disabled={submitting}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                placeholder="nom@etablissement.mr"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={passwordId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={passwordRef}
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                disabled={submitting}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={submitting}
            loadingText="Connexion en cours…"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>

          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
            Mot de passe oublié ? Contactez la direction de votre établissement.
          </p>
        </form>
      </div>
    </div>
  );
};
