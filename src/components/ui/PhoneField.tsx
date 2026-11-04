import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  isValidMauritanianPhone,
  isPhoneValueUnchanged,
  stripTypedCountryCode,
  toLocalInputValue,
  PHONE_INVALID_MESSAGE,
  PHONE_REQUIRED_MESSAGE,
} from '../../lib/phone';

export interface PhoneFieldProps {
  /** Valeur du formulaire : les 8 chiffres (avec ou sans espaces), ou un ancien numéro tel que chargé. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** Numéro chargé depuis la base : s'il n'est pas modifié, il n'est ni validé ni reformaté. */
  originalValue?: string;
  /** Erreur venant du formulaire (par exemple à l'envoi). */
  error?: string | null;
  size?: 'sm' | 'md';
  /** 'default' : style des formulaires du tableau de bord ; 'soft' : style de la page d'inscription. */
  tone?: 'default' | 'soft';
  placeholder?: string;
  className?: string;
}

/**
 * Champ téléphone mauritanien : « +222 » est un préfixe visuel fixe, l'utilisateur tape ou colle
 * ses 8 chiffres. Un « +222 », « 00222 » ou « 222 » collé en tête est reconnu sans doublon.
 * L'erreur s'affiche à la sortie du champ, jamais pendant la frappe.
 */
export const PhoneField: React.FC<PhoneFieldProps> = ({
  value,
  onChange,
  id,
  disabled = false,
  required = false,
  originalValue,
  error,
  size = 'sm',
  tone = 'default',
  placeholder = '22 11 33 44',
  className,
}) => {
  const [blurError, setBlurError] = useState<string | null>(null);

  const unchanged = Boolean(originalValue) && isPhoneValueUnchanged(value, originalValue || '');
  // Ancien numéro qui n'est pas un numéro mauritanien valide : affiché tel quel, sans préfixe trompeur.
  const legacyForeign = unchanged && !isValidMauritanianPhone(originalValue || '');

  // Pas de regroupement pendant la frappe : il n'est appliqué qu'à la sortie du champ.
  const shown = legacyForeign ? value : stripTypedCountryCode(value);
  const message = error || blurError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(stripTypedCountryCode(e.target.value));
    if (blurError) setBlurError(null);
  };

  const handleBlur = () => {
    const raw = value.trim();
    if (unchanged) return;
    if (!raw) {
      if (required) setBlurError(PHONE_REQUIRED_MESSAGE);
      return;
    }
    if (isValidMauritanianPhone(raw)) {
      onChange(toLocalInputValue(raw));
    } else {
      setBlurError(PHONE_INVALID_MESSAGE);
    }
  };

  const sizeBox = size === 'md' ? 'h-11 text-sm' : 'h-9 text-xs';
  const toneBox =
    tone === 'soft'
      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus-within:ring-2 focus-within:ring-blue-600/30 focus-within:border-blue-600 dark:focus-within:border-blue-500'
      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-600';

  return (
    <div className={className}>
      <div
        className={cn(
          'flex items-stretch overflow-hidden rounded-lg border transition-colors',
          size === 'md' && 'rounded-xl',
          sizeBox,
          toneBox,
          message && 'border-red-400 dark:border-red-700',
          disabled && 'opacity-50'
        )}
      >
        {!legacyForeign && (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center border-r border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/60 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300 select-none"
          >
            +222
          </span>
        )}
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          disabled={disabled}
          value={shown}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label={id ? undefined : 'Numéro de téléphone (8 chiffres après +222)'}
          aria-invalid={message ? true : undefined}
          placeholder={legacyForeign ? undefined : placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />
      </div>
      {message && (
        <p className="mt-1 flex items-start gap-1 text-[11px] text-red-600 dark:text-red-400">
          <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" /> <span>{message}</span>
        </p>
      )}
    </div>
  );
};
