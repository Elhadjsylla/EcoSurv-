import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MOCK_ELEVES,
  MOCK_MONTHLY_REPORTS,
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
import { useCaisseStore } from '../../store/useCaisseStore';
import { generateReceiptPdf } from '../../lib/pdf/generateReceiptPdf';
import { generateFinancialReportPdf } from '../../lib/pdf/generateFinancialReportPdf';
import { exportElevesToExcel } from '../../lib/excel/exportElevesToExcel';
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
  School,
  UserPlus,
} from 'lucide-react';
import { ConfirmBulkRelanceModal } from './ConfirmBulkRelanceModal';
import { StudentDetailDrawer } from './StudentDetailDrawer';
import { Tooltip } from '../ui/Tooltip';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

interface DirectorDashboardProps {
  onNavigateToEleves?: (statutFilter: string) => void;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  onNavigateToEleves,
}) => {
  const authProfile = useAuthStore((s) => s.profile);
  const authEcole = useAuthStore((s) => s.ecole);

  const [elevesList, setElevesList] = useState<EleveWithStats[]>(() => {
    // Si l'utilisateur est un vrai compte Supabase avec ecole_id, démarrer propre (0 élève tant que non chargé)
    if (authProfile?.ecole_id) return [];
    return MOCK_ELEVES;
  });

  // Charger les vrais élèves et leurs échéances réelles depuis Supabase
  useEffect(() => {
    if (authProfile?.ecole_id) {
      const fetchRealEleves = async () => {
        try {
          const [elevesRes, echeancesRes] = await Promise.all([
            supabase
              .from('eleves')
              .select('*')
              .eq('ecole_id', authProfile.ecole_id),
            supabase
              .from('echeances')
              .select('*')
              .eq('ecole_id', authProfile.ecole_id),
          ]);

          if (!elevesRes.error && elevesRes.data) {
            const allEcheances = echeancesRes.data || [];

            const mapped = elevesRes.data.map((e: any, idx: number) => {
              const studentEch = allEcheances.filter((ech: any) => ech.eleve_id === e.id);
              const totalDue = studentEch.reduce((sum: number, ech: any) => sum + Number(ech.montant || 0), 0);
              const totalPaid = studentEch.reduce((sum: number, ech: any) => sum + Number(ech.montant_paye || 0), 0);
              const remaining = Math.max(0, totalDue - totalPaid);
              const hasOverdue = studentEch.some((ech: any) => ech.statut === 'en_retard');
              const computedStatut = hasOverdue
                ? 'en_retard'
                : (totalDue > 0 && remaining === 0
                  ? 'paye'
                  : (totalPaid > 0 ? 'partiel' : 'a_jour'));

              return {
                ...e,
                matricule: e.matricule || `MAT-${100 + idx}`,
                total_due: totalDue,
                total_paid: totalPaid,
                remaining: remaining,
                statut: computedStatut,
                classe: e.classe || 'Non assigné',
                nom_tuteur: e.nom_tuteur || 'Tuteur Légal',
                telephone_tuteur: e.telephone_tuteur || '',
                nb_absences: e.nb_absences ?? 0,
                timeline_paiements: e.timeline_paiements ?? [],
              };
            });
            setElevesList(mapped as any[]);
          }
        } catch (e) {
          console.warn('[DirectorDashboard] Erreur chargement élèves réels:', e);
        }
      };
      fetchRealEleves();
    }
  }, [authProfile?.ecole_id]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedEleveModal, setSelectedEleveModal] = useState<EleveWithStats | null>(null);
  const [paymentModalEleve, setPaymentModalEleve] = useState<EleveWithStats | null>(null);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

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
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setActiveToast({ message, type });
  };

  // Action rapide : Relance individuelle par WhatsApp pré-rempli (zéro faux SMS automatique)
  const triggerRelance = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const rawPhone = eleve.telephone_tuteur ? eleve.telephone_tuteur.replace(/[^0-9]/g, '') : '';
    if (!rawPhone) {
      showToast(`Aucun numéro de téléphone renseigné pour le tuteur de ${eleve.prenom} ${eleve.nom}.`, 'warning');
      return;
    }
    const cleanPhone = rawPhone.startsWith('222') ? rawPhone : `222${rawPhone}`;
    const ecoleNom = authEcole?.nom || 'notre établissement';
    const msg = `Bonjour M./Mme ${eleve.nom_tuteur || 'le Tuteur'},\n\nL'administration de l'établissement ${ecoleNom} vous informe que l'échéance de scolarité de ${eleve.prenom} ${eleve.nom} (${eleve.classe}) présente un solde restant de ${formatMRU(eleve.remaining)}.\n\nMerci de bien vouloir vous rapprocher du guichet de l'école ou de régulariser ce montant par virement Bankily / Masrvi.\n\nBien cordialement,\nLa Direction.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    setRelancedStudentIds((prev) => Array.from(new Set([...prev, eleve.id])));
    showToast(`WhatsApp pré-rempli ouvert pour le tuteur de ${eleve.prenom} ${eleve.nom}.`, 'info');
  };

  // Action rapide : Marquer payé express (circuit guichet caissier : table paiements + vrai reçu PDF)
  const triggerMarquerPayeExpress = async (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJustPaidEleveId(eleve.id);

    const montantToPay = eleve.remaining > 0 ? eleve.remaining : (eleve.total_due || 15000);
    const recuRef = `REC-DIR-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const encaisseurNom = authProfile ? `${authProfile.prenom} ${authProfile.nom}` : 'Direction de l’établissement';
    const nomEtablissement = authEcole?.nom || 'Établissement Scolaire';

    // 1. Insertion en base de données Supabase si compte authentifié
    if (authProfile?.ecole_id) {
      try {
        const { data: echs } = await supabase
          .from('echeances')
          .select('*')
          .eq('eleve_id', eleve.id)
          .neq('statut', 'paye')
          .order('date_echeance', { ascending: true });

        if (echs && echs.length > 0) {
          let remainingToDistribute = montantToPay;
          for (const ech of echs) {
            if (remainingToDistribute <= 0) break;
            const dueOnEch = Number(ech.montant) - Number(ech.montant_paye || 0);
            const payAmount = Math.min(remainingToDistribute, dueOnEch);
            if (payAmount > 0) {
              const newPaid = Number(ech.montant_paye || 0) + payAmount;
              const newStatut = newPaid >= Number(ech.montant) ? 'paye' : 'partiel';
              await supabase
                .from('echeances')
                .update({
                  montant_paye: newPaid,
                  statut: newStatut,
                  date_paiement: new Date().toISOString(),
                })
                .eq('id', ech.id);

              await supabase.from('paiements').insert({
                ecole_id: authProfile.ecole_id,
                echeance_id: ech.id,
                montant: payAmount,
                methode: 'especes',
                statut: 'confirme',
                reference_transaction: `${recuRef}-${ech.id.slice(0, 4)}`,
                encaisse_par: authProfile.id,
                note: `Règlement express au bureau de direction - ${eleve.prenom} ${eleve.nom}`,
                paye_le: new Date().toISOString(),
              });
              remainingToDistribute -= payAmount;
            }
          }
        }
      } catch (err) {
        console.warn('[DirectorDashboard] Erreur écriture paiement express Supabase:', err);
      }
    }

    useCaisseStore.getState().deductEleveBalance(eleve.id, montantToPay);
    useCaisseStore.getState().triggerRefresh();

    // 2. Génération immédiate du vrai reçu PDF
    generateReceiptPdf(
      {
        recuRef,
        datePaiement: `${dateStr} à ${heureStr}`,
        eleveNom: eleve.nom,
        elevePrenom: eleve.prenom,
        matricule: eleve.matricule,
        classe: eleve.classe,
        libelleEcheance: 'Scolarité - Solde comptant express (Direction)',
        montant: montantToPay,
        methodePaiement: 'especes',
        caissierNom: `${encaisseurNom} (Direction)`,
        ecoleNom: nomEtablissement,
      },
      'download'
    );

    // 3. Mise à jour de l'état local
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
                libelle: 'Encaissement Express Direction (Comptant)',
                montant: montantToPay,
                date: dateStr,
                methode: 'especes',
                statut: 'regle',
                recu_ref: recuRef,
              },
              ...item.timeline_paiements,
            ],
          };
        }
        return item;
      })
    );

    showToast(
      `✓ Solde de ${eleve.prenom} ${eleve.nom} réglé (${formatMRU(montantToPay)}). Reçu PDF officiel téléchargé.`,
      'success'
    );
    setTimeout(() => setJustPaidEleveId(null), 1400);
  };

  // Export & Relance modal state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [relancedStudentIds, setRelancedStudentIds] = useState<string[]>([]);

  // Export PDF réactif avec spinner et confirmation toast
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      generateFinancialReportPdf(MOCK_MONTHLY_REPORTS, authEcole?.nom || 'Établissement Scolaire');
      showToast('✓ Rapport de synthèse PDF généré et téléchargé avec succès !', 'success');
    } catch (err) {
      console.error('Erreur export PDF :', err);
      showToast('Erreur lors de la génération du rapport PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Actions groupées : ouverture du centre de relances
  const handleBulkRelance = () => {
    const count = selectedEleveIds.length;
    if (count === 0) return;
    setIsConfirmModalOpen(true);
  };

  // Action groupée : Exporter la sélection
  const handleBulkExport = () => {
    const selectedEleves = elevesList.filter((e) => selectedEleveIds.includes(e.id));
    if (selectedEleves.length === 0) return;
    try {
      exportElevesToExcel(selectedEleves, authEcole?.nom || 'Établissement Scolaire');
      showToast(`✓ Export comptable pour ${selectedEleves.length} élève(s) généré avec succès.`, 'info');
    } catch (err) {
      console.error('Erreur export Excel :', err);
      showToast("Erreur lors de l'export des élèves", 'error');
    }
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

      {/* Zero State Onboarding pour école neuve */}
      {elevesList.length === 0 && (
        <div className="bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent border border-blue-200/80 dark:border-blue-900 rounded-3xl p-8 text-center space-y-4 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <School className="h-7 w-7" />
          </div>
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Bienvenue sur votre espace de direction {authEcole?.nom ? `« ${authEcole.nom} »` : ''}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Votre établissement est actif et prêt. Vous pouvez dès maintenant inscrire vos premiers élèves ou configurer vos classes et tarifs.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => onNavigateToEleves && onNavigateToEleves('all')}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Inscrire un premier élève
            </Button>
          </div>
        </div>
      )}

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
          <table className="w-full text-left text-sm border-collapse min-w-[750px]">
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
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    {elevesList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <School className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          Aucun élève enregistré pour l'instant
                        </span>
                        <span className="text-xs text-slate-400 max-w-md">
                          Votre établissement vient d'être activé. Cliquez sur « Inscrire un premier élève » pour démarrer votre registre scolaire.
                        </span>
                      </div>
                    ) : (
                      'Aucun élève trouvé correspondant à vos critères de recherche.'
                    )}
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

      {/* Centre de Relance WhatsApp Groupée */}
      <ConfirmBulkRelanceModal
        isOpen={isConfirmModalOpen}
        count={kpis.nombreEnRetard}
        totalAmount={kpis.totalImpayes}
        eleves={selectedEleveIds.length > 0 ? elevesList.filter((e) => selectedEleveIds.includes(e.id)) : elevesList}
        ecoleNom={authEcole?.nom || 'Votre Établissement'}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedEleveIds([]);
        }}
      />
    </div>
  );
};
