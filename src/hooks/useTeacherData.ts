import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface TeacherStudent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  date_naissance?: string | null;
  genre?: string | null;
  nom_tuteur?: string | null;
  telephone_tuteur?: string | null;
  email_tuteur?: string | null;
  adresse_tuteur?: string | null;
  lien_parente?: string | null;
  statut?: string | null;
}

export function useTeacherData() {
  const authProfile = useAuthStore((s) => s.profile);
  const [classes, setClasses] = useState<string[]>([]);
  const [eleves, setEleves] = useState<TeacherStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTeacherData = useCallback(async () => {
    if (!authProfile?.id || authProfile.role !== 'enseignant') {
      setClasses([]);
      setEleves([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Charger les classes affectées à l'enseignant dans son école
      const { data: affectationsData, error: affectationsError } = await supabase
        .from('affectations_enseignants')
        .select('classe')
        .eq('enseignant_id', authProfile.id)
        .eq('ecole_id', authProfile.ecole_id)
        .order('classe', { ascending: true });

      if (affectationsError) {
        console.error('[useTeacherData] Erreur affectations_enseignants:', affectationsError);
        setErrorMessage("Impossible de charger les classes affectées.");
        setClasses([]);
        setEleves([]);
        return;
      }

      const assignedClasses = Array.from(
        new Set((affectationsData || []).map((a) => a.classe).filter(Boolean))
      );
      setClasses(assignedClasses);

      if (assignedClasses.length === 0) {
        setEleves([]);
        return;
      }

      // 2. Charger les élèves réels de ces classes (la RLS vérifie l'accès)
      const { data: elevesData, error: elevesError } = await supabase
        .from('eleves')
        .select(`
          id,
          matricule,
          nom,
          prenom,
          classe,
          date_naissance,
          genre,
          nom_tuteur,
          telephone_tuteur,
          email_tuteur,
          adresse_tuteur,
          lien_parente,
          statut
        `)
        .eq('ecole_id', authProfile.ecole_id)
        .in('classe', assignedClasses)
        .order('nom', { ascending: true })
        .order('prenom', { ascending: true });

      if (elevesError) {
        console.error('[useTeacherData] Erreur chargement eleves:', elevesError);
        setErrorMessage("Impossible de charger les élèves de vos classes.");
        setEleves([]);
        return;
      }

      setEleves((elevesData as TeacherStudent[]) || []);
    } catch (err) {
      console.error('[useTeacherData] Erreur inattendue:', err);
      setErrorMessage("Une erreur est survenue lors de la récupération des données.");
      setClasses([]);
      setEleves([]);
    } finally {
      setIsLoading(false);
    }
  }, [authProfile?.id, authProfile?.ecole_id, authProfile?.role]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  return {
    classes,
    eleves,
    isLoading,
    errorMessage,
    refetch: fetchTeacherData,
  };
}
