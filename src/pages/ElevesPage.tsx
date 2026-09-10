import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  MOCK_ELEVES,
  EleveWithStats,
  getDashboardKpis,
} from '../lib/mockData';
import { StudentInitials } from '../components/ui/StudentInitials';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ToastNotification } from '../components/ui/ToastNotification';
import { KpiCard } from '../components/ui/KpiCard';
import { StudentDetailDrawer } from '../components/dashboard/StudentDetailDrawer';
import { formatMRU } from '../lib/utils';
import { formatCompactMRU } from '../lib/formatCompactMRU';
import { StudentEnrollmentModal } from '../components/eleves/StudentEnrollmentModal';
import { Select } from '../components/ui/Select';
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
  X,
  PlusCircle,
  Zap,
  Send,
  ArrowDownToLine,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  PhoneCall,
} from 'lucide-react';

interface ElevesPageProps {
  initialStatutFilter?: string;
  onFilterChange?: (statut: string) => void;
}

export const ElevesPage: React.FC<ElevesPageProps> = ({
  initialStatutFilter = 'all',
  onFilterChange,
}) => {
  const [elevesList, setElevesList] = useState<EleveWithStats[]>(MOCK_ELEVES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>(initialStatutFilter);
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'solde'>('nom');

  // Pagination (Nexoov Style)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Context Menu & Drawer
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [drawerEleve, setDrawerEleve] = useState<EleveWithStats | null>(null);

  // Sélection multiple (Bulk selection)
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);

  // Modales & Toasts
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [paymentModalEleve, setPaymentModalEleve] = useState<EleveWithStats | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bankily');
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Micro-interactions & animations state
  const [justPaidEleveId, setJustPaidEleveId] = useState<string | null>(null);
  const [relancingId, setRelancingId] = useState<string | null>(null);
  const [isSearchPulseActive, setIsSearchPulseActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      showToast("✓ Module d'import prêt : Sélectionnez un fichier .xlsx ou .csv conforme.", 'info');
    }, 650);
  };

  // Ref pour le raccourci clavier "/"
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Écoute du filtre initial passé en prop
  useEffect(() => {
    if (initialStatutFilter) {
      setSelectedStatut(initialStatutFilter);
    }
  }, [initialStatutFilter]);

  // Raccourcis clavier "/" et "Échap"
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

      // Touche "Escape" pour fermer les modales ou désélectionner
      if (e.key === 'Escape') {
        if (isEnrollModalOpen) setIsEnrollModalOpen(false);
        if (paymentModalEleve) setPaymentModalEleve(null);
        if (selectedEleveIds.length > 0) setSelectedEleveIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnrollModalOpen, paymentModalEleve, selectedEleveIds]);

  // Notification des changements de filtre
  const handleStatutChange = (statut: string) => {
    setSelectedStatut(statut);
    if (onFilterChange) onFilterChange(statut);
  };

  // KPIs
  const kpis = useMemo(() => getDashboardKpis(elevesList), [elevesList]);

  // Classes disponibles
  const classesList = useMemo(() => {
    const set = new Set(elevesList.map((e) => e.classe));
    return Array.from(set);
  }, [elevesList]);

  // Filtrage et Tri
  const filteredEleves = useMemo(() => {
    let result = elevesList.filter((e) => {
      const matchQuery =
        e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.nom_tuteur.toLowerCase().includes(searchQuery.toLowerCase());

      const matchClasse = selectedClasse === 'all' || e.classe === selectedClasse;
      const matchStatut = selectedStatut === 'all' || e.statut === selectedStatut;

      return matchQuery && matchClasse && matchStatut;
    });

    if (sortBy === 'nom') {
      result = [...result].sort((a, b) => a.nom.localeCompare(b.nom));
    } else if (sortBy === 'matricule') {
      result = [...result].sort((a, b) => a.matricule.localeCompare(b.matricule));
    } else if (sortBy === 'solde') {
      result = [...result].sort((a, b) => b.remaining - a.remaining);
    }

    return result;
  }, [elevesList, searchQuery, selectedClasse, selectedStatut, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClasse, selectedStatut, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredEleves.length / pageSize));
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
      // Ignorer si bloqué
    }
  };

  // Inscription d'un nouvel élève
  const handleEnrollStudent = (newEleve: EleveWithStats) => {
    setElevesList((prev) => [newEleve, ...prev]);
    setDrawerEleve(newEleve);
    showToast(`Élève ${newEleve.prenom} ${newEleve.nom} inscrit avec succès !`, 'success');
  };

  // Action rapide : Relance individuelle avec effet visuel
  const triggerRelance = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRelancingId(eleve.id);
    showToast(
      `Rappel SMS/WhatsApp envoyé au tuteur de ${eleve.prenom} ${eleve.nom} (${eleve.telephone_tuteur})`,
      'info'
    );
    setTimeout(() => setRelancingId(null), 850);
  };

  // Action rapide : Marquer payé express (1 clic) avec micro-célébration
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

  // Actions groupées (Bulk actions)
  const handleBulkRelance = () => {
    const count = selectedEleveIds.length;
    if (count === 0) return;
    showToast(
      `⚡ Campagne de relance envoyée avec succès à ${count} tuteur(s) d'élèves présélectionnés.`,
      'info'
    );
    setSelectedEleveIds([]);
  };

  const handleBulkExport = () => {
    const count = selectedEleveIds.length;
    showToast(`Export du rapport comptable pour ${count} élève(s) sélectionné(s).`, 'info');
  };

  // Encaissement fictif modal
  const handleConfirmPayment = (amount: number, methode: string) => {
    if (!paymentModalEleve) return;

    setElevesList((prev) =>
      prev.map((e) => {
        if (e.id === paymentModalEleve.id) {
          const newPaid = e.total_paid + amount;
          const newRemaining = Math.max(0, e.total_due - newPaid);
          const newStatut =
            newRemaining === 0
              ? 'paye'
              : newPaid > 0
              ? 'partiel'
              : 'en_retard';

          return {
            ...e,
            total_paid: newPaid,
            remaining: newRemaining,
            statut: newStatut,
            timeline_paiements: [
              {
                id: `pay-${Date.now()}`,
                libelle: 'Encaissement Guichet',
                montant: amount,
                date: new Date().toLocaleDateString('fr-FR'),
                methode: methode as any,
                statut: 'regle',
                recu_ref: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
              },
              ...e.timeline_paiements,
            ],
          };
        }
        return e;
      })
    );

    showToast(
      `Paiement de ${formatMRU(amount)} enregistré pour ${paymentModalEleve.prenom} ${paymentModalEleve.nom}`
    );
    setPaymentModalEleve(null);
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

      {/* Top Institutional Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gestion des Élèves & Scolarités
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
              Année 2025–2026
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Registre académique centralisé, facturation mensuelle et suivi des recouvrements en Ouguiya (MRU).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 px-4"
            onClick={handleImportClick}
            loading={isImporting}
            loadingText="Lecture du fichier..."
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Import Excel/CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 h-10 px-4"
            onClick={() => setIsEnrollModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            + Inscrire un nouvel élève
          </Button>
        </div>
      </div>

      {/* Metric Quick Tiles (Nexoov Pastel Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Effectif Total"
          amount={kpis.nombreEleves}
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
          subtitle="Filtrer les élèves réglés"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          active={selectedStatut === 'paye'}
          onClick={() => handleStatutChange('paye')}
        />

        <KpiCard
          staggerIndex={2}
          title="Échéances en Retard"
          amount={kpis.nombreEnRetard}
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

      {/* Filtration & Control Bar */}
      <Card className="p-5 sm:p-6 space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar avec raccourci clavier "/" */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un élève, matricule, parent... (Touche '/')"
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
              onChange={(val) => setSortBy(val as any)}
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

        {/* Status count chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          <span className="text-slate-400 dark:text-slate-500 mr-2 text-[11px] font-bold uppercase tracking-wider">
            Filtres rapides :
          </span>
          <button
            onClick={() => handleStatutChange('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tous ({filteredEleves.length})
          </button>
          <button
            onClick={() => handleStatutChange('paye')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'paye'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'
            }`}
          >
            Payés ({filteredEleves.filter((e) => e.statut === 'paye').length})
          </button>
          <button
            onClick={() => handleStatutChange('en_retard')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedStatut === 'en_retard'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100'
            }`}
          >
            En retard ({filteredEleves.filter((e) => e.statut === 'en_retard').length})
          </button>
          <button
            onClick={() => handleStatutChange('partiel')}
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

      {/* Tabular Roster Table (Nexoov Style) */}
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {filteredEleves.length} élève(s) au registre
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Cliquez sur un élève pour ouvrir son dossier individuel.
          </span>
        </div>

        {/* Tabular Roster with smooth internal scrollbar */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">Élève</th>
                <th className="py-4 px-4">Tuteur Légal</th>
                <th className="py-4 px-4 hidden md:table-cell">Ville / Quartier</th>
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
                  const isJustPaid = justPaidEleveId === eleve.id;
                  const isRelancing = relancingId === eleve.id;
                  const isMenuOpen = openMenuRowId === eleve.id;

                  return (
                    <tr
                      key={eleve.id}
                      onClick={() => setDrawerEleve(eleve)}
                      className={`cursor-pointer transition-all duration-200 group ${
                        isJustPaid
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-400'
                          : isChecked
                          ? 'bg-blue-50/60 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Élève (Nom en gras sur ligne 1 + matricule et classe en ligne 2) */}
                      <td className="py-4 px-4">
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

                      {/* Tuteur */}
                      <td className="py-4 px-4">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{eleve.nom_tuteur}</div>
                          <div className="text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 text-[11px]">
                            <PhoneCall className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{eleve.telephone_tuteur}</span>
                          </div>
                        </div>
                      </td>

                      {/* Ville / Quartier */}
                      <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {eleve.adresse_tuteur ? eleve.adresse_tuteur.split(',')[0] : 'Tevragh-Zeina'}
                      </td>

                      {/* Statut Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <StatusBadge statut={eleve.statut} />
                      </td>

                      {/* Solde Dû */}
                      <td className="py-4 px-4 text-right font-mono font-black whitespace-nowrap text-xs">
                        {eleve.remaining > 0 ? (
                          <span
                            title={formatMRU(eleve.remaining)}
                            className="text-rose-600 dark:text-rose-400 cursor-help"
                          >
                            {eleve.remaining >= 100000
                              ? formatCompactMRU(eleve.remaining)
                              : formatMRU(eleve.remaining)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Soldé</span>
                        )}
                      </td>

                      {/* Context Menu "..." Button */}
                      <td
                        className="py-4 px-4 text-center relative"
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
                          <div className="absolute right-4 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                setDrawerEleve(eleve);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Voir la fiche élève</span>
                            </button>

                            {eleve.remaining > 0 ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    setOpenMenuRowId(null);
                                    triggerMarquerPayeExpress(eleve, e);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  <span>Encaisser comptant</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    setOpenMenuRowId(null);
                                    triggerRelance(eleve, e);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  <span>{isRelancing ? 'Envoi...' : 'Envoyer relance SMS'}</span>
                                </button>
                              </>
                            ) : null}

                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                setPaymentModalEleve(eleve);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                            >
                              <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
                              <span>Enregistrer paiement</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                window.print();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
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

      {/* Slide-over Drawer Dossier Élève */}
      <StudentDetailDrawer
        eleve={drawerEleve}
        onClose={() => setDrawerEleve(null)}
        onQuickPay={(el) => triggerMarquerPayeExpress(el)}
        onQuickRelance={(el) => triggerRelance(el)}
      />

      {/* Modale d'Inscription Élève */}
      <StudentEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollStudent}
        classesList={classesList}
      />

      {/* Modale d'Encaissement Fictif */}
      {paymentModalEleve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Encaisser un paiement
              </h3>
              <button
                onClick={() => setPaymentModalEleve(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white">
                Élève: {paymentModalEleve.prenom} {paymentModalEleve.nom}
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-mono">
                Reste à payer actuel: {formatMRU(paymentModalEleve.remaining)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Montant encaissé (MRU)
                </label>
                <input
                  type="number"
                  defaultValue={Math.min(15000, paymentModalEleve.remaining || 15000)}
                  id="payAmountInput"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mode de règlement
                </label>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: 'especes', label: 'Espèces (Comptant)' },
                    { value: 'bankily', label: 'Bankily (BPM)' },
                    { value: 'masrvi', label: 'Masrvi (BMCI)' },
                    { value: 'cheque', label: 'Chèque' },
                  ]}
                  triggerClassName="w-full h-10 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalEleve(null)}
              >
                Annuler (Échap)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const inputAmt = (
                    document.getElementById('payAmountInput') as HTMLInputElement
                  )?.value;
                  handleConfirmPayment(Number(inputAmt) || 15000, paymentMethod || 'bankily');
                }}
              >
                Confirmer l'Encaissement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
