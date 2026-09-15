import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { MembrePersonnel } from '../types/domain';
import { groupBy } from './aggregations';
import { fetchAll } from './fetchAll';
import { useSession } from './useSession';

/** Personnel de l'école (hors parents) avec les classes des enseignants. Directeur uniquement. */
export function useMembresPersonnel() {
  const { userId, profile, ecoleId } = useSession();

  return useQuery({
    queryKey: [userId, 'personnel', ecoleId],
    enabled: !!ecoleId && profile.role === 'directeur',
    queryFn: async (): Promise<MembrePersonnel[]> => {
      const [membres, affectations] = await Promise.all([
        fetchAll((from, to) =>
          supabase
            .from('profils')
            .select('id, nom, prenom, email, telephone, role, actif, created_at')
            .eq('ecole_id', ecoleId!)
            .neq('role', 'parent')
            .order('nom')
            .order('id')
            .range(from, to)
        ),
        fetchAll((from, to) =>
          supabase
            .from('affectations_enseignants')
            .select('id, enseignant_id, classe')
            .eq('ecole_id', ecoleId!)
            .order('classe')
            .order('id')
            .range(from, to)
        ),
      ]);

      const classesParEnseignant = groupBy(affectations, (a) => a.enseignant_id);
      return membres.map((m) => ({
        ...m,
        classes: [...new Set((classesParEnseignant.get(m.id) ?? []).map((a) => a.classe))],
      }));
    },
  });
}
