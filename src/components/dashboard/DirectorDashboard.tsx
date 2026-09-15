import React, { useState, useMemo, useEffect, useRef } from 'react';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { StudentInitials } from '../ui/StudentInitials';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ToastNotification } from '../ui/ToastNotification';
import { Select } from '../ui/Select';
import { Tooltip } from '../ui/Tooltip';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../ui/DataState';
import { formatMRU } from '../../lib/utils';
import { formatDate } from '../../lib/format';
import { computeKpis, listeClasses } from '../../data/aggregations';
import { useSituationsEleves } from '../../data/eleves';
import type { EleveSituation } from '../../types/domain';
import { StudentDetailDrawer } from './StudentDetailDrawer';
import { EncaissementModal } from '../paiements/EncaissementModal';
import { messagePaiementEnregistre } from '../paiements/messages';
import {
  Search,
  Filter,
  PhoneCall,
  Send,
  ArrowDownToLine,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
} from 'lucide-react';

interface DirectorDashboardProps {
  onNavigateToEleves?: (statutFilter: string) => void;
}

type Toast = { message: string; type: 'success' | 'info' | 'warning' };

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ onNavigateToEleves }) => {
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const elevesList = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [drawerEleveId, setDrawerEleveId] = useState<string | null>(null);
  const [paymentEleveId, setPaymentEleveId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<Toast | null>(null);

  // Pagination & Context Menu
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [justPaidEleveId, setJustPaidEleveId] = useState<string | null>(null);
  const [isSearchPulseActive, setIsSearchPulseActive] = useState(false);
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Les fiches ouvertes suivent les données rafraîchies (après un paiement notamment).
  const drawerEleve = elevesList.find((e) => e.id === drawerEleveId) ?? null;
  const paymentEleve = elevesList.find((e) => e.id === paymentEleveId) ?? null;

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    const handleDocClick = () => setOpenMenuRowId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Raccourcis clavier : "/" pour rechercher, "Échap" pour désélectionner
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

  const kpis = useMemo(() => computeKpis(elevesList), [elevesList]);
  const classesList = useMemo(() => listeClasses(elevesList), [elevesList]);

  const filteredEleves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return elevesList.filter((e) => {
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
  }, [elevesList, searchQuery, selectedClasse, selectedStatut]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClasse, selectedStatut]);

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

  const handlePaiementEnregistre = (eleve: EleveSituation, paiement: Parameters<typeof messagePaiementEnregistre>[0]) => {
    setActiveToast(messagePaiementEnregistre(paiement, eleve));
    setJustPaidEleveId(eleve.id);
    setTimeout(() => setJustPaidEleveId(null), 1400);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {activeToast && (
        <ToastNotification message={activeToast.message} type={activeToast.type} onClose={() => setActiveToast(null)} />
      )}

      {/* Floating Bulk Action Bar */}
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

      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tableau de Bord de Direction
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Suivi du recouvrement et de la situation financière des élèves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ComingSoon detail="export PDF">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4" disabled>
              <ArrowDownToLine className="h-4 w-4" />
              Exporter Rapport PDF
            </Button>
          </ComingSoon>
          <ComingSoon detail="envoi SMS / WhatsApp">
            <Button variant="primary" size="sm" className="gap-2 h-10 px-4" disabled>
              <Send className="h-4 w-4" />
              Relancer tous les impayés ({kpis.nombreEnRetard})
            </Button>
          </ComingSoon>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Total Scolarités Attendues"
          amount={kpis.totalAttendu}
          unit="MRU"
          subtitle={`Pour les ${kpis.nombreEleves} élèves inscrits`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
          active={selectedStatut === 'all'}
          onClick={() => {
            setSelectedStatut('all');
            onNavigateToEleves?.('all');
          }}
        />
        <KpiCard
          staggerIndex={1}
          title="Total Encaissé"
          amount={kpis.totalEncaisse}
          unit="MRU"
          subtitle={`${kpis.nombrePaye} élèves réglés intégralement`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          progress={kpis.tauxRecouvrement}
          active={selectedStatut === 'paye'}
          onClick={() => {
            setSelectedStatut('paye');
            onNavigateToEleves?.('paye');
          }}
        />
        <KpiCard
          staggerIndex={2}
          title="Reste à Recouvrer (Impayés)"
          amount={kpis.totalImpayes}
          unit="MRU"
          subtitle={`${kpis.nombreEnRetard} élèves actuellement en retard`}
          icon={<AlertCircle className="h-5 w-5" />}
          variant="danger"
          active={selectedStatut === 'en_retard'}
          onClick={() => {
            setSelectedStatut('en_retard');
            onNavigateToEleves?.('en_retard');
          }}
        />
        <KpiCard
          staggerIndex={3}
          title="Taux de Recouvrement"
          progress={kpis.tauxRecouvrement}
          subtitle={`${kpis.nombrePartiel} élèves en paiement partiel`}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          active={selectedStatut === 'partiel'}
          onClick={() => {
            setSelectedStatut('partiel');
            onNavigateToEleves?.('partiel');
          }}
        />
      </div>

      {/* Roster Controls */}
      <Card className="p-5 sm:p-6 space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher par mot-clé (nom, tuteur, matricule)..."
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
              onChange={setSelectedStatut}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'paye', label: 'Réglé (Payé)' },
                { value: 'en_retard', label: 'En retard' },
                { value: 'partiel', label: 'Partiel' },
                { value: 'a_jour', label: 'À jour' },
              ]}
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          <span className="text-slate-400 dark:text-slate-500 mr-2 text-[11px] font-bold uppercase tracking-wider">
            Filtres rapides :
          </span>
          {(
            [
              ['all', 'Tous', 'bg-slate-900 text-white dark:bg-white dark:text-slate-900', 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'],
              ['paye', 'Payés', 'bg-emerald-600 text-white', 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'],
              ['en_retard', 'En retard', 'bg-rose-600 text-white', 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100'],
              ['partiel', 'Partiels', 'bg-amber-600 text-white', 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100'],
            ] as const
          ).map(([statut, label, actif, inactif]) => (
            <button
              key={statut}
              onClick={() => setSelectedStatut(statut)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${selectedStatut === statut ? `${actif} shadow-xs` : inactif}`}
            >
              {label} ({statut === 'all' ? filteredEleves.length : filteredEleves.filter((e) => e.statut === statut).length})
            </button>
          ))}
        </div>
      </Card>

      {elevesList.length === 0 ? (
        <EmptyState
          title="Aucun élève inscrit"
          description="Les élèves inscrits dans votre établissement apparaîtront ici avec leur situation financière."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Sélectionner la page"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-5">Élève</th>
                  <th className="py-4 px-5">Tuteur Légal</th>
                  <th className="py-4 px-5">Prochaine échéance</th>
                  <th className="py-4 px-5 text-center">Statut</th>
                  <th className="py-4 px-5 text-right">Attendu</th>
                  <th className="py-4 px-5 text-right">Reste</th>
                  <th className="py-4 px-5 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedEleves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-500 dark:text-slate-400 font-medium">
                      Aucun élève trouvé correspondant à vos critères de recherche.
                    </td>
                  </tr>
                ) : (
                  paginatedEleves.map((eleve) => {
                    const isChecked = selectedEleveIds.includes(eleve.id);
                    const isMenuOpen = openMenuRowId === eleve.id;

                    return (
                      <tr
                        key={eleve.id}
                        className={`transition-all duration-200 group cursor-pointer ${
                          justPaidEleveId === eleve.id
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-400'
                            : isChecked
                            ? 'bg-blue-50/60 dark:bg-blue-950/40'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => setDrawerEleveId(eleve.id)}
                      >
                        <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectEleve(eleve.id)}
                            aria-label={`Sélectionner ${eleve.prenom} ${eleve.nom}`}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-4 px-5">
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

                        <td className="py-4 px-5">
                          {eleve.tuteur ? (
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{eleve.tuteur.nom}</div>
                              <div className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                                <PhoneCall className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{eleve.tuteur.telephone ?? 'Non renseigné'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Aucun tuteur rattaché</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {eleve.prochaine_echeance ? (
                            <>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatDate(eleve.prochaine_echeance.date)}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{eleve.prochaine_echeance.libelle}</div>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">
                          <StatusBadge statut={eleve.statut} />
                        </td>

                        <td className="py-4 px-5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          {formatMRU(eleve.total_due)}
                        </td>

                        <td className="py-4 px-5 text-right font-mono font-black text-xs">
                          {eleve.remaining > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{formatMRU(eleve.remaining)}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Soldé</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center relative" onClick={(e) => e.stopPropagation()}>
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
                            <div className="absolute right-6 top-10 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => {
                                  setOpenMenuRowId(null);
                                  setDrawerEleveId(eleve.id);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-600" />
                                <span>Voir la fiche élève</span>
                              </button>

                              {eleve.remaining > 0 && (
                                <>
                                  <button
                                    onClick={() => {
                                      setOpenMenuRowId(null);
                                      setPaymentEleveId(eleve.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
                                  >
                                    <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Enregistrer un paiement</span>
                                  </button>
                                  <ComingSoon detail="envoi SMS / WhatsApp" side="left" className="flex w-full">
                                    <button
                                      disabled
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-700 dark:text-rose-400 font-semibold disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                      <Send className="h-3.5 w-3.5 text-rose-600" />
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

          {/* Pagination */}
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

      <EncaissementModal
        eleve={paymentEleve}
        onClose={() => setPaymentEleveId(null)}
        onSaved={(paiement, eleve) => handlePaiementEnregistre(eleve, paiement)}
      />
    </div>
  );
};
