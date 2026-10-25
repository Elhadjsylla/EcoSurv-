import { supabase } from './supabase';
import { MethodePaiement } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export interface ActiveEcheance {
  id: string;
  libelle: string;
  date_echeance: string;
  montant: number;
  montant_paye: number;
  solde_restant: number;
  montant_en_attente: number;
  soldeDisponible: number;
  solde_disponible?: number;
}

export interface EncaisserParams {
  echeanceId: string;
  montant: number;
  methode: MethodePaiement | string;
  referenceOperateur?: string | null;
  note?: string | null;
}

export interface EncaisserResult {
  numeroRecu: string;
  statut: 'confirme' | 'en_attente';
  paiementId?: string;
  nouveauSoldeRestant?: number;
  montantEnAttente?: number;
}

/**
 * Traduit les erreurs de la fonction PostgreSQL `enregistrer_paiement` en messages français clairs.
 */
export function formatRpcError(err: any): string {
  const raw = `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''}`;
  if (raw.includes('NON_AUTHENTIFIE')) {
    return 'Votre session est absente ou expirée. Veuillez vous reconnecter.';
  }
  if (raw.includes('ACCES_REFUSE')) {
    return 'Accès refusé : votre profil n’est pas autorisé à effectuer cette opération de paiement.';
  }
  if (raw.includes('ACCES_INTERDIT_ECOLE')) {
    return 'Accès interdit : vous ne pouvez pas modifier ou consulter un paiement d’une autre école.';
  }
  if (raw.includes('PAIEMENT_INTROUVABLE')) {
    return 'Paiement introuvable dans la base de données.';
  }
  if (raw.includes('PAIEMENT_NON_EN_ATTENTE')) {
    return 'Ce paiement n’est plus en attente de confirmation.';
  }
  if (raw.includes('DEPASSEMENT_A_LA_CONFIRMATION')) {
    return 'Impossible de confirmer : le montant dépasse le solde restant de l’échéance.';
  }
  if (raw.includes('MOTIF_OBLIGATOIRE')) {
    return 'Un motif d’au moins 3 caractères est obligatoire pour rejeter ou annuler le paiement.';
  }
  if (raw.includes('STATUT_INVALIDE')) {
    return 'Statut de rejet invalide (seuls "echoue" ou "annule" sont acceptés).';
  }
  if (raw.includes('MONTANT_INVALIDE')) {
    return 'Montant invalide : le montant doit être strictement supérieur à 0 MRU.';
  }
  if (raw.includes('ECHEANCE_INTROUVABLE')) {
    return 'Échéance introuvable dans la base de données.';
  }
  if (raw.includes('REFERENCE_DEJA_UTILISEE')) {
    return 'Référence opérateur déjà utilisée : cette référence de transaction a déjà été enregistrée pour cette école.';
  }
  if (raw.includes('ECHEANCE_DEJA_SOLDEE')) {
    return 'Échéance déjà soldée : cette échéance est déjà intégralement payée.';
  }
  if (raw.includes('SOLDE_COUVERT_PAR_ATTENTE')) {
    return 'Des paiements en attente de confirmation couvrent déjà le solde de cette échéance. Confirmez-les ou attendez leur rapprochement.';
  }
  if (raw.includes('DEPASSEMENT_SOLDE')) {
    return 'Le montant dépasse le solde disponible.';
  }
  if (err?.code === '42501' || raw.includes('row-level security')) {
    return 'Accès refusé par la politique de sécurité (RLS).';
  }
  return err?.message || 'Une erreur inattendue est survenue lors de l’opération de paiement.';
}

/**
 * Récupère l'échéance non soldée la plus ancienne pour un élève donné,
 * en déduisant les paiements actuellement en attente pour calculer le solde disponible réel.
 */
export async function getEcheanceActive(eleveId: string): Promise<ActiveEcheance | null> {
  const { data, error } = await supabase
    .from('echeances')
    .select('id, libelle, montant, montant_paye, date_echeance')
    .eq('eleve_id', eleveId)
    .neq('statut', 'paye')
    .order('date_echeance', { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const ech = data[0];
  const m = Number(ech.montant || 0);
  const mp = Number(ech.montant_paye || 0);
  const solde = Math.max(0, m - mp);

  // Lire la somme des paiements 'en_attente' sur cette échéance
  let montantEnAttente = 0;
  const { data: paiementsAttente, error: pError } = await supabase
    .from('paiements')
    .select('montant')
    .eq('echeance_id', ech.id)
    .eq('statut', 'en_attente');

  if (pError) {
    console.warn('[paiements] Erreur lecture paiements en attente:', pError);
  } else if (paiementsAttente) {
    montantEnAttente = paiementsAttente.reduce((sum, p: any) => sum + Number(p.montant || 0), 0);
  }

  const soldeDisponible = Math.max(0, solde - montantEnAttente);

  return {
    id: ech.id,
    libelle: ech.libelle,
    date_echeance: ech.date_echeance,
    montant: m,
    montant_paye: mp,
    solde_restant: solde,
    montant_en_attente: montantEnAttente,
    soldeDisponible: soldeDisponible,
    solde_disponible: soldeDisponible,
  };
}

/**
 * Exécute l'encaissement via la RPC sécurisée `enregistrer_paiement` et valide les données de retour.
 */
export async function encaisser(params: EncaisserParams): Promise<EncaisserResult> {
  const { echeanceId, montant, methode, referenceOperateur, note } = params;

  const { data: rpcResult, error: rpcError } = await supabase.rpc('enregistrer_paiement', {
    p_echeance_id: echeanceId,
    p_montant: montant,
    p_methode: methode,
    p_reference_operateur: referenceOperateur?.trim() ? referenceOperateur.trim() : null,
    p_note: note?.trim() || null,
  });

  if (rpcError) {
    throw new Error(formatRpcError(rpcError));
  }

  if (!rpcResult || rpcResult.success === false) {
    throw new Error('Échec de l’enregistrement du paiement : réponse inattendue du serveur.');
  }

  if (!rpcResult.numero_recu || typeof rpcResult.numero_recu !== 'string' || !rpcResult.numero_recu.trim()) {
    throw new Error('Réponse inattendue du serveur (numéro de reçu manquant).');
  }

  if (!rpcResult.statut || (rpcResult.statut !== 'confirme' && rpcResult.statut !== 'en_attente')) {
    throw new Error('Réponse inattendue du serveur (statut de paiement invalide).');
  }

  const nouveauSolde = rpcResult.nouveau_solde_restant !== undefined && rpcResult.nouveau_solde_restant !== null
    ? Number(rpcResult.nouveau_solde_restant)
    : undefined;

  const attenteCumul = rpcResult.montant_en_attente !== undefined && rpcResult.montant_en_attente !== null
    ? Number(rpcResult.montant_en_attente)
    : undefined;

  return {
    numeroRecu: rpcResult.numero_recu.trim(),
    statut: rpcResult.statut as 'confirme' | 'en_attente',
    paiementId: rpcResult.paiement_id,
    nouveauSoldeRestant: nouveauSolde,
    montantEnAttente: attenteCumul,
  };
}

export interface ConfirmerPaiementResult {
  paiementId: string;
  statut: 'confirme';
  numeroRecu: string;
  referenceOperateur?: string | null;
  montant: number;
  echeanceId: string;
  eleveId: string;
  nouveauSoldeRestant: number;
}

/**
 * Confirme un paiement au statut 'en_attente' via la RPC sécurisée `confirmer_paiement`.
 */
export async function confirmerPaiement(paiementId: string): Promise<ConfirmerPaiementResult> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('confirmer_paiement', {
    p_paiement_id: paiementId,
  });

  if (rpcError) {
    throw new Error(formatRpcError(rpcError));
  }

  if (!rpcResult || rpcResult.success === false) {
    throw new Error('Échec de la confirmation du paiement : réponse inattendue du serveur.');
  }

  return {
    paiementId: rpcResult.paiement_id,
    statut: 'confirme',
    numeroRecu: rpcResult.numero_recu || '',
    referenceOperateur: rpcResult.reference_operateur || null,
    montant: Number(rpcResult.montant || 0),
    echeanceId: rpcResult.echeance_id,
    eleveId: rpcResult.eleve_id,
    nouveauSoldeRestant: Number(rpcResult.nouveau_solde_restant ?? 0),
  };
}

export interface RejeterPaiementResult {
  paiementId: string;
  statut: 'echoue' | 'annule';
  motif: string;
  echeanceId: string;
  eleveId: string;
  soldeDisponibleApres: number;
}

/**
 * Rejette ou annule un paiement au statut 'en_attente' via la RPC sécurisée `rejeter_paiement`.
 */
export async function rejeterPaiement(
  paiementId: string,
  motif: string,
  statutFinal: 'echoue' | 'annule' = 'echoue'
): Promise<RejeterPaiementResult> {
  const trimmedMotif = (motif || '').trim();
  if (trimmedMotif.length < 3) {
    throw new Error('Un motif d’au moins 3 caractères est obligatoire pour rejeter ou annuler le paiement.');
  }

  if (statutFinal !== 'echoue' && statutFinal !== 'annule') {
    throw new Error('Statut de rejet invalide (seuls "echoue" ou "annule" sont acceptés).');
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc('rejeter_paiement', {
    p_paiement_id: paiementId,
    p_motif: trimmedMotif,
    p_statut_final: statutFinal,
  });

  if (rpcError) {
    throw new Error(formatRpcError(rpcError));
  }

  if (!rpcResult || rpcResult.success === false) {
    throw new Error('Échec du rejet du paiement : réponse inattendue du serveur.');
  }

  return {
    paiementId: rpcResult.paiement_id,
    statut: rpcResult.statut as 'echoue' | 'annule',
    motif: rpcResult.motif || trimmedMotif,
    echeanceId: rpcResult.echeance_id,
    eleveId: rpcResult.eleve_id,
    soldeDisponibleApres: Number(rpcResult.solde_disponible_apres ?? 0),
  };
}

export interface PaiementEnAttente {
  id: string;
  ecole_id: string;
  echeance_id: string;
  montant: number;
  methode: MethodePaiement | string;
  statut: 'en_attente';
  reference_transaction: string | null;
  encaisse_par: string | null;
  encaisseur_nom?: string | null;
  note: string | null;
  paye_le: string | null;
  created_at: string;
  updated_at: string;
  numero_recu: string | null;
  echeance: {
    id: string;
    libelle: string;
    montant: number;
    montant_paye: number;
  } | null;
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe: string;
    matricule: string;
  } | null;
}

/**
 * Lit les paiements au statut 'en_attente' de l'école courante avec l'échéance et l'élève,
 * triés du plus ancien au plus récent.
 */
export async function listerPaiementsEnAttente(ecoleIdParam?: string): Promise<PaiementEnAttente[]> {
  const ecoleId = ecoleIdParam || useAuthStore.getState().profile?.ecole_id;

  let query = supabase
    .from('paiements')
    .select('id, ecole_id, echeance_id, montant, methode, statut, reference_transaction, encaisse_par, note, paye_le, created_at, updated_at, numero_recu')
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: true });

  if (ecoleId) {
    query = query.eq('ecole_id', ecoleId);
  }

  const { data: paiementsData, error: payError } = await query;

  if (payError) {
    if (payError.code === '42501' || payError.message?.includes('row-level security')) {
      throw new Error(`Accès refusé par la politique de sécurité (RLS) sur la table 'paiements'.`);
    }
    throw new Error(formatRpcError(payError));
  }

  if (!paiementsData || paiementsData.length === 0) {
    return [];
  }

  // 1. Échéances associées
  const echeanceIds = Array.from(new Set(paiementsData.map((p) => p.echeance_id).filter(Boolean)));
  const echeancesMap = new Map<string, any>();
  const elevesMap = new Map<string, any>();
  const profilsMap = new Map<string, string>();

  if (echeanceIds.length > 0) {
    const { data: echeancesData, error: echError } = await supabase
      .from('echeances')
      .select('id, libelle, montant, montant_paye, eleve_id')
      .in('id', echeanceIds);

    if (echError) {
      if (echError.code === '42501' || echError.message?.includes('row-level security')) {
        throw new Error(`Accès refusé par la politique de sécurité (RLS) sur la table 'echeances'.`);
      }
      throw new Error(formatRpcError(echError));
    }

    if (echeancesData) {
      echeancesData.forEach((e) => echeancesMap.set(e.id, e));

      // 2. Élèves associés
      const eleveIds = Array.from(new Set(echeancesData.map((e) => e.eleve_id).filter(Boolean)));
      if (eleveIds.length > 0) {
        const { data: elevesData, error: eleveError } = await supabase
          .from('eleves')
          .select('id, nom, prenom, classe, matricule')
          .in('id', eleveIds);

        if (eleveError) {
          if (eleveError.code === '42501' || eleveError.message?.includes('row-level security')) {
            throw new Error(`Accès refusé par la politique de sécurité (RLS) sur la table 'eleves'.`);
          }
          throw new Error(formatRpcError(eleveError));
        }

        if (elevesData) {
          elevesData.forEach((el) => elevesMap.set(el.id, el));
        }
      }
    }
  }

  // 3. Profils des encaisseurs (tentative sans bloquer la liste si RLS restreint)
  const encaisseurIds = Array.from(new Set(paiementsData.map((p) => p.encaisse_par).filter(Boolean)));
  if (encaisseurIds.length > 0) {
    try {
      const { data: profs, error: profError } = await supabase
        .from('profils')
        .select('id, nom, prenom')
        .in('id', encaisseurIds);

      if (!profError && profs) {
        profs.forEach((pr) => {
          const fullname = `${pr.prenom || ''} ${pr.nom || ''}`.trim();
          if (fullname) profilsMap.set(pr.id, fullname);
        });
      }
    } catch {
      // Pas de blocage si profils tiers restreints
    }
  }

  return paiementsData.map((p) => {
    const ech = echeancesMap.get(p.echeance_id) || null;
    const eleve = ech ? (elevesMap.get(ech.eleve_id) || null) : null;
    const encaisseurNom = p.encaisse_par ? (profilsMap.get(p.encaisse_par) || null) : null;

    return {
      id: p.id,
      ecole_id: p.ecole_id,
      echeance_id: p.echeance_id,
      montant: Number(p.montant || 0),
      methode: p.methode,
      statut: 'en_attente',
      reference_transaction: p.reference_transaction || null,
      encaisse_par: p.encaisse_par || null,
      encaisseur_nom: encaisseurNom,
      note: p.note || null,
      paye_le: p.paye_le || null,
      created_at: p.created_at,
      updated_at: p.updated_at,
      numero_recu: p.numero_recu || null,
      echeance: ech
        ? {
            id: ech.id,
            libelle: ech.libelle,
            montant: Number(ech.montant || 0),
            montant_paye: Number(ech.montant_paye || 0),
          }
        : null,
      eleve: eleve
        ? {
            id: eleve.id,
            nom: eleve.nom,
            prenom: eleve.prenom,
            classe: eleve.classe,
            matricule: eleve.matricule,
          }
        : null,
    };
  });
}
