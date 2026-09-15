import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { formatMRU } from '../../lib/utils';
import { formatDate } from '../../lib/format';
import { nomComplet } from '../../data/aggregations';
import { useEcole } from '../../data/ecole';
import { useSession } from '../../data/useSession';
import { useEnfantSelectionne } from './useEnfantSelectionne';
import { CreditCard, GraduationCap, CalendarCheck, Calendar, School, Phone, Sparkles, Clock } from 'lucide-react';
import type { ParentNavTab } from '../../components/parent/ParentSidebar';

interface ParentDashboardPageProps {
  selectedChildId: string;
  onSelectChild: (id: string) => void;
  onNavigateTab: (tab: ParentNavTab) => void;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({ selectedChildId, onSelectChild, onNavigateTab }) => {
  const { profile } = useSession();
  const { data: ecole } = useEcole();
  const { enfants, enfant, isLoading, error, refetch } = useEnfantSelectionne(selectedChildId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              Espace Tuteur Légal
            </span>
            {ecole && <span className="text-xs text-slate-500 dark:text-slate-400">• {ecole.nom}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bonjour, {nomComplet(profile)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl">
            Retrouvez la situation des frais de scolarité et l'assiduité de vos enfants.
          </p>
        </div>

        {enfants.length > 1 && (
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {enfants.map((item) => {
              const isSelected = enfant?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectChild(item.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{item.prenom}</span>
                  <span className="text-[10px] opacity-75">({item.classe ?? '—'})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!enfant ? (
        <EmptyState
          title="Aucun enfant rattaché à votre compte"
          description="Contactez la direction de l'établissement pour rattacher vos enfants à votre espace."
        />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-xl flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                {`${enfant.prenom.charAt(0)}${enfant.nom.charAt(0)}`.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {enfant.prenom} {enfant.nom}
                  </h2>
                  {enfant.classe && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      {enfant.classe}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Matricule : #{enfant.matricule ?? '—'}</p>
              </div>
            </div>

            {enfant.remaining > 0 && (
              <Button
                size="sm"
                onClick={() => onNavigateTab('parent_paiements')}
                className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white text-xs font-semibold gap-2 px-3.5 py-2 shadow-xs shrink-0"
              >
                <CreditCard className="h-4 w-4" />
                Voir le solde ({formatMRU(enfant.remaining)})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
              title="Reste à payer"
              amount={enfant.remaining}
              unit="MRU"
              subtitle={
                enfant.prochaine_echeance
                  ? `Prochaine échéance le ${formatDate(enfant.prochaine_echeance.date)}`
                  : `Compte à jour (${formatMRU(enfant.total_paid)} réglés)`
              }
              icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              variant={enfant.remaining === 0 ? 'success' : 'purple'}
              onClick={() => onNavigateTab('parent_paiements')}
            />
            <KpiCard
              title="Résultats scolaires"
              customValue="—"
              subtitle="Bulletins disponibles prochainement"
              icon={<Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              variant="default"
              onClick={() => onNavigateTab('parent_pedagogie')}
            />
            <KpiCard
              title="Assiduité"
              customValue={`${enfant.nb_absences ?? 0} absence(s)`}
              subtitle={`${enfant.absences.filter((a) => a.type === 'retard').length} retard(s) enregistrés`}
              icon={<CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              variant="success"
              onClick={() => onNavigateTab('parent_assiduite')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Échéances à venir ou impayées</h3>
                </div>
                <button onClick={() => onNavigateTab('parent_paiements')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                  Tout voir
                </button>
              </div>
              {enfant.echeances.filter((e) => e.reste > 0).length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">Aucune échéance en attente de règlement.</p>
              ) : (
                <div className="space-y-2.5">
                  {enfant.echeances
                    .filter((e) => e.reste > 0)
                    .slice(0, 4)
                    .map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{e.libelle}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Échéance du {formatDate(e.date_echeance)}</div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">{formatMRU(e.reste)}</div>
                          <StatusBadge statut={e.statut} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dernières absences et retards</h3>
                </div>
                <button onClick={() => onNavigateTab('parent_assiduite')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                  Tout voir
                </button>
              </div>
              {enfant.absences.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">Aucune absence ni retard enregistré.</p>
              ) : (
                <div className="space-y-2.5">
                  {enfant.absences.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{a.type === 'retard' ? 'Retard' : 'Absence'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{formatDate(a.date_absence)}</div>
                      </div>
                      <span className={`text-xs font-bold ${a.justifiee ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {ecole && (
        <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <School className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ecole.nom} • Secrétariat</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{[ecole.adresse, ecole.ville].filter(Boolean).join(', ') || 'Adresse non renseignée'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ecole.telephone && (
              <a
                href={`tel:${ecole.telephone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                {ecole.telephone}
              </a>
            )}
            <button
              onClick={() => onNavigateTab('parent_assiduite')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <Calendar className="h-3.5 w-3.5" />
              Assiduité
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};
