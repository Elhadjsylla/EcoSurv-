import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MOCK_ELEVES,
  EleveWithStats,
  getDashboardKpis,
} from '../lib/mockData';
import { StudentInitials } from '../components/ui/StudentInitials';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatMRU } from '../lib/utils';
import { StudentEnrollmentModal } from '../components/eleves/StudentEnrollmentModal';
import { StudentDetailPanel } from '../components/eleves/StudentDetailPanel';
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
  CheckCircle,
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Inscription d'un nouvel élève
  const handleEnrollStudent = (newEleve: EleveWithStats) => {
    setElevesList((prev) => [newEleve, ...prev]);
    setSelectedEleveId(newEleve.id);
    showToast(`Élève ${newEleve.prenom} ${newEleve.nom} inscrit avec succès !`);
  };

  // Action rapide : Marquer payé express (1 clic)
  const triggerMarquerPayeExpress = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

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
      )})`
    );
  };

  // Actions groupées (Bulk actions)
  const handleBulkRelance = () => {
    const count = selectedEleveIds.length;
    if (count === 0) return;
    showToast(
      `⚡ Campagne de relance envoyée avec succès à ${count} tuteur(s) d'élèves présélectionnés.`
    );
    setSelectedEleveIds([]);
  };

  const handleBulkExport = () => {
    const count = selectedEleveIds.length;
    showToast(` Export du rapport comptable pour ${count} élève(s) sélectionné(s).`);
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestion des Élèves & Scolarités
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              Année 2025–2026
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Registre académique centralisé, facturation mensuelle et suivi des recouvrements en Ouguiya (MRU).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Import Excel/CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setIsEnrollModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            + Inscrire un nouvel élève
          </Button>
        </div>
      </div>

      {/* Metric Quick Tiles (Interactive Status Shortcuts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => handleStatutChange('all')}
          className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:border-blue-400 ${
            selectedStatut === 'all' ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Effectif Total
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {kpis.nombreEleves}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-slate-400" /> Afficher tous
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card
          onClick={() => handleStatutChange('paye')}
          className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:border-emerald-400 ${
            selectedStatut === 'paye' ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Élèves En Règle
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              {kpis.nombrePaye + kpis.nombreAJour}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              Filtrer les réglés →
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card
          onClick={() => handleStatutChange('en_retard')}
          className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:border-red-400 ${
            selectedStatut === 'en_retard' ? 'border-red-600 bg-red-50/30 ring-2 ring-red-500/20' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Échéances en Retard
            </span>
            <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
              {kpis.nombreEnRetard}
            </div>
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">
              Filtrer les retards ({formatMRU(kpis.totalImpayes)}) →
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card
          onClick={() => handleStatutChange('partiel')}
          className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:border-amber-400 ${
            selectedStatut === 'partiel' ? 'border-amber-600 bg-amber-50/30 ring-2 ring-amber-500/20' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recouvrement Global
            </span>
            <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
              {kpis.tauxRecouvrement}%
            </div>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              Filtrer les partiels →
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filtration & Control Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar avec raccourci clavier "/" */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher... (Appuyez sur '/' pour accèder)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-12 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <kbd className="absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              /
            </kbd>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Toutes les classes ({classesList.length})</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <select
                value={selectedStatut}
                onChange={(e) => handleStatutChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Tous statuts financiers</option>
                <option value="paye">Réglé (Payé)</option>
                <option value="en_retard">En retard</option>
                <option value="partiel">Partiel</option>
                <option value="a_jour">À jour</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="nom">Trier par Nom (A-Z)</option>
                <option value="matricule">Trier par Matricule</option>
                <option value="solde">Trier par Solde Dû</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Primary Split Architecture: 65% Roster Table / 35% Detailed Ledger Dossier */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Wing (65% -> 8 cols on XL) */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-bold text-slate-900">
                {filteredEleves.length} élève(s) affiché(s)
              </span>
            </div>
            <span className="text-slate-500 font-medium">
              Cliquez sur une ligne pour afficher son dossier complet.
            </span>
          </div>

          {/* Tabular Roster */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Matricule</th>
                  <th className="py-3 px-4">Élève</th>
                  <th className="py-3 px-4">Classe</th>
                  <th className="py-3 px-4">Tuteur Légal</th>
                  <th className="py-3 px-4 text-right">Solde Dû</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions Rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEleves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                      Aucun élève ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredEleves.map((eleve) => {
                    const isSelected = eleve.id === selectedEleve?.id;
                    const isChecked = selectedEleveIds.includes(eleve.id);
                    return (
                      <tr
                        key={eleve.id}
                        onClick={() => setSelectedEleveId(eleve.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/90 border-l-4 border-blue-600'
                            : isChecked
                            ? 'bg-blue-50/40'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Matricule */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {eleve.matricule}
                        </td>

                        {/* Élève */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="sm" />
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {eleve.prenom} {eleve.nom}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Né le {eleve.date_naissance} • {eleve.sexe}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Classe */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {eleve.classe}
                          </span>
                        </td>

                        {/* Tuteur */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{eleve.nom_tuteur}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {eleve.telephone_tuteur}
                          </div>
                        </td>

                        {/* Solde Dû */}
                        <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                          {eleve.remaining > 0 ? (
                            <span className="text-red-700">{formatMRU(eleve.remaining)}</span>
                          ) : (
                            <span className="text-emerald-700">0 MRU</span>
                          )}
                        </td>

                        {/* Statut Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <StatusBadge statut={eleve.statut} />
                        </td>

                        {/* Actions Rapides en Ligne */}
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {eleve.remaining > 0 ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                  title="Marquer réglé immédiatement"
                                  onClick={(e) => triggerMarquerPayeExpress(eleve, e)}
                                >
                                  <Zap className="h-3 w-3 text-emerald-600 fill-emerald-600" />
                                  Payé
                                </Button>

                                <Button
                                  size="sm"
                                  variant="danger"
                                  className="h-7 px-2 text-[11px] gap-1"
                                  title="Envoyer rappel SMS"
                                  onClick={() =>
                                    showToast(
                                      `Rappel SMS/WhatsApp envoyé au tuteur de ${eleve.prenom} ${eleve.nom}`
                                    )
                                  }
                                >
                                  <Send className="h-3 w-3" />
                                  Relancer
                                </Button>
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 pr-2">
                                <Check className="h-3.5 w-3.5 text-emerald-600" /> Soldé
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

        {/* Right Wing: Dossier de l'élève sélectionné (35% -> 4 cols on XL) */}
        <div className="xl:col-span-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mode de règlement
                </label>
                <select
                  id="payMethodInput"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="bankily">Bankily (Mobile Money)</option>
                  <option value="especes">Espèces (Guichet)</option>
                  <option value="masrvi">Masrvi</option>
                  <option value="sedad">Sedad</option>
                  <option value="virement">Virement bancaire</option>
                </select>
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
                  const inputMeth = (
                    document.getElementById('payMethodInput') as HTMLSelectElement
                  )?.value;
                  handleConfirmPayment(Number(inputAmt) || 15000, inputMeth || 'bankily');
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
