import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { CURRENT_PARENT, MOCK_PARENT_ENFANTS_DETAILS } from '../lib/mockData';

export interface ParentChild {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  matricule: string;
  lien: string;
  total_due: number;
  total_paid: number;
  remaining: number;
  statut: string;
  photo_initiales: string;
}

export function useParentChildren(selectedChildId: string, onSelectChild: (id: string) => void) {
  const authProfile = useAuthStore((s) => s.profile);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    // Si compte parent réel authentifié en base
    if (authProfile?.id && authProfile.role === 'parent') {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // 1. Charger les liaisons et données d'état civil des élèves rattachés (colonnes réelles)
        const { data: linksData, error: linksError } = await supabase
          .from('parents_eleves')
          .select(`
            eleve_id,
            lien,
            eleves (
              id,
              nom,
              prenom,
              classe,
              matricule
            )
          `)
          .eq('parent_id', authProfile.id);

        if (linksError) {
          console.error('[useParentChildren] Erreur requête parents_eleves:', linksError);
          setErrorMessage(
            "Impossible de charger les informations de vos enfants. Veuillez vérifier votre connexion ou contacter l'établissement."
          );
          setChildren([]);
          return;
        }

        // Cas 1 : Aucun enfant rattaché (état vide normal, pas une erreur)
        if (!linksData || linksData.length === 0) {
          setErrorMessage(null);
          setChildren([]);
          return;
        }

        // Cas 2 : Des élèves existent, on charge leurs échéances réelles
        const eleveIds = linksData
          .map((row: any) => row.eleve_id)
          .filter(Boolean);

        let echeancesData: any[] = [];
        if (eleveIds.length > 0) {
          const { data: echData, error: echError } = await supabase
            .from('echeances')
            .select('id, eleve_id, montant, montant_paye, statut')
            .in('eleve_id', eleveIds);

          if (echError) {
            console.warn('[useParentChildren] Note chargement echeances:', echError);
          } else if (echData) {
            echeancesData = echData;
          }
        }

        const mapped: ParentChild[] = linksData
          .filter((row: any) => row.eleves)
          .map((row: any) => {
            const el = row.eleves;
            const initials = `${(el.prenom || '')[0] || ''}${(el.nom || '')[0] || ''}`.toUpperCase();
            const studentEch = echeancesData.filter((ech) => ech.eleve_id === el.id);

            const totalDue = studentEch.reduce((sum, ech) => sum + Number(ech.montant || 0), 0);
            const totalPaid = studentEch.reduce((sum, ech) => sum + Number(ech.montant_paye || 0), 0);
            const remaining = Math.max(0, totalDue - totalPaid);
            const hasOverdue = studentEch.some((ech) => ech.statut === 'en_retard');
            const statut = hasOverdue
              ? 'en_retard'
              : (totalDue > 0 && remaining === 0
                ? 'a_jour'
                : (totalPaid > 0 ? 'partiel' : 'a_jour'));

            return {
              id: el.id,
              nom: el.nom,
              prenom: el.prenom,
              classe: el.classe || 'Générale',
              matricule: el.matricule || 'ECO',
              lien: row.lien || 'tuteur',
              total_due: totalDue,
              total_paid: totalPaid,
              remaining: remaining,
              statut: statut,
              photo_initiales: initials,
            };
          });

        setErrorMessage(null);
        setChildren(mapped);

        // Si aucun enfant sélectionné ou sélection invalide, choisir le premier
        if (!selectedChildId || !mapped.some((c) => c.id === selectedChildId)) {
          if (mapped[0]) {
            onSelectChild(mapped[0].id);
          }
        }
      } catch (err: any) {
        console.error('[useParentChildren] Erreur inattendue:', err);
        setErrorMessage(
          "Impossible de charger les informations de vos enfants. Veuillez réessayer plus tard ou contacter l'établissement."
        );
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Démo / simulateur
      setErrorMessage(null);
      const demoChildren: ParentChild[] = CURRENT_PARENT.enfants_ids.map((id) => {
        const item = MOCK_PARENT_ENFANTS_DETAILS[id] || {
          prenom: 'Enfant',
          nom: 'Démo',
          classe: 'Classe',
          matricule: 'DEMO',
          reste_a_payer: 0,
          montant_annuel: 0,
          montant_deja_paye: 0,
          photo_initiales: 'ED',
        };
        return {
          id: id,
          nom: item.nom || 'SOW',
          prenom: item.prenom || 'Enfant',
          classe: item.classe,
          matricule: item.matricule,
          lien: 'parent',
          total_due: item.total_scolarite || 0,
          total_paid: item.total_regle || 0,
          remaining: item.reste_a_payer || 0,
          statut: item.reste_a_payer > 0 ? 'en_retard' : 'a_jour',
          photo_initiales: item.photo_initiales,
        };
      });

      setChildren(demoChildren);
      if (!selectedChildId && demoChildren[0]) {
        onSelectChild(demoChildren[0].id);
      }
    }
  }, [authProfile?.id, authProfile?.role, onSelectChild, selectedChildId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0] || null;

  return {
    children,
    activeChild,
    isLoading,
    errorMessage,
    refresh: fetchChildren,
  };
}
