import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/** Rôle porté par une clé au format JWT (anciennes clés Supabase), sinon null. */
function roleDeLaCle(key: string): string | null {
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

function verifierConfiguration(): string | null {
  if (!/^https:\/\/\S+$/.test(supabaseUrl)) {
    return 'VITE_SUPABASE_URL est absente ou invalide dans .env.local.';
  }
  if (!supabaseAnonKey || supabaseAnonKey.startsWith('your') || supabaseAnonKey.length < 30) {
    return 'VITE_SUPABASE_ANON_KEY est absente ou contient encore une valeur d’exemple dans .env.local.';
  }
  // SECURITY_RULES.md §3 : une clé qui contourne la RLS ne doit jamais atteindre le navigateur.
  if (supabaseAnonKey.startsWith('sb_secret_') || roleDeLaCle(supabaseAnonKey) === 'service_role') {
    return 'La clé configurée est une clé de service (service_role) : elle est refusée côté navigateur. Utilisez la clé anon / publishable.';
  }
  return null;
}

/** Message d'erreur de configuration, ou null si le client peut être utilisé. */
export const supabaseConfigError = verifierConfiguration();

// Sans configuration valide, le client est créé sur une adresse neutre et
// l'application affiche l'écran d'erreur de configuration avant tout appel.
export const supabase = createClient<Database>(
  supabaseConfigError ? 'https://configuration-manquante.invalid' : supabaseUrl,
  supabaseConfigError ? 'configuration-manquante' : supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Aucun flux OAuth ni lien magique : rien à lire dans l'URL.
      detectSessionInUrl: false,
      storageKey: 'ecosurv-auth',
    },
  }
);
