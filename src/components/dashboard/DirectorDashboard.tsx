import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  MOCK_ELEVES,
  getDashboardKpis,
  EleveWithStats,
} from '../../lib/mockData';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { StudentInitials } from '../ui/StudentInitials';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ToastNotification } from '../ui/ToastNotification';
import { Select } from '../ui/Select';
import { formatMRU } from '../../lib/utils';
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
  Check,
  Zap,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';
import { ConfirmBulkRelanceModal } from './ConfirmBulkRelanceModal';
import { StudentDetailDrawer } from './StudentDetailDrawer';

interface DirectorDashboardProps {
  onNavigateToEleves?: (statutFilter: string) => void;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  onNavigateToEleves,
}) => {
  const [elevesList, setElevesList] = useState<EleveWithStats[]>(MOCK_ELEVES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedEleveModal, setSelectedEleveModal] = useState<EleveWithStats | null>(null);
  const [paymentModalEleve, setPaymentModalEleve] = useState<EleveWithStats | null>(null);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Pagination & Context Menu
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    const handleDocClick = () => setOpenMenuRowId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Micro-interactions state
  const [justPaidEleveId, setJustPaidEleveId] = useState<string | null>(null);
  const [isSearchPulseActive, setIsSearchPulseActive] = useState(false);

  // Bulk selection state
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);

  // Ref pour le raccourci clavier "/"
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Écoute des raccourcis clavier: "/" pour rechercher, "Échap" pour fermer les modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Touche "/" pour focus recherche
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

      // Touche "Escape" pour fermer les modales/panneaux
      if (e.key === 'Escape') {
        if (selectedEleveModal) setSelectedEleveModal(null);
        if (paymentModalEleve) setPaymentModalEleve(null);
        if (selectedEleveIds.length > 0) setSelectedEleveIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEleveModal, paymentModalEleve, selectedEleveIds]);

  // Calcul dynamique des KPIs
  const kpis = useMemo(() => getDashboardKpis(elevesList), [elevesList]);

  // Classes uniques
  const classesList = useMemo(() => {
    const set = new Set(elevesList.map((e) => e.classe));
    return Array.from(set);
  }, [elevesList]);

  // Filtrage des élèves
  const filteredEleves = useMemo(() => {
    return elevesList.filter((e) => {
      const matchQuery =
        e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.nom_tuteur.toLowerCase().includes(searchQuery.toLowerCase());

      const matchClasse = selectedClasse === 'all' || e.classe === selectedClasse;
      const matchStatut = selectedStatut === 'all' || e.statut === selectedStatut;

      return matchQuery && matchClasse && matchStatut;
    });
  }, [elevesList, searchQuery, selectedClasse, selectedStatut]);

  // Réinitialiser la page si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClasse, selectedStatut]);

  // Données paginées
  const totalPages = Math.ceil(filteredEleves.length / pageSize) || 1;
  const paginatedEleves = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEleves.slice(start, start + pageSize);
  }, [filteredEleves, currentPage, pageSize]);

  // Gestion de la sélection multiple
  const isAllSelected =
    paginatedEleves.length > 0 &&
    paginatedEleves.every((e) => selectedEleveIds.includes(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEleveIds([]);
    } else {
      setSelectedEleveIds(paginatedEleves.map((e) => e.id));
    }
  };

  const toggleSelectEleve = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedEleveIds.includes(id)) {
      setSelectedEleveIds(selectedEleveIds.filter((item) => item !== id));
    } else {
      setSelectedEleveIds([...selectedEleveIds, id]);
    }
  };

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setActiveToast({ message, type });
  };

  // Célébration discrète par confetti
  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 38,
        spread: 55,
        origin: { y: 0.72 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#059669'],
        disableForReducedMotion: true,
        ticks: 130,
        scalar: 0.85,
      });
    } catch {
      // Ignorer si bloqué par l'environnement
    }
  };

  // Action rapide : Relance individuelle
  const triggerRelance = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRelancedStudentIds((prev) => Array.from(new Set([...prev, eleve.id])));
    showToast(
      `Rappel SMS/WhatsApp envoyé au tuteur de ${eleve.prenom} ${eleve.nom} (${eleve.telephone_tuteur})`,
      'info'
    );
  };

  // Action rapide : Marquer payé express (1 clic) avec célébration immédiate
  const triggerMarquerPayeExpress = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJustPaidEleveId(eleve.id);
    triggerConfettiCelebration();

    setElevesList((prev) =>
      prev.map((item) => {
        if (item.id === eleve.id) {
          const newPaid = item.total_due;
          return {
            ...item,
            total_paid: newPaid,
            remaining: 0,
            statut: 'paye',
            timeline_paiements: [
              {
                id: `pay-express-${Date.now()}`,
                libelle: 'Encaissement Express (Comptant)',
                montant: item.remaining || 15000,
                date: new Date().toLocaleDateString('fr-FR'),
                methode: 'especes',
                statut: 'regle',
                recu_ref: `REC-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
              },
              ...item.timeline_paiements,
            ],
          };
        }
        return item;
      })
    );

    showToast(
      `✓ Solde de ${eleve.prenom} ${eleve.nom} marqué comme réglé intégralement (${formatMRU(
        eleve.remaining
      )})`,
      'success'
    );
    setTimeout(() => setJustPaidEleveId(null), 1400);
  };

  // Export & Relance modal state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSendingRelance, setIsSendingRelance] = useState(false);
  const [relancedStudentIds, setRelancedStudentIds] = useState<string[]>([]);

  // Export PDF réactif avec spinner et confirmation toast
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      setIsExportingPdf(false);
      showToast('✓ Rapport de synthèse PDF généré et téléchargé avec succès !', 'success');
    }, 850);
  };

  // Confirmation relance groupée
  const handleConfirmBulkRelance = () => {
    setIsSendingRelance(true);
    setTimeout(() => {
      setIsSendingRelance(false);
      setIsConfirmModalOpen(false);
      triggerConfettiCelebration();
      const overdueIds = elevesList
        .filter((e) => e.statut === 'en_retard' || e.statut === 'partiel')
        .map((e) => e.id);
      setRelancedStudentIds((prev) => Array.from(new Set([...prev, ...overdueIds])));
      showToast(
        `⚡ Campagne de relance envoyée avec succès à ${kpis.nombreEnRetard} familles !`,
        'info'
      );
    }, 900);
  };

  // Actions groupées (Bulk actions)
  const handleBulkRelance = () => {
    const count = selectedEleveIds.length;
    if (count === 0) return;
    setRelancedStudentIds((prev) => Array.from(new Set([...prev, ...selectedEleveIds])));
    showToast(
      `⚡ Campagne de relance envoyée avec succès à ${count} tuteur(s) d'élèves présélectionnés.`,
      'info'
    );
    setSelectedEleveIds([]);
  };

  // Action groupée : Exporter la sélection
  const handleBulkExport = () => {
    const count = selectedEleveIds.length;
    showToast(`✓ Export du rapport comptable pour ${count} élève(s) généré avec succès.`, 'info');
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {/* Toast de confirmation réactif animé */}
      {activeToast && (
        <ToastNotification
          message={activeToast.message}
          type={activeToast.type}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectedEleveIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-6">
          <span className="text-xs font-bold text-slate-300">
            <span className="text-blue-400 font-mono text-sm">{selectedEleveIds.length}</span> élève(s) sélectionné(s)
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              className="gap-1.5 py-1 text-xs"
              onClick={handleBulkRelance}
            >
              <Send className="h-3.5 w-3.5" />
              Relancer la sélection ({selectedEleveIds.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 py-1 text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
              onClick={handleBulkExport}
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Exporter
            </Button>

            <button
              onClick={() => setSelectedEleveIds([])}
              className="text-xs text-slate-400 hover:text-white ml-2 underline"
            >
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
            Suivi en temps réel du recouvrement et de la situation financière des élèves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 px-4"
            loading={isExportingPdf}
            loadingText="Génération PDF..."
            onClick={handleExportPdf}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Exporter Rapport PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 h-10 px-4"
            onClick={() => setIsConfirmModalOpen(true)}
          >
            <Send className="h-4 w-4" />
            Relancer tous les impayés ({kpis.nombreEnRetard})
          </Button>
        </div>
      </div>

      {/* Cartes KPI Interactives (Raccourcis de filtrage) avec apparition échelonnée */}
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
            if (onNavigateToEleves) onNavigateToEleves('all');
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
            if (onNavigateToEleves) onNavigateToEleves('paye');
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
            if (onNavigateToEleves) onNavigateToEleves('en_retard');
          }}
        />

        <KpiCard
          staggerIndex={3}
          title="Taux de Recouvrement"
          progress={kpis.tauxRecouvrement}
          subtitle={`Objectif trimestre: 85%`}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          active={selectedStatut === 'partiel'}
          onClick={() => {
            setSelectedStatut('partiel');
            if (onNavigateToEleves) onNavigateToEleves('partiel');
          }}
        />
      </div>

      {/* Roster Controls: Search, Filters, Stats Summary */}
      <Card className="p-5 sm:p-6 space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar avec raccourci clavier "/" */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher par mot-clé (nom, tuteur, matricule)..."
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by class */}
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

            {/* Filter by status */}
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

        {/* Status count chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          <span className="text-slate-400 dark:text-slate-500 mr-2 text-[11px] font-bold uppercase tracking-wider">
            Filtres rapides :
          </span>
          <button
            onClick={() => setSelectedStatut('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tous ({filteredEleves.length})
          </button>
          <button
            onClick={() => setSelectedStatut('paye')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'paye'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'
            }`}
          >
            Payés ({filteredEleves.filter((e) => e.statut === 'paye').length})
          </button>
          <button
            onClick={() => setSelectedStatut('en_retard')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'en_retard'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100'
            }`}
          >
            En retard ({filteredEleves.filter((e) => e.statut === 'en_retard').length})
          </button>
          <button
            onClick={() => setSelectedStatut('partiel')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'partiel'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            Partiels ({filteredEleves.filter((e) => e.statut === 'partiel').length})
          </button>
        </div>
      </Card>

      {/* Data Table (Nexoov Style) */}
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
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-5">Élève</th>
                <th className="py-4 px-5">Tuteur Légal</th>
                <th className="py-4 px-5">Ville / Quartier</th>
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
                  const isJustPaid = justPaidEleveId === eleve.id;
                  const isMenuOpen = openMenuRowId === eleve.id;

                  return (
                    <tr
                      key={eleve.id}
                      className={`transition-all duration-200 group cursor-pointer ${
                        isJustPaid
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-400'
                          : isChecked
                          ? 'bg-blue-50/60 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => setSelectedEleveModal(eleve)}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Élève (Nom en gras + matricule/classe en sous-titre) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <StudentInitials nom={eleve.nom} prenom={eleve.prenom} />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-snug text-sm">
                              {eleve.prenom} {eleve.nom}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>#{eleve.matricule}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">{eleve.classe}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tuteur Légal */}
                      <td className="py-4 px-5">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{eleve.nom_tuteur}</div>
                          <div className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                            <PhoneCall className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{eleve.telephone_tuteur}</span>
                          </div>
                        </div>
                      </td>

                      {/* Ville */}
                      <td className="py-4 px-5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Tevragh-Zeina
                      </td>

                      {/* Statut Badge en pilule avec point */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge statut={eleve.statut} />
                          {relancedStudentIds.includes(eleve.id) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 animate-in fade-in zoom-in-95">
                              <Check className="h-3 w-3" /> Relancé
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Montant Attendu */}
                      <td className="py-4 px-5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {formatMRU(eleve.total_due)}
                      </td>

                      {/* Reste à payer */}
                      <td className="py-4 px-5 text-right font-mono font-black text-xs">
                        {eleve.remaining > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">{formatMRU(eleve.remaining)}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Soldé</span>
                        )}
                      </td>

                      {/* Context Menu "..." Button */}
                      <td
                        className="py-4 px-5 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuRowId(isMenuOpen ? null : eleve.id);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto"
                          title="Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-6 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                setSelectedEleveModal(eleve);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                              <span>Voir la fiche élève</span>
                            </button>

                            {eleve.remaining > 0 && (
                              <>
                                <button
                                  onClick={(e) => {
                                    setOpenMenuRowId(null);
                                    triggerMarquerPayeExpress(eleve, e);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
                                >
                                  <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                                  <span>Encaisser express</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    setOpenMenuRowId(null);
                                    triggerRelance(eleve, e);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold"
                                >
                                  <Send className="h-3.5 w-3.5 text-rose-600" />
                                  <span>Envoyer relance SMS</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                window.print();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                              <span>Imprimer reçu</span>
                            </button>
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

        {/* Numbered Pagination (Nexoov Style) */}
        <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Affichage de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredEleves.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            à{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredEleves.length)}
            </span>{' '}
            sur <span className="font-bold text-slate-800 dark:text-slate-200">{filteredEleves.length}</span> élèves
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Panneau Latéral Coulissant Élève (Slide-Over Nexoov Style) */}
      <StudentDetailDrawer
        eleve={selectedEleveModal}
        onClose={() => setSelectedEleveModal(null)}
        onQuickPay={triggerMarquerPayeExpress}
        onQuickRelance={triggerRelance}
      />

      {/* Modale de Confirmation de Relance Groupée */}
      <ConfirmBulkRelanceModal
        isOpen={isConfirmModalOpen}
        count={kpis.nombreEnRetard}
        totalAmount={kpis.totalImpayes}
        isSending={isSendingRelance}
        onConfirm={handleConfirmBulkRelance}
        onClose={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
