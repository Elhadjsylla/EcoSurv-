import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudentInitials } from '../components/ui/StudentInitials';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ToastNotification } from '../components/ui/ToastNotification';
import { KpiCard } from '../components/ui/KpiCard';
import { Tooltip } from '../components/ui/Tooltip';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { StudentDetailDrawer } from '../components/dashboard/StudentDetailDrawer';
import { StudentEnrollmentModal } from '../components/eleves/StudentEnrollmentModal';
import { EncaissementModal } from '../components/paiements/EncaissementModal';
import { messagePaiementEnregistre } from '../components/paiements/messages';
import { Select } from '../components/ui/Select';
import { formatMRU } from '../lib/utils';
import { formatCompactMRU } from '../lib/formatCompactMRU';
import { computeKpis, listeClasses } from '../data/aggregations';
import { useSituationsEleves } from '../data/eleves';
import { useEcole } from '../data/ecole';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ArrowUpDown,
  PlusCircle,
  Send,
  ArrowDownToLine,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  PhoneCall,
} from 'lucide-react';

interface ElevesPageProps {
  initialStatutFilter?: string;
  onFilterChange?: (statut: string) => void;
}

type Toast = { message: string; type: 'success' | 'info' | 'warning' };

export const ElevesPage: React.FC<ElevesPageProps> = ({ initialStatutFilter = 'all', onFilterChange }) => {
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const { data: ecole } = useEcole();
  const elevesList = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>(initialStatutFilter);
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'solde'>('nom');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [drawerEleveId, setDrawerEleveId] = useState<string | null>(null);
  const [paymentEleveId, setPaymentEleveId] = useState<string | null>(null);
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<Toast | null>(null);
  const [justPaidEleveId, setJustPaidEleveId] = useState<string | null>(null);
  const [isSearchPulseActive, setIsSearchPulseActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const drawerEleve = elevesList.find((e) => e.id === drawerEleveId) ?? null;
  const paymentEleve = elevesList.find((e) => e.id === paymentEleveId) ?? null;

  useEffect(() => {
    if (initialStatutFilter) setSelectedStatut(initialStatutFilter);
  }, [initialStatutFilter]);

  useEffect(() => {
    const handleDocClick = () => setOpenMenuRowId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchPulseActive(true);
        setTimeout(() => setIsSearchPulseActive(false), 1200);
      }
      if (e.key === 'Escape' && selectedEleveIds.length > 0) setSelectedEleveIds([]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEleveIds]);

  const handleStatutChange = (statut: string) => {
    setSelectedStatut(statut);
    onFilterChange?.(statut);
  };

  const kpis = useMemo(() => computeKpis(elevesList), [elevesList]);
  const classesList = useMemo(() => listeClasses(elevesList), [elevesList]);

  const filteredEleves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = elevesList.filter((e) => {
      const matchQuery =
        !q ||
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        (e.matricule ?? '').toLowerCase().includes(q) ||
        (e.tuteur?.nom ?? '').toLowerCase().includes(q);
      const matchClasse = selectedClasse === 'all' || e.classe === selectedClasse;
      const matchStatut = selectedStatut === 'all' || e.statut === selectedStatut;
      return matchQuery && matchClasse && matchStatut;
    });

    if (sortBy === 'nom') return [...result].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    if (sortBy === 'matricule') return [...result].sort((a, b) => (a.matricule ?? '').localeCompare(b.matricule ?? ''));
    return [...result].sort((a, b) => b.remaining - a.remaining);
  }, [elevesList, searchQuery, selectedClasse, selectedStatut, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClasse, selectedStatut, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredEleves.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginatedEleves = useMemo(
    () => filteredEleves.slice((page - 1) * pageSize, page * pageSize),
    [filteredEleves, page]
  );

  const isAllSelected = paginatedEleves.length > 0 && paginatedEleves.every((e) => selectedEleveIds.includes(e.id));
  const toggleSelectAll = () => setSelectedEleveIds(isAllSelected ? [] : paginatedEleves.map((e) => e.id));
  const toggleSelectEleve = (id: string) =>
    setSelectedEleveIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {activeToast && (
        <ToastNotification message={activeToast.message} type={activeToast.type} onClose={() => setActiveToast(null)} />
      )}

      {selectedEleveIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-6">
          <span className="text-xs font-bold text-slate-300">
            <span className="text-blue-400 font-mono text-sm">{selectedEleveIds.length}</span> élève(s) sélectionné(s)
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <ComingSoon detail="envoi SMS / WhatsApp">
              <Button variant="danger" size="sm" className="gap-1.5 py-1 text-xs" disabled>
                <Send className="h-3.5 w-3.5" />
                Relancer la sélection ({selectedEleveIds.length})
              </Button>
            </ComingSoon>
            <ComingSoon detail="export PDF / Excel">
              <Button variant="outline" size="sm" className="gap-1.5 py-1 text-xs border-slate-700 text-slate-200" disabled>
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Exporter
              </Button>
            </ComingSoon>
            <button onClick={() => setSelectedEleveIds([])} className="text-xs text-slate-400 hover:text-white ml-2 underline">
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gestion des Élèves & Scolarités
            </h1>
            {ecole?.annee_scolaire && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
                Année {ecole.annee_scolaire}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Registre de l'établissement et suivi des recouvrements en Ouguiya (MRU).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ComingSoon detail="import de fichiers Excel / CSV">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4" disabled>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Import Excel/CSV
            </Button>
          </ComingSoon>
          <Button variant="primary" size="sm" className="gap-2 h-10 px-4" onClick={() => setIsEnrollModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Inscrire un nouvel élève
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Effectif Total"
          amount={kpis.nombreEleves}
          unit="count"
          subtitle="Afficher tous les élèves"
          icon={<Users className="h-5 w-5" />}
          variant="primary"
          active={selectedStatut === 'all'}
          onClick={() => handleStatutChange('all')}
        />
        <KpiCard
          staggerIndex={1}
          title="Élèves En Règle"
          amount={kpis.nombrePaye + kpis.nombreAJour}
          unit="count"
          subtitle="Filtrer les élèves réglés"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          active={selectedStatut === 'paye'}
          onClick={() => handleStatutChange('paye')}
        />
        <KpiCard
          staggerIndex={2}
          title="Élèves en Retard"
          amount={kpis.nombreEnRetard}
          unit="count"
          subtitle={`Total impayés : ${formatCompactMRU(kpis.totalImpayes)}`}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          active={selectedStatut === 'en_retard'}
          onClick={() => handleStatutChange('en_retard')}
        />
        <KpiCard
          staggerIndex={3}
          title="Recouvrement Global"
          progress={kpis.tauxRecouvrement}
          subtitle="Filtrer les dossiers partiels"
          icon={<CreditCard className="h-5 w-5" />}
          variant="warning"
          active={selectedStatut === 'partiel'}
          onClick={() => handleStatutChange('partiel')}
        />
      </div>

      {/* Filtres */}
      <Card className="p-5 sm:p-6 space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un élève, matricule, tuteur... (Touche '/')"
              aria-label="Rechercher un élève"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-10 pl-10 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 ${
                isSearchPulseActive ? 'animate-search-focus ring-2 ring-blue-500' : ''
              }`}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
              /
            </kbd>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedClasse}
              onChange={setSelectedClasse}
              icon={<Filter className="h-4 w-4" />}
              options={[
                { value: 'all', label: `Toutes les classes (${classesList.length})` },
                ...classesList.map((c) => ({ value: c, label: c })),
              ]}
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
            <Select
              value={selectedStatut}
              onChange={handleStatutChange}
              options={[
                { value: 'all', label: 'Tous statuts financiers' },
                { value: 'paye', label: 'Réglé (Payé)' },
                { value: 'en_retard', label: 'En retard' },
                { value: 'partiel', label: 'Partiel' },
                { value: 'a_jour', label: 'À jour' },
              ]}
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as 'nom' | 'matricule' | 'solde')}
              icon={<ArrowUpDown className="h-3.5 w-3.5" />}
              options={[
                { value: 'nom', label: 'Trier par Nom (A-Z)' },
                { value: 'matricule', label: 'Trier par Matricule' },
                { value: 'solde', label: 'Trier par Solde Dû' },
              ]}
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>
      </Card>

      {elevesList.length === 0 ? (
        <EmptyState
          title="Aucun élève inscrit"
          description="Inscrivez un premier élève pour commencer à suivre sa scolarité."
        />
      ) : (
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {filteredEleves.length} élève(s) au registre
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Cliquez sur un élève pour ouvrir son dossier individuel.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Sélectionner la page"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-4">Élève</th>
                  <th className="py-4 px-4">Tuteur Légal</th>
                  <th className="py-4 px-4 hidden md:table-cell">Lieu de naissance</th>
                  <th className="py-4 px-4 text-center">Statut</th>
                  <th className="py-4 px-4 text-right">Solde Dû</th>
                  <th className="py-4 px-4 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {paginatedEleves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                      Aucun élève ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  paginatedEleves.map((eleve) => {
                    const isChecked = selectedEleveIds.includes(eleve.id);
                    const isMenuOpen = openMenuRowId === eleve.id;

                    return (
                      <tr
                        key={eleve.id}
                        onClick={() => setDrawerEleveId(eleve.id)}
                        className={`cursor-pointer transition-all duration-200 group ${
                          justPaidEleveId === eleve.id
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-400'
                            : isChecked
                            ? 'bg-blue-50/60 dark:bg-blue-950/40'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectEleve(eleve.id)}
                            aria-label={`Sélectionner ${eleve.prenom} ${eleve.nom}`}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3.5">
                            <StudentInitials nom={eleve.nom} prenom={eleve.prenom} />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-snug text-sm">
                                {eleve.prenom} {eleve.nom}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                <span>#{eleve.matricule ?? '—'}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-400">{eleve.classe ?? '—'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {eleve.tuteur ? (
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{eleve.tuteur.nom}</div>
                              <div className="text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 text-[11px]">
                                <PhoneCall className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{eleve.tuteur.telephone ?? 'Non renseigné'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Aucun tuteur rattaché</span>
                          )}
                        </td>

                        <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {eleve.lieu_naissance ?? '—'}
                        </td>

                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <StatusBadge statut={eleve.statut} />
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-black whitespace-nowrap text-xs">
                          {eleve.remaining > 0 ? (
                            <Tooltip content={formatMRU(eleve.remaining)}>
                              <span className="text-rose-600 dark:text-rose-400 cursor-help">
                                {eleve.remaining >= 100000 ? formatCompactMRU(eleve.remaining) : formatMRU(eleve.remaining)}
                              </span>
                            </Tooltip>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Soldé</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <Tooltip content="Options">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuRowId(isMenuOpen ? null : eleve.id);
                              }}
                              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto"
                              aria-label="Options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </Tooltip>

                          {isMenuOpen && (
                            <div className="absolute right-4 top-10 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => {
                                  setOpenMenuRowId(null);
                                  setDrawerEleveId(eleve.id);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Voir la fiche élève</span>
                              </button>

                              {eleve.remaining > 0 && (
                                <>
                                  <button
                                    onClick={() => {
                                      setOpenMenuRowId(null);
                                      setPaymentEleveId(eleve.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
                                  >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span>Enregistrer un paiement</span>
                                  </button>
                                  <ComingSoon detail="envoi SMS / WhatsApp" side="left" className="flex w-full">
                                    <button
                                      disabled
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-700 dark:text-rose-400 font-semibold disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                      <span>Envoyer relance SMS</span>
                                    </button>
                                  </ComingSoon>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Affichage de{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredEleves.length === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>{' '}
              à{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(page * pageSize, filteredEleves.length)}
              </span>{' '}
              sur <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEleves.length}</span> élèves
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Précédent</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                    page === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Suivant</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentDetailDrawer
        eleve={drawerEleve}
        onClose={() => setDrawerEleveId(null)}
        onEncaisser={(eleve) => {
          setDrawerEleveId(null);
          setPaymentEleveId(eleve.id);
        }}
      />

      <StudentEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        classesList={classesList}
        anneeScolaire={ecole?.annee_scolaire ?? null}
        onEnrolled={(eleve) => {
          setActiveToast({ message: `Élève ${eleve.prenom} ${eleve.nom} inscrit avec succès.`, type: 'success' });
          setDrawerEleveId(eleve.id);
        }}
      />

      <EncaissementModal
        eleve={paymentEleve}
        onClose={() => setPaymentEleveId(null)}
        onSaved={(paiement, eleve) => {
          setActiveToast(messagePaiementEnregistre(paiement, eleve));
          setJustPaidEleveId(eleve.id);
          setTimeout(() => setJustPaidEleveId(null), 1400);
        }}
      />
    </div>
  );
};
