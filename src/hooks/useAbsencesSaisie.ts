import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  EMPTY_ENTRY,
  countChanges,
  entriesFromRows,
  latestSavedAt,
  planSave,
  type AbsenceRow,
  type AttendanceEntry,
  type AttendanceStatus,
} from '../lib/absences';

export type LoadState = 'loading' | 'ready' | 'error';

export interface SaveResult {
  ok: boolean;
  message: string;
}

interface Args {
  ecoleId?: string | null;
  userId?: string | null;
  studentIds: string[];
  date: string;
}

/**
 * Feuille d'appel d'une classe pour une date : charge l'état réellement enregistré en base,
 * garde les modifications locales à part, et n'écrit qu'au moment d'enregistrer.
 */
export function useAbsencesSaisie({ ecoleId, userId, studentIds, date }: Args) {
  const idsKey = studentIds.join(',');
  const [rows, setRows] = useState<AbsenceRow[]>([]);
  const [saved, setSaved] = useState<Record<string, AttendanceEntry>>({});
  const [draft, setDraft] = useState<Record<string, AttendanceEntry>>({});
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const requestRef = useRef(0);

  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);

  /** Lit les lignes en base. `replaceDraft` : remplace aussi les saisies locales (chargement initial, après enregistrement). */
  const load = useCallback(
    async (replaceDraft: boolean): Promise<boolean> => {
      const requestId = ++requestRef.current;
      if (!ecoleId || ids.length === 0) {
        setRows([]);
        setSaved({});
        setDraft({});
        setLoadState('ready');
        return true;
      }
      // Un rechargement qui conserve les saisies locales ne remplace pas l'écran par un squelette.
      if (replaceDraft) setLoadState('loading');
      try {
        const { data, error } = await supabase
          .from('absences')
          .select('*')
          .eq('ecole_id', ecoleId)
          .eq('date_absence', date)
          .in('eleve_id', ids);
        if (requestId !== requestRef.current) return false; // une demande plus récente a pris le relais
        if (error) {
          console.error('[useAbsencesSaisie] Erreur lecture absences:', error.code, error.message, error.details);
          setLoadState('error');
          return false;
        }
        const list = (data || []) as AbsenceRow[];
        const entries = entriesFromRows(list, ids);
        setRows(list);
        setSaved(entries);
        if (replaceDraft) setDraft(entries);
        setLoadState('ready');
        return true;
      } catch (err) {
        if (requestId !== requestRef.current) return false;
        console.error('[useAbsencesSaisie] Erreur inattendue lecture absences:', err);
        setLoadState('error');
        return false;
      }
    },
    [ecoleId, ids, date]
  );

  // Nouvelle classe ou nouvelle date : on repart de l'état enregistré en base.
  useEffect(() => {
    setDraft({});
    setSaved({});
    setRows([]);
    void load(true);
  }, [load]);

  const entryOf = useCallback((id: string): AttendanceEntry => draft[id] ?? EMPTY_ENTRY, [draft]);

  const setStatus = useCallback((id: string, status: AttendanceStatus) => {
    setDraft((prev) => {
      const current = prev[id] ?? EMPTY_ENTRY;
      return {
        ...prev,
        [id]: {
          ...current,
          status,
          // Un élève présent n'a ni motif ni justification : aucune combinaison impossible.
          motif: status === 'present' ? '' : current.motif,
          justifiee: status === 'present' ? false : current.justifiee,
          conflict: false,
        },
      };
    });
  }, []);

  const setDetails = useCallback((id: string, patch: Partial<Pick<AttendanceEntry, 'motif' | 'justifiee'>>) => {
    setDraft((prev) => {
      const current = prev[id] ?? EMPTY_ENTRY;
      if (current.status !== 'absent' && current.status !== 'retard') return prev;
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }, []);

  /** Marque présents les élèves qui n'ont encore aucun état ; ne touche pas aux autres. */
  const markUnsetPresent = useCallback(() => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id] || next[id].status === null) {
          next[id] = { status: 'present', motif: '', justifiee: false };
        }
      }
      return next;
    });
  }, [ids]);

  const changedCount = useMemo(() => countChanges(ids, draft, saved), [ids, draft, saved]);
  const unsetCount = useMemo(() => ids.filter((id) => (draft[id]?.status ?? null) === null).length, [ids, draft]);
  const savedAt = useMemo(() => latestSavedAt(rows), [rows]);

  const save = useCallback(async (): Promise<SaveResult> => {
    if (!ecoleId || !userId) {
      return { ok: false, message: 'Votre session n’est plus valide. Reconnectez-vous puis réessayez.' };
    }
    const plan = planSave({ studentIds: ids, draft, saved, rows, date, ecoleId, userId });
    if (plan.upserts.length === 0 && plan.deleteIds.length === 0) {
      return { ok: true, message: 'Aucune modification à enregistrer.' };
    }
    setSaving(true);
    try {
      if (plan.upserts.length > 0) {
        const { error } = await supabase
          .from('absences')
          .upsert(plan.upserts, { onConflict: 'eleve_id,date_absence,type' });
        if (error) {
          console.error('[useAbsencesSaisie] Erreur enregistrement:', error.code, error.message, error.details);
          return {
            ok: false,
            message:
              error.code === '42501'
                ? 'L’enregistrement a été refusé : un de ces élèves n’est pas dans vos classes. Vos saisies sont conservées.'
                : 'Les absences n’ont pas pu être enregistrées. Vos saisies sont conservées : vérifiez votre connexion puis réessayez.',
          };
        }
      }
      if (plan.deleteIds.length > 0) {
        const { error } = await supabase.from('absences').delete().in('id', plan.deleteIds);
        if (error) {
          console.error('[useAbsencesSaisie] Erreur suppression:', error.code, error.message, error.details);
          await load(false);
          return {
            ok: false,
            message:
              'Une partie des changements n’a pas pu être enregistrée (retrait d’une absence). Vos saisies sont conservées : réessayez.',
          };
        }
      }
      // Confirmation par relecture en base, pas par l'état local.
      const reloaded = await load(true);
      if (!reloaded) {
        return {
          ok: false,
          message:
            'Les absences sont enregistrées, mais la relecture a échoué : l’affichage peut ne pas être à jour. Utilisez « Réessayer ».',
        };
      }
      return { ok: true, message: 'Absences enregistrées.' };
    } catch (err) {
      console.error('[useAbsencesSaisie] Erreur inattendue enregistrement:', err);
      return {
        ok: false,
        message: 'Une erreur est survenue. Vos saisies sont conservées : réessayez dans un instant.',
      };
    } finally {
      setSaving(false);
    }
  }, [ecoleId, userId, ids, draft, saved, rows, date, load]);

  return {
    loadState,
    saving,
    rows,
    saved,
    entryOf,
    setStatus,
    setDetails,
    markUnsetPresent,
    changedCount,
    unsetCount,
    savedAt,
    hasDraft: Object.keys(draft).length > 0,
    // « Réessayer » : sans saisie locale à protéger, la relecture remplace l'écran ; sinon elle les conserve.
    reload: () => load(changedCount === 0),
    save,
  };
}
