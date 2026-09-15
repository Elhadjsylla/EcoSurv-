import React, { useEffect, useMemo, useState } from 'react';
import { Check, Info, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { EmptyState } from '../ui/DataState';
import { cn, formatMRU } from '../../lib/utils';
import { formatDate, libelleMethode } from '../../lib/format';
import { messageErreurDonnees } from '../../data/errors';
import { statutInitialPaiement, useEnregistrerPaiement } from '../../data/paiements';
import type { EcheanceView, EleveSituation, MethodePaiement, PaiementView } from '../../types/domain';

const METHODES: MethodePaiement[] = ['especes', 'bankily', 'masrvi', 'cheque'];

interface PaiementFormProps {
  eleve: EleveSituation;
  /** Couleur du portail : bleu (Directeur) ou orange (Caissier). */
  accent?: 'blue' | 'amber';
  onSaved: (paiement: PaiementView, echeance: EcheanceView) => void;
  onCancel?: () => void;
}

/**
 * Saisie d'un encaissement rattaché à une échéance réelle de l'élève.
 * Le montant ne peut pas dépasser le reste dû ; seules les espèces sont
 * confirmées immédiatement, les autres modes restent en attente.
 */
export const PaiementForm: React.FC<PaiementFormProps> = ({ eleve, accent = 'blue', onSaved, onCancel }) => {
  const dues = useMemo(() => eleve.echeances.filter((e) => e.reste > 0), [eleve.echeances]);
  const [echeanceId, setEcheanceId] = useState(dues[0]?.id ?? '');
  const [montant, setMontant] = useState(dues[0] ? String(dues[0].reste) : '');
  const [methode, setMethode] = useState<MethodePaiement>('especes');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const mutation = useEnregistrerPaiement();

  const echeance = dues.find((e) => e.id === echeanceId) ?? null;

  // Changement d'élève ou échéance soldée entre-temps : repartir de la première échéance due.
  useEffect(() => {
    if (!dues.some((e) => e.id === echeanceId)) {
      setEcheanceId(dues[0]?.id ?? '');
      setMontant(dues[0] ? String(dues[0].reste) : '');
    }
  }, [dues, echeanceId]);

  if (dues.length === 0) {
    return (
      <EmptyState
        title="Aucune échéance à régler"
        description="Toutes les échéances de cet élève sont soldées, ou aucun échéancier n'est encore établi."
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!echeance || mutation.isPending) return;
    try {
      const paiement = await mutation.mutateAsync({
        echeance,
        montant: Number(montant.replace(',', '.')),
        methode,
        reference,
        note,
      });
      setReference('');
      setNote('');
      onSaved(paiement, echeance);
    } catch {
      // Message affiché sous le formulaire à partir de mutation.error.
    }
  };

  const ring = accent === 'amber' ? 'focus:ring-amber-600' : 'focus:ring-blue-600';
  const enAttente = statutInitialPaiement(methode) === 'en_attente';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Échéance concernée *</label>
        <Select
          value={echeanceId}
          onChange={(id) => {
            setEcheanceId(id);
            const choisie = dues.find((d) => d.id === id);
            if (choisie) setMontant(String(choisie.reste));
          }}
          options={dues.map((d) => ({
            value: d.id,
            label: `${d.libelle} — reste ${formatMRU(d.reste)}`,
            description: `Échéance du ${formatDate(d.date_echeance)}`,
          }))}
          triggerClassName="w-full h-10 rounded-xl text-xs font-semibold"
        />
      </div>

      <div>
        <label htmlFor={`montant-${eleve.id}`} className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
          Montant encaissé (MRU) *
        </label>
        <div className="relative">
          <input
            id={`montant-${eleve.id}`}
            type="number"
            inputMode="decimal"
            min={1}
            max={echeance?.reste}
            step="any"
            required
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className={cn(
              'w-full h-11 pl-3 pr-14 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-extrabold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2',
              ring
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">MRU</span>
        </div>
        {echeance && (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Reste dû sur cette échéance : <strong className="font-mono">{formatMRU(echeance.reste)}</strong>
          </p>
        )}
      </div>

      <div>
        <span className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Mode de règlement *</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Mode de règlement">
          {METHODES.map((m) => {
            const selected = methode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMethode(m)}
                className={cn(
                  'py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between cursor-pointer',
                  selected
                    ? accent === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-600 text-amber-900 dark:text-amber-200'
                      : 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-900 dark:text-blue-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                )}
              >
                <span>{libelleMethode(m)}</span>
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {enAttente && (
        <>
          <div>
            <label htmlFor={`ref-${eleve.id}`} className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Référence de transaction / N° de chèque *
            </label>
            <input
              id={`ref-${eleve.id}`}
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex : TX-992144, chèque n° 004812"
              className={cn(
                'w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2',
                ring
              )}
            />
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-3 text-[11px] font-medium text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Ce paiement sera enregistré <strong>en attente</strong> : il ne soldera l'échéance qu'après
              confirmation par l'opérateur, jamais sur simple saisie.
            </span>
          </div>
        </>
      )}

      <div>
        <label htmlFor={`note-${eleve.id}`} className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
          Note (facultatif)
        </label>
        <input
          id={`note-${eleve.id}`}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn(
            'w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2',
            ring
          )}
        />
      </div>

      {mutation.error && (
        <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {messageErreurDonnees(mutation.error)}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          loading={mutation.isPending}
          loadingText="Enregistrement…"
          className={accent === 'amber' ? 'bg-amber-600 hover:bg-amber-700 border-amber-600' : undefined}
        >
          <Zap className="h-4 w-4" />
          {enAttente ? 'Enregistrer (en attente)' : `Encaisser ${montant ? formatMRU(Number(montant) || 0) : ''}`}
        </Button>
      </div>
    </form>
  );
};
