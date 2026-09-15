import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { RecuPaiement } from '../../components/paiements/RecuPaiement';
import { formatMRU } from '../../lib/utils';
import { formatDate, formatDateHeure, libelleMethode, libelleStatutPaiement, referenceRecu } from '../../lib/format';
import { useEcole } from '../../data/ecole';
import type { PaiementView } from '../../types/domain';
import { useEnfantSelectionne } from './useEnfantSelectionne';
import { CheckCircle2, Smartphone, Receipt, CreditCard, Clock3, CalendarDays, Eye } from 'lucide-react';

interface ParentPaiementsPageProps {
  selectedChildId: string;
}

export const ParentPaiementsPage: React.FC<ParentPaiementsPageProps> = ({ selectedChildId }) => {
  const { enfant, isLoading, error, refetch } = useEnfantSelectionne(selectedChildId);
  const { data: ecole } = useEcole();
  const [recu, setRecu] = useState<PaiementView | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!enfant) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto">
        <EmptyState title="Aucun enfant rattaché à votre compte" />
      </div>
    );
  }

  const pct = enfant.total_due > 0 ? Math.round((enfant.total_paid / enfant.total_due) * 100) : 0;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frais de Scolarité — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Échéancier, règlements enregistrés et reçus.</p>
        </div>

        {enfant.remaining > 0 && (
          <ComingSoon detail="paiement en ligne, confirmé par l'opérateur">
            <Button className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white font-bold shadow-xs flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0" disabled>
              <Smartphone className="h-4 w-4" />
              Payer par Mobile Money
            </Button>
          </ComingSoon>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Montant total dû"
          amount={enfant.total_due}
          unit="MRU"
          subtitle={`${enfant.echeances.length} échéance(s)${enfant.classe ? ` • ${enfant.classe}` : ''}`}
          icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant="purple"
        />
        <KpiCard
          title="Total déjà réglé"
          amount={enfant.total_paid}
          unit="MRU"
          subtitle={`${pct}% de la scolarité acquittée`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Reste à régler"
          amount={enfant.remaining}
          unit="MRU"
          subtitle={enfant.prochaine_echeance ? `Prochaine limite : ${formatDate(enfant.prochaine_echeance.date)}` : 'Aucun impayé'}
          icon={<Receipt className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant={enfant.remaining > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Échéancier</h3>
        </div>
        {enfant.echeances.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune échéance établie pour le moment.</p>
        ) : (
          <div className="space-y-2.5">
            {enfant.echeances.map((e) => (
              <div key={e.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{e.libelle}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Échéance du {formatDate(e.date_echeance)} • {formatMRU(e.montant)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {e.reste > 0 && <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">reste {formatMRU(e.reste)}</span>}
                  <StatusBadge statut={e.statut} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Historique des paiements</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{enfant.paiements.length} opération(s)</span>
        </div>

        {enfant.paiements.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucun paiement enregistré pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {enfant.paiements.map((p) => {
              const confirme = p.statut === 'confirme';
              const { date } = formatDateHeure(p.paye_le ?? p.created_at);
              return (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        confirme
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {confirme ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{p.echeance_libelle ?? 'Paiement'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {date} • {libelleMethode(p.methode)} • {libelleStatutPaiement(p.statut)} • Réf :{' '}
                        <span className="font-mono text-purple-700 dark:text-purple-400 font-semibold">{referenceRecu(p)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-900 dark:text-white text-base font-mono">{formatMRU(p.montant)}</span>
                    <Button variant="outline" size="sm" onClick={() => setRecu(p)} className="text-xs font-semibold gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Reçu
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RecuPaiement paiement={recu} ecoleNom={ecole?.nom ?? ''} encaissePar={null} onClose={() => setRecu(null)} />
    </div>
  );
};
