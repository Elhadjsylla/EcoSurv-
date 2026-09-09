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
import { formatMRU } from '../../lib/utils';
import {
  Search,
  Filter,
  Phone,
  Send,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Check,
  Zap,
} from 'lucide-react';

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

  // Micro-interactions state
  const [justPaidEleveId, setJustPaidEleveId] = useState<string | null>(null);
  const [relancingId, setRelancingId] = useState<string | null>(null);
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
      // Ignorer si bloqué par l'environnement
    }
  };

  // Action rapide : Relance individuelle avec effet de vol d'avion en papier
  const triggerRelance = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRelancingId(eleve.id);
    showToast(
      `Rappel SMS/WhatsApp envoyé au tuteur de ${eleve.prenom} ${eleve.nom} (${eleve.telephone_tuteur})`,
      'info'
    );
    setTimeout(() => setRelancingId(null), 850);
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

  // Action groupée : Relancer la sélection
  const handleBulkRelance = () => {
    const count = selectedEleveIds.length;
    if (count === 0) return;
    showToast(
      `⚡ Campagne de relance envoyée avec succès à ${count} tuteur(s) d'élèves présélectionnés.`,
      'info'
    );
    setSelectedEleveIds([]);
  };

  // Action groupée : Exporter la sélection
  const handleBulkExport = () => {
    const count = selectedEleveIds.length;
    showToast(`Export du rapport comptable pour ${count} élève(s) sélectionné(s).`, 'info');
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

      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tableau de Bord de Direction
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Suivi en temps réel du recouvrement et de la situation financière des élèves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
            <Download className="h-4 w-4" />
            Exporter Rapport PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 h-10 px-4"
            onClick={handleBulkRelance}
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
      <Card className="p-6 space-y-4 border-slate-200/90 shadow-sm rounded-2xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar avec raccourci clavier "/" */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher... (Appuyez sur '/' pour accéder)"
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by class */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="h-11 px-3.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Toutes les classes ({classesList.length})</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by status */}
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="h-11 px-3.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
            >
              <option value="all">Tous les statuts</option>
              <option value="paye">Réglé (Payé)</option>
              <option value="en_retard">En retard</option>
              <option value="partiel">Partiel</option>
              <option value="a_jour">À jour (Non échu)</option>
            </select>
          </div>
        </div>

        {/* Status count chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs font-medium">
          <span className="text-slate-500 mr-2 font-medium">Résultats :</span>
          <button
            onClick={() => setSelectedStatut('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedStatut === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Total : {filteredEleves.length} élèves
          </button>
          <button
            onClick={() => setSelectedStatut('paye')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedStatut === 'paye'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Payés : {filteredEleves.filter((e) => e.statut === 'paye').length}
          </button>
          <button
            onClick={() => setSelectedStatut('en_retard')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedStatut === 'en_retard'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
            }`}
          >
            En retard : {filteredEleves.filter((e) => e.statut === 'en_retard').length}
          </button>
          <button
            onClick={() => setSelectedStatut('partiel')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedStatut === 'partiel'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Partiels : {filteredEleves.filter((e) => e.statut === 'partiel').length}
          </button>
        </div>
      </Card>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6">Élève & Matricule</th>
                <th className="py-4 px-6">Classe</th>
                <th className="py-4 px-6">Tuteur / Contact</th>
                <th className="py-4 px-6 text-right">Montant Attendu</th>
                <th className="py-4 px-6 text-right">Montant Encaissé</th>
                <th className="py-4 px-6 text-right">Reste à Payer</th>
                <th className="py-4 px-6 text-center">Statut</th>
                <th className="py-4 px-6 text-right">Actions Rapides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEleves.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-500 font-medium">
                    Aucun élève trouvé correspondant à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredEleves.map((eleve) => {
                  const isChecked = selectedEleveIds.includes(eleve.id);
                  const isJustPaid = justPaidEleveId === eleve.id;
                  const isRelancing = relancingId === eleve.id;

                  return (
                    <tr
                      key={eleve.id}
                      className={`transition-all duration-300 group cursor-pointer ${
                        isJustPaid
                          ? 'bg-emerald-50/90 ring-1 ring-emerald-400'
                          : isChecked
                          ? 'bg-blue-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => setSelectedEleveModal(eleve)}
                    >
                      {/* Checkbox */}
                      <td className="py-4.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Élève */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3.5">
                          <StudentInitials nom={eleve.nom} prenom={eleve.prenom} />
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">
                              {eleve.prenom} {eleve.nom}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {eleve.matricule}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classe */}
                      <td className="py-4.5 px-6">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {eleve.classe}
                        </span>
                      </td>

                      {/* Tuteur */}
                      <td className="py-4.5 px-6">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800">{eleve.nom_tuteur}</div>
                          <div className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{eleve.telephone_tuteur}</span>
                          </div>
                        </div>
                      </td>

                      {/* Montant Attendu */}
                      <td className="py-4.5 px-6 text-right font-mono font-semibold text-slate-700">
                        {formatMRU(eleve.total_due)}
                      </td>

                      {/* Montant Encaissé */}
                      <td className="py-4.5 px-6 text-right font-mono font-semibold text-emerald-700">
                        {formatMRU(eleve.total_paid)}
                      </td>

                      {/* Reste à payer */}
                      <td className="py-4.5 px-6 text-right font-mono font-extrabold text-slate-900">
                        {eleve.remaining > 0 ? (
                          <span className="text-red-700">{formatMRU(eleve.remaining)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 MRU</span>
                        )}
                      </td>

                      {/* Statut Badge */}
                      <td className="py-4.5 px-6 text-center">
                        <StatusBadge statut={eleve.statut} />
                      </td>

                      {/* Actions Rapides en Ligne */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {eleve.remaining > 0 ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all duration-150"
                                title="Marquer réglé immédiatement"
                                onClick={(e) => triggerMarquerPayeExpress(eleve, e)}
                              >
                                <Zap className="h-3 w-3 text-emerald-600 fill-emerald-600" />
                                Payé
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                className="h-7 px-2 text-[11px] gap-1 hover:scale-105 active:scale-95 transition-all duration-150 relative overflow-hidden"
                                title="Envoyer rappel SMS"
                                onClick={(e) => triggerRelance(eleve, e)}
                              >
                                <Send
                                  className={`h-3 w-3 transition-transform ${
                                    isRelancing ? 'animate-paper-plane' : ''
                                  }`}
                                />
                                {isRelancing ? 'Envoi...' : 'Relancer'}
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 pr-2 animate-scale-in">
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

      {/* Modale de Détail Élève & Échéances */}
      {selectedEleveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <StudentInitials
                  nom={selectedEleveModal.nom}
                  prenom={selectedEleveModal.prenom}
                  size="lg"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedEleveModal.prenom} {selectedEleveModal.nom}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Matricule: {selectedEleveModal.matricule} • Classe: {selectedEleveModal.classe}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEleveModal(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Fiche Financière */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                  Attendu
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {formatMRU(selectedEleveModal.total_due)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-semibold block uppercase">
                  Payé
                </span>
                <span className="text-sm font-bold font-mono text-emerald-800">
                  {formatMRU(selectedEleveModal.total_paid)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <span className="text-[11px] text-red-700 font-semibold block uppercase">
                  Solde Dû
                </span>
                <span className="text-sm font-bold font-mono text-red-800">
                  {formatMRU(selectedEleveModal.remaining)}
                </span>
              </div>
            </div>

            {/* Coordonnées Tuteur */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-900">Informations du Tuteur :</div>
              <div className="flex justify-between text-slate-600">
                <span>Nom complet :</span>
                <span className="font-semibold text-slate-900">{selectedEleveModal.nom_tuteur}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Téléphone :</span>
                <span className="font-semibold text-blue-700">{selectedEleveModal.telephone_tuteur}</span>
              </div>
              {selectedEleveModal.email_tuteur && (
                <div className="flex justify-between text-slate-600">
                  <span>Email :</span>
                  <span className="font-semibold text-slate-900">{selectedEleveModal.email_tuteur}</span>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEleveModal(null)}
              >
                Fermer (Échap)
              </Button>
              {selectedEleveModal.remaining > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    triggerRelance(selectedEleveModal);
                    setSelectedEleveModal(null);
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  Envoyer Rappel SMS
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
