import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { KpiCard } from '../../components/ui/KpiCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { formatMRU } from '../../lib/utils';
import { formatDate } from '../../lib/format';
import { listeClasses } from '../../data/aggregations';
import { useSituationsEleves } from '../../data/eleves';
import { AlertCircle, Search, CreditCard, Filter, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface CaissierImpayesPageProps {
  onGoToGuichetWithEleve: (eleveId: string) => void;
}

type FiltreStatut = 'all' | 'en_retard' | 'partiel' | 'a_jour';

export const CaissierImpayesPage: React.FC<CaissierImpayesPageProps> = ({ onGoToGuichetWithEleve }) => {
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<FiltreStatut>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const elevesAvecReste = useMemo(() => (data ?? []).filter((e) => e.remaining > 0), [data]);
  const classesList = useMemo(() => listeClasses(data ?? []), [data]);
  const totalArrieres = elevesAvecReste.reduce((acc, e) => acc + e.remaining, 0);
  const enRetard = elevesAvecReste.filter((e) => e.statut === 'en_retard');
  const montantEchu = enRetard.reduce(
    (acc, e) => acc + e.echeances.filter((ech) => ech.statut === 'en_retard').reduce((s, ech) => s + ech.reste, 0),
    0
  );

  const filteredEleves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return elevesAvecReste
      .filter((e) => {
        const matchesSearch =
          !q ||
          e.nom.toLowerCase().includes(q) ||
          e.prenom.toLowerCase().includes(q) ||
          (e.matricule ?? '').toLowerCase().includes(q);
        const matchesClasse = selectedClasse === 'all' || e.classe === selectedClasse;
        const matchesStatus = statusFilter === 'all' || e.statut === statusFilter;
        return matchesSearch && matchesClasse && matchesStatus;
      })
      .sort((a, b) => b.remaining - a.remaining);
  }, [elevesAvecReste, searchQuery, selectedClasse, statusFilter]);

  useEffect(() => setCurrentPage(1), [searchQuery, selectedClasse, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEleves.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginatedEleves = filteredEleves.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Relevé des Impayés & Arriérés
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Élèves ayant un reste à payer : identifiez le solde dû et ouvrez le guichet en un clic.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total restant dû"
          amount={totalArrieres}
          unit="MRU"
          subtitle={`Sur ${elevesAvecReste.length} élèves débiteurs`}
          icon={<AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />
        <KpiCard
          title="Élèves en retard"
          amount={enRetard.length}
          unit="count"
          subtitle="Au moins une échéance échue non soldée"
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />
        <KpiCard
          title="Montant échu impayé"
          amount={montantEchu}
          unit="MRU"
          subtitle="Échéances passées non soldées"
          icon={<CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Recherche par élève ou matricule..."
              aria-label="Rechercher un élève"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={selectedClasse}
              onChange={setSelectedClasse}
              icon={<Filter className="h-4 w-4" />}
              options={[{ value: 'all', label: 'Toutes les classes' }, ...classesList.map((c) => ({ value: c, label: c }))]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
            <Select<FiltreStatut>
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'en_retard', label: 'En retard' },
                { value: 'partiel', label: 'Paiement partiel' },
                { value: 'a_jour', label: 'À jour (échéance à venir)' },
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        {elevesAvecReste.length === 0 ? (
          <EmptyState title="Aucun impayé" description="Tous les élèves ont soldé leurs échéances." className="m-6" />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Élève</th>
                    <th className="py-4 px-6">Classe</th>
                    <th className="py-4 px-6">Prochaine échéance due</th>
                    <th className="py-4 px-6 text-right">Déjà réglé</th>
                    <th className="py-4 px-6 text-right">Reste dû</th>
                    <th className="py-4 px-6 text-center">Statut</th>
                    <th className="py-4 px-6 text-right">Action guichet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedEleves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Aucun élève trouvé avec des arriérés pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    paginatedEleves.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <StudentInitials nom={e.nom} prenom={e.prenom} size="sm" />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {e.prenom} {e.nom}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">#{e.matricule ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {e.classe ?? '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 min-w-[180px] text-xs">
                          {e.prochaine_echeance ? (
                            <>
                              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{e.prochaine_echeance.libelle}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(e.prochaine_echeance.date)}</div>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-600 dark:text-slate-400 text-xs font-mono whitespace-nowrap">
                          {formatMRU(e.total_paid)}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-rose-600 dark:text-rose-400 text-sm font-mono whitespace-nowrap">
                          {formatMRU(e.remaining)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <StatusBadge statut={e.statut} />
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => onGoToGuichetWithEleve(e.id)}
                            className="h-8 px-3 bg-amber-600 hover:bg-amber-700 border-amber-600 text-white gap-1.5 text-xs font-semibold shadow-xs"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Encaisser
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEleves.length === 0 ? 0 : (page - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * itemsPerPage, filteredEleves.length)}</span> sur{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEleves.length}</span> élèves
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === p
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
