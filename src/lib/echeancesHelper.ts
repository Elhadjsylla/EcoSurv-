import { supabase } from './supabase';
import { EcheancierConfig, FrequenceEcheance } from '../types';
import { ANNEE_SCOLAIRE_ACTIVE } from './constants/scolaire';

export function computeTrancheDates(
  startDateStr: string,
  frequence: FrequenceEcheance,
  nbTranches: number
): string[] {
  const dates: string[] = [];
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(startDateStr);
  let startYear: number;
  let startMonth: number;
  let targetDay: number;

  if (match) {
    startYear = parseInt(match[1], 10);
    startMonth = parseInt(match[2], 10) - 1;
    targetDay = parseInt(match[3], 10);
  } else {
    const fallback = new Date(startDateStr);
    const valid = isNaN(fallback.getTime()) ? new Date() : fallback;
    startYear = valid.getUTCFullYear();
    startMonth = valid.getUTCMonth();
    targetDay = valid.getUTCDate();
  }

  for (let i = 0; i < nbTranches; i++) {
    let deltaMonths = 0;
    if (frequence === 'mensuel') {
      deltaMonths = i;
    } else if (frequence === 'trimestriel') {
      deltaMonths = i * 3;
    } else {
      deltaMonths = i * 12;
    }

    const totalMonths = startMonth + deltaMonths;
    const targetYear = startYear + Math.floor(totalMonths / 12);
    const targetMonth = ((totalMonths % 12) + 12) % 12;

    const daysInMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const actualDay = Math.min(targetDay, daysInMonth);

    const yStr = String(targetYear).padStart(4, '0');
    const mStr = String(targetMonth + 1).padStart(2, '0');
    const dStr = String(actualDay).padStart(2, '0');
    dates.push(`${yStr}-${mStr}-${dStr}`);
  }
  return dates;
}

/**
 * Récupère les barèmes réels depuis la table Supabase baremes_echeances.
 * Ne masque aucune erreur de base de données.
 */
export async function fetchBaremes(ecoleId: string): Promise<EcheancierConfig[]> {
  if (!ecoleId) return [];

  const { data, error } = await supabase
    .from('baremes_echeances')
    .select('*')
    .eq('ecole_id', ecoleId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      throw new Error("La table 'baremes_echeances' n'existe pas encore dans Supabase. Veuillez exécuter la migration SQL.");
    }
    throw new Error(`Erreur Supabase lors du chargement des barèmes: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Compter le nombre réel d'élèves pour chaque classe
  const { data: eleves, error: elevesErr } = await supabase
    .from('eleves')
    .select('classe')
    .eq('ecole_id', ecoleId);

  if (elevesErr) {
    console.warn('[echeancesHelper] Impossible de compter les élèves par classe:', elevesErr);
  }

  const classeCounts: Record<string, number> = {};
  (eleves || []).forEach((el: any) => {
    if (el.classe) {
      classeCounts[el.classe] = (classeCounts[el.classe] || 0) + 1;
    }
  });

  return data.map((b: any) => ({
    id: b.id,
    libelle: b.libelle,
    classe: b.classe,
    montant_total: Number(b.montant_total),
    frequence: b.frequence as FrequenceEcheance,
    nombre_tranches: Number(b.nombre_tranches),
    montant_par_tranche: Number(b.montant_par_tranche),
    date_limite_prochaine: b.date_limite_prochaine,
    nb_eleves_concernes: classeCounts[b.classe] || 0,
  }));
}

/**
 * Insère le barème dans la table Supabase baremes_echeances
 * et génère les échéances individuelles réelles dans public.echeances.
 * Tout échec réel déclenche une exception affichée à l'utilisateur.
 */
export async function createBaremeAndGenerateEcheances(
  ecoleId: string,
  bareme: {
    libelle: string;
    classe: string;
    montant_total: number;
    frequence: FrequenceEcheance;
    nombre_tranches: number;
    date_limite_prochaine: string;
  },
  anneeScolaire = ANNEE_SCOLAIRE_ACTIVE
): Promise<{ bareme: EcheancierConfig; generatedEcheancesCount: number }> {
  const montantParTranche = Math.round(bareme.montant_total / bareme.nombre_tranches);

  // 1. Insertion stricte dans Supabase baremes_echeances
  const { data: inserted, error: insertBaremeErr } = await supabase
    .from('baremes_echeances')
    .insert({
      ecole_id: ecoleId,
      libelle: bareme.libelle,
      classe: bareme.classe,
      montant_total: bareme.montant_total,
      frequence: bareme.frequence,
      nombre_tranches: bareme.nombre_tranches,
      montant_par_tranche: montantParTranche,
      date_limite_prochaine: bareme.date_limite_prochaine,
      annee_scolaire: anneeScolaire,
    })
    .select('id')
    .single();

  if (insertBaremeErr) {
    if (insertBaremeErr.code === 'PGRST205') {
      throw new Error("Échec d'enregistrement : la table 'baremes_echeances' n'existe pas dans Supabase. Veuillez exécuter le script SQL de migration.");
    }
    throw new Error(`Échec d'enregistrement du barème : ${insertBaremeErr.message}`);
  }

  const baremeId = inserted?.id;

  // 2. Récupérer tous les élèves existants de cette classe
  const { data: eleves, error: elevesErr } = await supabase
    .from('eleves')
    .select('id, classe')
    .eq('ecole_id', ecoleId)
    .eq('classe', bareme.classe);

  if (elevesErr) {
    throw new Error(`Barème créé, mais impossible de charger les élèves de ${bareme.classe}: ${elevesErr.message}`);
  }

  let generatedCount = 0;

  if (eleves && eleves.length > 0) {
    const dates = computeTrancheDates(
      bareme.date_limite_prochaine,
      bareme.frequence,
      bareme.nombre_tranches
    );

    const rowsToInsert: any[] = [];

    for (const eleve of eleves) {
      let totalAlloue = 0;
      for (let i = 0; i < bareme.nombre_tranches; i++) {
        const isLast = i === bareme.nombre_tranches - 1;
        const montantTranche = isLast ? (bareme.montant_total - totalAlloue) : montantParTranche;
        totalAlloue += montantTranche;

        rowsToInsert.push({
          ecole_id: ecoleId,
          eleve_id: eleve.id,
          libelle: `${bareme.libelle} - Tranche ${i + 1}/${bareme.nombre_tranches}`,
          montant: montantTranche,
          date_echeance: dates[i] || bareme.date_limite_prochaine,
          annee_scolaire: anneeScolaire,
        });
      }
    }

    if (rowsToInsert.length > 0) {
      const { error: insErr } = await supabase.from('echeances').insert(rowsToInsert);
      if (insErr) {
        throw new Error(`Barème créé, mais échec d'insertion des échéances dans Supabase: ${insErr.message}`);
      }
      generatedCount = rowsToInsert.length;
    }
  }

  const newConfig: EcheancierConfig = {
    id: baremeId,
    libelle: bareme.libelle,
    classe: bareme.classe,
    montant_total: bareme.montant_total,
    frequence: bareme.frequence,
    nombre_tranches: bareme.nombre_tranches,
    montant_par_tranche: montantParTranche,
    date_limite_prochaine: bareme.date_limite_prochaine,
    nb_eleves_concernes: eleves ? eleves.length : 0,
  };

  return { bareme: newConfig, generatedEcheancesCount: generatedCount };
}

/**
 * Génère automatiquement les échéances individuelles pour un nouvel élève
 * selon le barème configuré en base pour sa classe.
 */
export async function generateEcheancesForNewStudent(
  ecoleId: string,
  eleveId: string,
  classe: string,
  anneeScolaire = ANNEE_SCOLAIRE_ACTIVE
): Promise<number> {
  if (!ecoleId || !eleveId || !classe) return 0;

  const { data: baremes, error: bErr } = await supabase
    .from('baremes_echeances')
    .select('*')
    .eq('ecole_id', ecoleId)
    .eq('classe', classe);

  if (bErr) {
    console.error('[echeancesHelper] Erreur chargement barèmes pour nouvel élève:', bErr);
    throw new Error(`Erreur lors de la lecture des barèmes pour la classe ${classe}: ${bErr.message}`);
  }

  if (!baremes || baremes.length === 0) {
    return 0;
  }

  // Appliquer le barème le plus récent de la classe
  const bareme = baremes[0];

  const dates = computeTrancheDates(
    bareme.date_limite_prochaine,
    bareme.frequence,
    bareme.nombre_tranches
  );

  const rowsToInsert: any[] = [];
  let totalAlloue = 0;
  const montantParTranche = Number(bareme.montant_par_tranche) || Math.round(Number(bareme.montant_total) / Number(bareme.nombre_tranches));

  for (let i = 0; i < bareme.nombre_tranches; i++) {
    const isLast = i === bareme.nombre_tranches - 1;
    const montantTranche = isLast ? (Number(bareme.montant_total) - totalAlloue) : montantParTranche;
    totalAlloue += montantTranche;

    rowsToInsert.push({
      ecole_id: ecoleId,
      eleve_id: eleveId,
      libelle: `${bareme.libelle} - Tranche ${i + 1}/${bareme.nombre_tranches}`,
      montant: montantTranche,
      date_echeance: dates[i] || bareme.date_limite_prochaine,
      annee_scolaire: anneeScolaire,
    });
  }

  if (rowsToInsert.length > 0) {
    const { error: insErr } = await supabase.from('echeances').insert(rowsToInsert);
    if (insErr) {
      console.error('[echeancesHelper] Erreur insertion échéance nouvel élève:', insErr);
      throw new Error(`Échec de génération automatique des échéances pour l'élève: ${insErr.message}`);
    }
    return rowsToInsert.length;
  }

  return 0;
}

/**
 * Supprime un barème dans la base Supabase.
 */
export async function deleteBareme(ecoleId: string, baremeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('baremes_echeances')
    .delete()
    .eq('id', baremeId)
    .eq('ecole_id', ecoleId);

  if (error) {
    throw new Error(`Erreur lors de la suppression du barème: ${error.message}`);
  }

  return true;
}

export interface ClasseSansBaremeInfo {
  classe: string;
  eleves: number;
}

export interface GenererEcheancesManquantesResult {
  success: boolean;
  echeancesCreees: number;
  elevesConcernes: number;
  classesSansBareme: ClasseSansBaremeInfo[];
}

export interface GenererEcheancesManquantesParams {
  eleveId?: string;
  classe?: string;
}

/**
 * Traduit les erreurs de la fonction PostgreSQL `generer_echeances_manquantes` en messages français clairs.
 */
export function formatGenererEcheancesError(err: any): string {
  const raw = `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''}`;
  if (raw.includes('NON_AUTHENTIFIE')) {
    return 'Vous devez être connecté pour effectuer cette action.';
  }
  if (raw.includes('ACCES_REFUSE')) {
    return 'Accès refusé. Cette action est réservée au directeur et au super-administrateur.';
  }
  if (raw.includes('ECOLE_INTROUVABLE')) {
    return 'Établissement introuvable ou compte non rattaché à une école.';
  }
  if (raw.includes('BAREME_INCOHERENT')) {
    const match = /BAREME_INCOHERENT[:\s\-]+(.*)/i.exec(err?.message || raw);
    const detail = match && match[1] ? match[1].trim() : (err?.message || '');
    return `Le barème configuré est incohérent : ${detail}`;
  }
  if (err?.code === '42501' || raw.includes('row-level security')) {
    return 'Accès refusé par la politique de sécurité (RLS).';
  }
  return err?.message || 'Une erreur inattendue est survenue lors de la génération des échéances.';
}

/**
 * Appelle la RPC `generer_echeances_manquantes` (directeur / super_admin).
 * Génère les tranches manquantes sans toucher aux échéances existantes ni aux paiements.
 */
export async function genererEcheancesManquantes(
  params?: GenererEcheancesManquantesParams
): Promise<GenererEcheancesManquantesResult> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('generer_echeances_manquantes', {
    p_eleve_id: params?.eleveId || null,
    p_classe: params?.classe ? params.classe.trim() : null,
  });

  if (rpcError) {
    throw new Error(formatGenererEcheancesError(rpcError));
  }

  if (!rpcResult || rpcResult.success === false) {
    throw new Error('Échec de la génération des échéances : réponse inattendue du serveur.');
  }

  const rawClasses = Array.isArray(rpcResult.classes_sans_bareme)
    ? rpcResult.classes_sans_bareme
    : [];

  const classesSansBareme: ClasseSansBaremeInfo[] = rawClasses.map((c: any) => ({
    classe: String(c.classe || ''),
    eleves: Number(c.eleves || 0),
  }));

  return {
    success: true,
    echeancesCreees: Number(rpcResult.echeances_creees ?? 0),
    elevesConcernes: Number(rpcResult.eleves_concernes ?? 0),
    classesSansBareme,
  };
}
