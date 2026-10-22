import { supabase } from './supabase';
import { MethodePaiement } from './mockData';

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
    return 'Accès refusé : votre profil n’est pas autorisé à enregistrer des paiements.';
  }
  if (raw.includes('MONTANT_INVALIDE')) {
    return 'Montant invalide : le montant doit être strictement supérieur à 0 MRU.';
  }
  if (raw.includes('ECHEANCE_INTROUVABLE')) {
    return 'Échéance introuvable dans la base de données.';
  }
  if (raw.includes('ACCES_INTERDIT_ECOLE')) {
    return 'Accès interdit : vous ne pouvez pas enregistrer un paiement pour une autre école.';
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
  return err?.message || 'Une erreur inattendue est survenue lors de l’enregistrement du paiement.';
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
