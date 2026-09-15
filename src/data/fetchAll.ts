import type { PostgrestError } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;

/**
 * Lit toutes les lignes d'une requête, page par page.
 *
 * PostgREST plafonne chaque réponse (1 000 lignes par défaut) sans signaler
 * de troncature : une école de plusieurs centaines d'élèves dépasse vite ce
 * seuil en échéances. La requête doit avoir un ordre stable (terminer par
 * `.order('id')`) pour que les pages ne se chevauchent pas.
 */
export async function fetchAll<T>(page: (from: number, to: number) => PageResult<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

/** Lève l'erreur PostgREST éventuelle et renvoie les données. */
export function unwrap<T>(result: { data: T; error: PostgrestError | null }): T {
  if (result.error) throw result.error;
  return result.data;
}
