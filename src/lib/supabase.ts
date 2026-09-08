import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[EcoSurv Supabase] Attention: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquants dans .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
