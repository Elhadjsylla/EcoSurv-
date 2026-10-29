import { supabase } from './supabase';
import { useAuthStore, EcoleInfo } from '../store/useAuthStore';
import { useEcoleStore } from '../store/useEcoleStore';

export interface UpdateAnneeScolaireResult {
  success: boolean;
  data?: EcoleInfo;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Synchronise l'objet école reçu de Supabase dans `useAuthStore` et `useEcoleStore`.
 */
export function syncEcoleStores(data: EcoleInfo): void {
  useAuthStore.getState().setEcole(data);
  useEcoleStore.getState().updateEcole({
    id: data.id,
    nom: data.nom || '',
    ville: data.ville || '',
    adresse: data.adresse || '',
    telephone: data.telephone || '',
    email: data.email || '',
    annee_scolaire: data.annee_scolaire || '',
    statut_activation: data.statut_activation,
    statut_abonnement: data.statut_abonnement as any,
  });
}

/**
 * Met à jour uniquement la colonne `annee_scolaire` de la table `ecoles`
 * pour l'école du directeur, puis synchronise `useAuthStore` et `useEcoleStore`.
 */
export async function updateAnneeScolaireEcole(
  ecoleId: string,
  anneeScolaire: string
): Promise<UpdateAnneeScolaireResult> {
  const cleanEcoleId = ecoleId.trim();
  const cleanAnnee = anneeScolaire.trim();

  if (!cleanEcoleId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION',
        message: "Identifiant de l'établissement manquant.",
      },
    };
  }

  if (!cleanAnnee) {
    return {
      success: false,
      error: {
        code: 'VALIDATION',
        message: 'Veuillez sélectionner une année scolaire.',
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from('ecoles')
      .update({ annee_scolaire: cleanAnnee })
      .eq('id', cleanEcoleId)
      .select(
        'id, nom, ville, adresse, telephone, email, annee_scolaire, statut_activation, statut_abonnement'
      )
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: error?.code || 'BDD',
          message:
            error?.message ||
            "Impossible d'enregistrer l'année scolaire de l'établissement.",
        },
      };
    }

    const ecoleInfo = data as EcoleInfo;
    syncEcoleStores(ecoleInfo);

    return {
      success: true,
      data: ecoleInfo,
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: err?.code || 'EXCEPTION',
        message:
          err?.message ||
          "Une erreur inattendue est survenue lors de l'enregistrement.",
      },
    };
  }
}

