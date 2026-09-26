/**
 * Service d'envoi d'email transactionnel via Supabase Edge Function
 * Délègue l'appel à Resend au serveur pour ne jamais exposer la clé API au client.
 */

import { supabase } from '../supabase';

/**
 * Calcule le hash SHA-256 d'un code OTP (Web Crypto standard)
 */
export async function hashOtp(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère un code OTP aléatoire à 6 chiffres
 */
export function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (100000 + (array[0] % 900000)).toString();
  return code;
}

interface SendActivationEmailParams {
  to: string;
  nomDirecteur?: string;
  nomEcole: string;
  code: string;
}

export interface SendActivationEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isTestModeLimitation?: boolean;
  code?: string;
}

/**
 * Envoie le code d'activation via la Supabase Edge Function 'send-activation-otp'
 * La clé Resend est stockée et exécutée uniquement sur le serveur.
 */
export async function sendActivationEmail({
  to,
  nomDirecteur,
  nomEcole,
  code,
}: SendActivationEmailParams): Promise<SendActivationEmailResult> {
  const cleanEmail = to.trim();

  try {
    const { data, error } = await supabase.functions.invoke('send-activation-otp', {
      body: {
        to: cleanEmail,
        nomDirecteur,
        nomEcole,
        code,
      },
    });

    if (error) {
      console.warn('[sendActivationEmail] Erreur Edge Function:', error);
      return {
        success: false,
        code,
        error: error.message || "Échec de l'envoi de l'email via la fonction serveur.",
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        code,
        isTestModeLimitation: Boolean(data?.isTestModeLimitation),
        error: data?.error || "Impossible d'expédier le code d'activation.",
      };
    }

    return {
      success: true,
      messageId: data.messageId,
      code,
    };
  } catch (err: any) {
    console.error('[sendActivationEmail] Exception réseau lors de l\'appel serveur:', err);
    return {
      success: false,
      code,
      error: err?.message || "Erreur de communication avec le serveur d'envoi.",
    };
  }
}
