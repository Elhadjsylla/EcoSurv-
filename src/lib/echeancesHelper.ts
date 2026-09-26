import { supabase } from './supabase';
import { EcheancierConfig, FrequenceEcheance } from './mockData';

export function computeTrancheDates(
  startDateStr: string,
  frequence: FrequenceEcheance,
  nbTranches: number
): string[] {
  const dates: string[] = [];
  const baseDate = new Date(startDateStr);
  const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;

  for (let i = 0; i < nbTranches; i++) {
    const d = new Date(validBase);
    if (frequence === 'mensuel') {
      d.setMonth(d.getMonth() + i);
    } else if (frequence === 'trimestriel') {
      d.setMonth(d.getMonth() + i * 3);
    } else {
      // Annuel
      d.setFullYear(d.getFullYear() + i);
    }
    dates.push(d.toISOString().split('T')[0]);
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
  anneeScolaire = '2025-2026'
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
  anneeScolaire = '2025-2026'
): Promise<number> {
  if (!ecoleId || !eleveId || !classe) return 0;

  const { data: baremes, error: bErr } = await supabase
    .from('baremes_echeances')
    .select('*')
    .eq('ecole_id', ecoleId)
    .eq('classe', classe);

  if (bErr || !baremes || baremes.length === 0) {
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
