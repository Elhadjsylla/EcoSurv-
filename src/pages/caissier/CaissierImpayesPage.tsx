import React, { useState, useMemo } from 'react';
import { MOCK_ELEVES, EleveWithStats } from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { KpiCard } from '../../components/ui/KpiCard';
import { formatMRU } from '../../lib/utils';
import {
  AlertCircle,
  Search,
  CreditCard,
  Phone,
  Filter,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CaissierImpayesPageProps {
  onGoToGuichetWithEleve: (eleveId: string) => void;
}

export const CaissierImpayesPage: React.FC<CaissierImpayesPageProps> = ({
  onGoToGuichetWithEleve,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_retard' | 'partiel'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtrer uniquement les élèves qui ont un reste à payer
  const elevesAvecReste = useMemo(() => {
    return MOCK_ELEVES.filter((e) => e.remaining > 0);
  }, []);

  const classesList = useMemo(() => {
    const set = new Set(MOCK_ELEVES.map((e) => e.classe));
    return Array.from(set).sort();
  }, []);

  // Total des arriérés
  const totalArrieres = useMemo(() => {
    return elevesAvecReste.reduce((acc, e) => acc + e.remaining, 0);
  }, [elevesAvecReste]);

  const nbRetards = useMemo(() => {
    return elevesAvecReste.filter((e) => e.statut === 'en_retard').length;
  }, [elevesAvecReste]);

  // Filtrage combiné
  const filteredEleves = useMemo(() => {
    return elevesAvecReste.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.telephone_tuteur.includes(q) ||
        e.nom_tuteur.toLowerCase().includes(q);

      const matchesClasse =
        selectedClasse === 'all' || e.classe === selectedClasse;

      const matchesStatus =
        statusFilter === 'all' || e.statut === statusFilter;

      return matchesSearch && matchesClasse && matchesStatus;
    });
  }, [elevesAvecReste, searchQuery, selectedClasse, statusFilter]);

  const totalPages = Math.ceil(filteredEleves.length / itemsPerPage) || 1;
  const paginatedEleves = filteredEleves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Recouvrement Guichet
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Consultation des Soldes Dûs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Relevé des Impayés & Arriérés
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recherchez un parent ou élève au guichet pour identifier immédiatement le solde restant dû et encaisser en un clic.
          </p>
        </div>
      </div>

      {/* 3 Pastel KPI Cards (Nexoov Style with Amber/Rose accents) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total des Arriérés Dûs"
          amount={totalArrieres}
          unit="MRU"
          subtitle={`Sur ${elevesAvecReste.length} élèves débiteurs`}
          icon={<AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />

        <KpiCard
          title="Élèves en Retard Critique"
          amount={nbRetards}
          unit="count"
          subtitle="Échéances échues sans versement"
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />

        <KpiCard
          title="Guichet d'Encaissement"
          customValue="Orientation Immédiate"
          subtitle="Charger le dossier au guichet en 1 clic"
          icon={<CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
      </div>

      {/* Table & Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {/* Search and filters bar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Recherche par élève, tuteur, n° téléphone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={selectedClasse}
              onChange={(v) => {
                setSelectedClasse(v);
                setCurrentPage(1);
              }}
              icon={<Filter className="h-4 w-4" />}
              options={[
                { value: 'all', label: 'Toutes les classes' },
                ...classesList.map((c) => ({ value: c, label: c })),
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />

            <Select<'all' | 'en_retard' | 'partiel'>
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'en_retard', label: 'En retard uniquement' },
                { value: 'partiel', label: 'Paiement partiel' },
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Élève</th>
                <th className="py-4 px-6">Classe</th>
                <th className="py-4 px-6">Contact Tuteur</th>
                <th className="py-4 px-6 text-right">Déjà Réglé</th>
                <th className="py-4 px-6 text-right">Reste Dû</th>
                <th className="py-4 px-6 text-center">Statut</th>
                <th className="py-4 px-6 text-right">Action Guichet</th>
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
                paginatedEleves.map((e: EleveWithStats) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* 2-line student display + avatar */}
                    <td className="py-4.5 px-6 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <StudentInitials nom={e.nom} prenom={e.prenom} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {e.prenom} {e.nom}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                            #{e.matricule}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {e.classe}
                      </span>
                    </td>

                    <td className="py-4.5 px-6 min-w-[200px]">
                      <div className="text-slate-800 dark:text-slate-200 text-xs font-semibold truncate">
                        {e.nom_tuteur} ({e.lien_parente})
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                        <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{e.telephone_tuteur}</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-right font-semibold text-slate-600 dark:text-slate-400 text-xs font-mono whitespace-nowrap">
                      {formatMRU(e.total_paid)}
                    </td>

                    <td className="py-4.5 px-6 text-right font-black text-rose-600 dark:text-rose-400 text-sm font-mono whitespace-nowrap">
                      {formatMRU(e.remaining)}
                    </td>

                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      {e.statut === 'en_retard' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          En retard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Partiel
                        </span>
                      )}
                    </td>

                    <td className="py-4.5 px-6 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => onGoToGuichetWithEleve(e.id)}
                        className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs font-semibold shadow-xs"
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

        {/* Numbered Pagination */}
        <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Affichage de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredEleves.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            à{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredEleves.length)}
            </span>{' '}
            sur{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredEleves.length}
            </span>{' '}
            élèves
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Précédent
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Suivant
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
