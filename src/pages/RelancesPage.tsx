import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StudentInitials } from '../components/ui/StudentInitials';
import { KpiCard } from '../components/ui/KpiCard';
import { StudentDetailDrawer } from '../components/dashboard/StudentDetailDrawer';
import {
  MOCK_ELEVES,
  MOCK_HISTORIQUE_RELANCES,
  EleveWithStats,
  HistoriqueRelance,
} from '../lib/mockData';
import { formatMRU } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import {
  Send,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  X,
  CheckCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';

export const RelancesPage: React.FC = () => {
  const authProfile = useAuthStore((s) => s.profile);
  const [elevesList] = useState<EleveWithStats[]>(() => {
    if (authProfile?.ecole_id) return [];
    return MOCK_ELEVES;
  });
  const [relancesHistory, setRelancesHistory] = useState<HistoriqueRelance[]>(() => {
    if (authProfile?.ecole_id) return [];
    return MOCK_HISTORIQUE_RELANCES;
  });
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Context Menu & Drawer & Pagination
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [drawerEleve, setDrawerEleve] = useState<EleveWithStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filtrer les élèves en retard ou partiels
  const overdueEleves = useMemo(() => {
    return elevesList.filter((e) => e.statut === 'en_retard' || e.statut === 'partiel');
  }, [elevesList]);

  // Total des impayés cibles
  const totalImpayesCibles = useMemo(() => {
    return overdueEleves.reduce((sum, e) => sum + e.remaining, 0);
  }, [overdueEleves]);

  const totalPages = Math.max(1, Math.ceil(overdueEleves.length / pageSize));
  const paginatedOverdueEleves = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return overdueEleves.slice(start, start + pageSize);
  }, [overdueEleves, currentPage, pageSize]);

  // Bulk selection logic
  const isAllSelected =
    paginatedOverdueEleves.length > 0 &&
    paginatedOverdueEleves.every((e) => selectedEleveIds.includes(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEleveIds([]);
    } else {
      setSelectedEleveIds(paginatedOverdueEleves.map((e) => e.id));
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Relance individuelle
  const handleRelancerSingle = (eleve: EleveWithStats, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newLog: HistoriqueRelance = {
      id: `rel-${Date.now()}`,
      eleve_id: eleve.id,
      eleve_nom: `${eleve.nom} ${eleve.prenom}`,
      classe: eleve.classe,
      canal: 'WhatsApp',
      telephone: eleve.telephone_tuteur,
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      statut: 'Delivré',
      message_snippet: `Rappel EcoSurv: Échéance de ${formatMRU(eleve.remaining)} en retard pour ${eleve.prenom} ${eleve.nom}.`,
    };

    setRelancesHistory([newLog, ...relancesHistory]);
    showToast(`Rappel WhatsApp envoyé avec succès au tuteur de ${eleve.prenom} ${eleve.nom}`);
  };

  // Relance en masse (Bulk)
  const handleBulkRelance = () => {
    const count = selectedEleveIds.length;
    if (count === 0) return;

    showToast(`⚡ Campagne de relance envoyée à ${count} tuteur(s) d'élèves en retard !`);
    setSelectedEleveIds([]);
  };

  // Déclenchement campagne globale SMS
  const handleConfirmCampaign = () => {
    setIsSendingCampaign(true);
    setTimeout(() => {
      setIsSendingCampaign(false);
      const count = overdueEleves.length;
      showToast(`🚀 Campagne SMS globale expédiée avec succès vers ${count} tuteurs.`);
      setIsCampaignModalOpen(false);
    }, 750);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
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

            <button
              onClick={() => setSelectedEleveIds([])}
              className="text-xs text-slate-400 hover:text-white ml-2 underline"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Relances & Rappels Impayés
            </h1>
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              {overdueEleves.length} Dossiers Prioritaires
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Envoi automatisé et suivi des notifications SMS / WhatsApp envoyées aux responsables légaux.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setIsCampaignModalOpen(true)}
        >
          <Send className="h-4 w-4" />
          Lancer Campagne SMS Globale
        </Button>
      </div>

      {/* KPI Tiles (Nexoov Pastel Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Relances Expédiées"
          amount={relancesHistory.length}
          unit="count"
          subtitle="100% délivrées sans échec"
          icon={<MessageSquare className="h-5 w-5" />}
          variant="primary"
        />

        <KpiCard
          staggerIndex={1}
          title="Élèves Cibles"
          amount={overdueEleves.length}
          unit="count"
          subtitle="Familles en retard de paiement"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />

        <KpiCard
          staggerIndex={2}
          title="Volume Impayé Cible"
          amount={totalImpayesCibles}
          unit="MRU"
          subtitle="À recouvrer en urgence"
          icon={<Send className="h-5 w-5" />}
          variant="warning"
        />

        <KpiCard
          staggerIndex={3}
          title="Canal Principal"
          progress={96}
          subtitle="WhatsApp (96% d'ouverture)"
          icon={<PhoneCall className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Roster of Overdue Students (Nexoov Style) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="py-4 px-5 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Élèves en Retard ({overdueEleves.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Sélectionnez les élèves pour envoyer des rappels groupés.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-5">Élève</th>
                <th className="py-4 px-5">Classe</th>
                <th className="py-4 px-5">Tuteur Légal & Contact</th>
                <th className="py-4 px-5 text-right">Reste à Payer</th>
                <th className="py-4 px-5 text-center">Statut</th>
                <th className="py-4 px-5 text-right">Action Rapide</th>
                <th className="py-4 px-4 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedOverdueEleves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="py-8 px-4 text-center space-y-3 max-w-md mx-auto">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Tous les comptes sont à jour
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Aucun impayé ni retard de scolarité constaté pour le moment dans votre établissement.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOverdueEleves.map((eleve) => {
                const isChecked = selectedEleveIds.includes(eleve.id);
                const isMenuOpen = openMenuRowId === eleve.id;
                return (
                  <tr
                    key={eleve.id}
                    onClick={() => setDrawerEleve(eleve)}
                    className={`cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-blue-50/60 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {/* Élève sur 2 lignes */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {eleve.prenom} {eleve.nom}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            #{eleve.matricule}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {eleve.classe}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{eleve.nom_tuteur}</div>
                      <div className="text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 text-[11px]">
                        <PhoneCall className="h-3 w-3 text-slate-400" />
                        {eleve.telephone_tuteur}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                      {formatMRU(eleve.remaining)}
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <StatusBadge statut={eleve.statut} />
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="danger"
                        className="h-8 px-2.5 text-xs gap-1.5"
                        onClick={(e) => handleRelancerSingle(eleve, e)}
                      >
                        <Send className="h-3 w-3" />
                        Relancer
                      </Button>
                    </td>
                    {/* Context menu "..." */}
                    <td className="py-4 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuRowId(isMenuOpen ? null : eleve.id)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

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
                            <span>Voir la fiche</span>
                          </button>

                          <button
                            onClick={(e) => {
                              setOpenMenuRowId(null);
                              handleRelancerSingle(eleve, e);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Envoyer WhatsApp</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              window.print();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Imprimer avis d'impayé</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Affichage de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {overdueEleves.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            à{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, overdueEleves.length)}
            </span>{' '}
            sur <span className="font-bold text-slate-800 dark:text-slate-200">{overdueEleves.length}</span> impayés
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
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
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

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

      {/* Reminder Logs History */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="py-4 px-5 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Historique Chronologique des Relances Expédiées ({relancesHistory.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Traçabilité des notifications et accusés de réception
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-5">Date & Heure</th>
                <th className="py-4 px-5">Élève</th>
                <th className="py-4 px-5">Canal</th>
                <th className="py-4 px-5">Destinataire</th>
                <th className="py-4 px-5">Extrait du Message</th>
                <th className="py-4 px-5 text-center">Statut Envoi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {relancesHistory.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4.5 px-5 font-mono font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-4.5 px-5 font-bold text-slate-900 dark:text-white">
                    {log.eleve_nom} <span className="text-xs text-slate-400 font-normal">({log.classe})</span>
                  </td>
                  <td className="py-4.5 px-5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        log.canal === 'WhatsApp'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                      }`}
                    >
                      {log.canal}
                    </span>
                  </td>
                  <td className="py-4.5 px-5 font-mono text-slate-700 dark:text-slate-300">{log.telephone}</td>
                  <td className="py-4.5 px-5 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                    {log.message_snippet}
                  </td>
                  <td className="py-4.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      {log.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer Dossier Élève */}
      <StudentDetailDrawer
        eleve={drawerEleve}
        onClose={() => setDrawerEleve(null)}
        onQuickRelance={(el) => handleRelancerSingle(el)}
      />

      {/* Modal Campagne SMS Globale */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                Lancer une Campagne SMS Globale
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-xs space-y-2 text-rose-900 dark:text-rose-200">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                Confirmation d'envoi en masse :
              </div>
              <p className="leading-relaxed">
                Vous allez envoyer un SMS de relance automatisé à{' '}
                <span className="font-bold text-rose-950 dark:text-rose-100">{overdueEleves.length} tuteurs légaux</span> dont
                les échéances sont actuellement en retard.
              </p>
              <p className="font-mono text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                Volume total ciblé : {formatMRU(totalImpayesCibles)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCampaignModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                onClick={handleConfirmCampaign}
                loading={isSendingCampaign}
                loadingText="Expédition..."
              >
                <Send className="h-3.5 w-3.5" />
                Confirmer & Expédier SMS ({overdueEleves.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
