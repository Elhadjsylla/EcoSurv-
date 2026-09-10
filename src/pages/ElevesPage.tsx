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
import { formatMRU } from '../lib/utils';
import { formatCompactMRU } from '../lib/formatCompactMRU';
import { StudentEnrollmentModal } from '../components/eleves/StudentEnrollmentModal';
import { StudentDetailPanel } from '../components/eleves/StudentDetailPanel';
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
  Download,
  Check,
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
  const [selectedEleveId, setSelectedEleveId] = useState<string>(MOCK_ELEVES[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>(initialStatutFilter);
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'solde'>('nom');

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

  // Élève sélectionné pour le panneau de droite
  const selectedEleve = useMemo(() => {
    return elevesList.find((e) => e.id === selectedEleveId) || filteredEleves[0] || null;
  }, [elevesList, selectedEleveId, filteredEleves]);

  // Gestion de la sélection multiple
  const isAllSelected =
    filteredEleves.length > 0 &&
    filteredEleves.every((e) => selectedEleveIds.includes(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEleveIds([]);
    } else {
      setSelectedEleveIds(filteredEleves.map((e) => e.id));
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
    setSelectedEleveId(newEleve.id);
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
              <Download className="h-3.5 w-3.5" />
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestion des Élèves & Scolarités
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              Année 2025–2026
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Registre académique centralisé, facturation mensuelle et suivi des recouvrements en Ouguiya (MRU).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
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

      {/* Metric Quick Tiles (Interactive Status Shortcuts) avec animation échelonnée */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          onClick={() => handleStatutChange('all')}
          style={{ animationDelay: '0ms' }}
          className={`p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 animate-stagger-rise hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400 min-w-0 ${
            selectedStatut === 'all' ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-sm' : ''
          }`}
        >
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Effectif Total
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-2 truncate">
              {kpis.nombreEleves}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Afficher tous
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card
          onClick={() => handleStatutChange('paye')}
          style={{ animationDelay: '75ms' }}
          className={`p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 animate-stagger-rise hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400 min-w-0 ${
            selectedStatut === 'paye' ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-sm' : ''
          }`}
        >
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Élèves En Règle
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-2 truncate">
              {kpis.nombrePaye + kpis.nombreAJour}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-2 block truncate">
              Filtrer les réglés →
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card
          onClick={() => handleStatutChange('en_retard')}
          style={{ animationDelay: '150ms' }}
          className={`p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 animate-stagger-rise hover:-translate-y-0.5 hover:shadow-md hover:border-red-400 min-w-0 ${
            selectedStatut === 'en_retard' ? 'border-red-600 bg-red-50/30 ring-2 ring-red-500/20 shadow-sm' : ''
          }`}
        >
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Échéances en Retard
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono mt-2 truncate">
              {kpis.nombreEnRetard}
            </div>
            <span
              title={`Total impayés : ${formatMRU(kpis.totalImpayes)}`}
              className="text-[11px] font-semibold text-red-600 mt-2 block truncate cursor-help"
            >
              Filtrer les retards ({formatCompactMRU(kpis.totalImpayes)}) →
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card
          onClick={() => handleStatutChange('partiel')}
          style={{ animationDelay: '225ms' }}
          className={`p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 animate-stagger-rise hover:-translate-y-0.5 hover:shadow-md hover:border-amber-400 min-w-0 ${
            selectedStatut === 'partiel' ? 'border-amber-600 bg-amber-50/30 ring-2 ring-amber-500/20 shadow-sm' : ''
          }`}
        >
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Recouvrement Global
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono mt-2 truncate">
              {kpis.tauxRecouvrement}%
            </div>
            <span className="text-[11px] text-amber-700 font-semibold mt-2 block truncate">
              Filtrer les partiels →
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filtration & Control Bar */}
      <Card className="p-6 space-y-4 border-slate-200/90 shadow-sm rounded-2xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar avec raccourci clavier "/" */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un élève, matricule, parent... (Touche '/')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-11 pl-10 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 ${
                isSearchPulseActive ? 'animate-search-focus ring-2 ring-blue-500' : ''
              }`}
            />
            <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
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
              triggerClassName="h-11 rounded-xl text-xs font-semibold"
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
              triggerClassName="h-11 rounded-xl text-xs font-bold"
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
              triggerClassName="h-11 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>
      </Card>

      {/* Primary Split Architecture: 65% Roster Table / 35% Detailed Ledger Dossier */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Wing (65% -> 8 cols on XL) */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-bold text-slate-900 text-sm">
                {filteredEleves.length} élève(s) affiché(s)
              </span>
            </div>
            <span className="text-slate-500 font-medium">
              Cliquez sur une ligne pour afficher son dossier complet.
            </span>
          </div>

          {/* Tabular Roster with smooth internal scrollbar */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3">Matricule</th>
                  <th className="py-3.5 px-3.5">Élève</th>
                  <th className="py-3.5 px-3">Classe</th>
                  <th className="py-3.5 px-3 hidden 2xl:table-cell">Tuteur Légal</th>
                  <th className="py-3.5 px-3 text-right">Solde Dû</th>
                  <th className="py-3.5 px-3 text-center">Statut</th>
                  <th className="py-3.5 px-3 text-right">Actions Rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEleves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-500 font-medium text-sm">
                      Aucun élève ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredEleves.map((eleve) => {
                    const isSelected = eleve.id === selectedEleve?.id;
                    const isChecked = selectedEleveIds.includes(eleve.id);
                    const isJustPaid = justPaidEleveId === eleve.id;
                    const isRelancing = relancingId === eleve.id;

                    return (
                      <tr
                        key={eleve.id}
                        onClick={() => setSelectedEleveId(eleve.id)}
                        className={`cursor-pointer transition-all duration-300 ${
                          isJustPaid
                            ? 'bg-emerald-50/90 ring-1 ring-emerald-400'
                            : isSelected
                            ? 'bg-blue-50/90 border-l-4 border-blue-600'
                            : isChecked
                            ? 'bg-blue-50/40'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Matricule */}
                        <td className="py-3.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {eleve.matricule}
                        </td>

                        {/* Élève */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-3">
                            <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="sm" />
                            <div>
                              <div className="font-bold text-slate-900 leading-snug">
                                {eleve.prenom} {eleve.nom}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Né le {eleve.date_naissance} • {eleve.sexe}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Classe */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {eleve.classe}
                          </span>
                        </td>

                        {/* Tuteur (visible sur grands écrans 2xl+, déjà visible dans le panneau détail à droite) */}
                        <td className="py-3.5 px-3 hidden 2xl:table-cell">
                          <div className="text-xs space-y-0.5">
                            <div className="font-semibold text-slate-800">{eleve.nom_tuteur}</div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              {eleve.telephone_tuteur}
                            </div>
                          </div>
                        </td>

                        {/* Solde Dû */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap text-sm">
                          {eleve.remaining > 0 ? (
                            <span
                              title={formatMRU(eleve.remaining)}
                              className="text-red-700 cursor-help"
                            >
                              {eleve.remaining >= 100000
                                ? formatCompactMRU(eleve.remaining)
                                : formatMRU(eleve.remaining)}
                            </span>
                          ) : (
                            <span className="text-emerald-700">0 MRU</span>
                          )}
                        </td>

                        {/* Statut Badge */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <StatusBadge statut={eleve.statut} />
                        </td>

                        {/* Actions Rapides en Ligne */}
                        <td
                          className="py-3.5 px-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {eleve.remaining > 0 ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7.5 px-2 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all duration-150"
                                  title="Marquer réglé immédiatement"
                                  onClick={(e) => triggerMarquerPayeExpress(eleve, e)}
                                >
                                  <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                                  Payé
                                </Button>

                                <Button
                                  size="sm"
                                  variant="danger"
                                  className="h-7.5 px-2 text-xs gap-1 hover:scale-105 active:scale-95 transition-all duration-150 relative overflow-hidden"
                                  title="Envoyer rappel SMS"
                                  onClick={(e) => triggerRelance(eleve, e)}
                                >
                                  <Send
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      isRelancing ? 'animate-paper-plane' : ''
                                    }`}
                                  />
                                  {isRelancing ? '...' : 'Relancer'}
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 pr-1 animate-scale-in">
                                <Check className="h-4 w-4 text-emerald-600" /> Soldé
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Wing: Dossier de l'élève sélectionné (35% -> 4 cols on XL) - Sticky on desktop */}
        <div className="xl:col-span-4 xl:sticky xl:top-6 self-start space-y-4">
          <StudentDetailPanel
            eleve={selectedEleve}
            onPaymentTrigger={(el) => setPaymentModalEleve(el)}
            onRelanceTrigger={(el) =>
              showToast(`Rappel SMS/WhatsApp envoyé au tuteur de ${el.prenom} ${el.nom}`)
            }
          />
        </div>
      </div>

      {/* Modale d'Inscription Élève */}
      <StudentEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollStudent}
        classesList={classesList}
      />

      {/* Modale d'Encaissement Fictif */}
      {paymentModalEleve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
                Encaisser un paiement
              </h3>
              <button
                onClick={() => setPaymentModalEleve(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-900">
                Élève: {paymentModalEleve.prenom} {paymentModalEleve.nom}
              </p>
              <p className="text-slate-500 font-mono">
                Reste à payer actuel: {formatMRU(paymentModalEleve.remaining)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant encaisse (MRU)
                </label>
                <input
                  type="number"
                  defaultValue={Math.min(15000, paymentModalEleve.remaining || 15000)}
                  id="payAmountInput"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mode de règlement
                </label>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: 'bankily', label: 'Bankily (Mobile Money)' },
                    { value: 'especes', label: 'Espèces (Guichet)' },
                    { value: 'masrvi', label: 'Masrvi' },
                    { value: 'sedad', label: 'Sedad' },
                    { value: 'virement', label: 'Virement bancaire' },
                  ]}
                  triggerClassName="w-full h-10 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
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
