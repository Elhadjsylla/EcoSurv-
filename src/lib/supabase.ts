import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ixjypwtxvgahzwqzxycv.supabase.co';
const DEFAULT_ANON_KEY = 'placeholder-anon-key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[EcoSurv Supabase] Attention: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquants dans l\'environnement. Mode résilient actif.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
