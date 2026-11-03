/**
 * Demande d'envoi du code d'activation d'une école.
 * Le code est généré, haché, enregistré et envoyé par e-mail uniquement côté serveur
 * (Edge Function 'send-activation-otp'). Le navigateur ne voit jamais le code.
 * La fonction identifie l'école et l'adresse e-mail à partir de la session : rien n'est envoyé dans le corps.
 */

import { supabase } from '../supabase';

export interface RequestActivationCodeResult {
  ok: boolean;
  /** Message affichable à l'utilisateur quand ok vaut false. */
  error?: string;
}

// Résultat du premier envoi (fait à l'inscription), lu par l'écran d'attente.
// Variable de module : ni stockage navigateur, ni code.
let initialSendError: string | null = null;

export function setInitialSendError(message: string | null): void {
  initialSendError = message;
}

export function peekInitialSendError(): string | null {
  return initialSendError;
}

export function clearInitialSendError(): void {
  initialSendError = null;
}

const SEND_FAILED_MESSAGE ="L'e-mail n'a pas pu être envoyé, réessayez dans quelques minutes.";

export async function requestActivationCode(): Promise<RequestActivationCodeResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-activation-otp', { body: {} });

    if (error) {
      console.warn('[requestActivationCode] Erreur Edge Function:', error.message);
      // Le statut 429 (limite horaire) a un message dédié renvoyé par la fonction dans le corps.
      const response = (error as { context?: Response }).context;
      if (response && typeof response.json === 'function') {
        try {
          const body = await response.json();
          if (response.status === 429 && typeof body?.error === 'string') {
            return { ok: false, error: body.error };
          }
        } catch {
          // corps illisible : message générique
        }
      }
      return { ok: false, error: SEND_FAILED_MESSAGE };
    }

    if (!data || data.ok !== true) {
      return { ok: false, error: SEND_FAILED_MESSAGE };
    }

    return { ok: true };
  } catch (err) {
    console.warn("[requestActivationCode] Exception réseau:", err);
    return { ok: false, error: SEND_FAILED_MESSAGE };
  }
}
