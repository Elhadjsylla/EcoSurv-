import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface ClasseEcole {
  id: string;
  ecole_id: string;
  nom: string;
  niveau: string | null;
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export const CLASSES_CHANGED_EVENT = 'ecosurv:classes-changed';

export function notifyClassesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLASSES_CHANGED_EVENT));
  }
}

/**
 * Charge les classes ACTIVES (actif = true) de l'école connectée depuis public.classes_ecole,
 * triées par ordre croissant puis par nom croissant.
 */
export function useClasses() {
  const ecoleId = useAuthStore((s) => s.profile?.ecole_id || s.ecole?.id || null);
  const [classes, setClasses] = useState<ClasseEcole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(ecoleId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!ecoleId) {
      setClasses([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('classes_ecole')
        .select('id, ecole_id, nom, niveau, ordre, actif, created_at, updated_at')
        .eq('ecole_id', ecoleId)
        .eq('actif', true)
        .order('ordre', { ascending: true })
        .order('nom', { ascending: true });

      if (queryError) {
        console.error(
          '[useClasses] Erreur chargement classes_ecole:',
          queryError.code,
          queryError.message,
          queryError.details
        );
        setError(queryError.message || "Impossible de charger les classes de l'école.");
        setClasses([]);
        return;
      }

      setClasses((data as ClasseEcole[]) || []);
    } catch (err: any) {
      console.error('[useClasses] Exception chargement classes_ecole:', err);
      setError(err?.message || "Erreur inattendue lors du chargement des classes.");
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [ecoleId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleClassesChanged = () => {
      reload();
    };
    window.addEventListener(CLASSES_CHANGED_EVENT, handleClassesChanged);
    return () => {
      window.removeEventListener(CLASSES_CHANGED_EVENT, handleClassesChanged);
    };
  }, [reload]);

  const nomsClasses = useMemo(() => classes.map((c) => c.nom), [classes]);

  return {
    classes,
    nomsClasses,
    isLoading,
    error,
    reload,
  };
}

