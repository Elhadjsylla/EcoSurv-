import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StudentInitials } from '../components/ui/StudentInitials';
import {
  MOCK_ELEVES,
  MOCK_HISTORIQUE_RELANCES,
  EleveWithStats,
  HistoriqueRelance,
} from '../lib/mockData';
import { formatMRU } from '../lib/utils';
import { formatCompactMRU } from '../lib/formatCompactMRU';
import {
  Send,
  MessageSquare,
  Phone,
  CheckCircle2,
  AlertTriangle,
  X,
  CheckCircle,
} from 'lucide-react';

export const RelancesPage: React.FC = () => {
  const [elevesList] = useState<EleveWithStats[]>(MOCK_ELEVES);
  const [relancesHistory, setRelancesHistory] = useState<HistoriqueRelance[]>(MOCK_HISTORIQUE_RELANCES);
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtrer les élèves en retard ou partiels
  const overdueEleves = useMemo(() => {
    return elevesList.filter((e) => e.statut === 'en_retard' || e.statut === 'partiel');
  }, [elevesList]);

  // Total des impayés cibles
  const totalImpayesCibles = useMemo(() => {
    return overdueEleves.reduce((sum, e) => sum + e.remaining, 0);
  }, [overdueEleves]);

  // Bulk selection logic
  const isAllSelected =
    overdueEleves.length > 0 &&
    overdueEleves.every((e) => selectedEleveIds.includes(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEleveIds([]);
    } else {
      setSelectedEleveIds(overdueEleves.map((e) => e.id));
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
  const handleRelancerSingle = (eleve: EleveWithStats) => {
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
    const count = overdueEleves.length;
    showToast(`🚀 Campagne SMS globale initiée vers ${count} tuteurs. Reçus transmis.`);
    setIsCampaignModalOpen(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Relances & Rappels Impayés
            </h1>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              {overdueEleves.length} Dossiers Prioritaires
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
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

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Relances Expédiées
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-2 truncate">
              {relancesHistory.length}
            </div>
            <span className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> 100% délivrées
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Élèves Cibles
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono mt-2 truncate">
              {overdueEleves.length}
            </div>
            <span className="text-xs text-red-600 font-semibold mt-1.5 block truncate">
              Familles en retard de paiement
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Volume Impayé Cible
            </span>
            <div
              title={formatMRU(totalImpayesCibles)}
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-2 truncate cursor-help"
            >
              {formatCompactMRU(totalImpayesCibles)}
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1.5 block truncate">
              À recouvrer
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Send className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate block">
              Canal Principal
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-2 truncate">
              WhatsApp
            </div>
            <span className="text-xs text-slate-500 font-medium mt-1.5 block truncate">
              Taux d'ouverture 96%
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Roster of Overdue Students */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <h3 className="text-sm font-bold text-slate-900">
              Élèves en Retard ({overdueEleves.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Sélectionnez les élèves pour envoyer des rappels groupés.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6">Élève</th>
                <th className="py-4 px-6">Classe</th>
                <th className="py-4 px-6">Tuteur Légal & Contact</th>
                <th className="py-4 px-6 text-right">Reste à Payer</th>
                <th className="py-4 px-6 text-center">Statut</th>
                <th className="py-4 px-6 text-right">Action Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdueEleves.map((eleve) => {
                const isChecked = selectedEleveIds.includes(eleve.id);
                return (
                  <tr
                    key={eleve.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isChecked ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-4.5 px-6 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => toggleSelectEleve(eleve.id, e as any)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900">
                            {eleve.prenom} {eleve.nom}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {eleve.matricule}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {eleve.classe}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-semibold text-slate-800">{eleve.nom_tuteur}</div>
                      <div className="text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {eleve.telephone_tuteur}
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-right font-mono font-extrabold text-red-700 text-sm">
                      {formatMRU(eleve.remaining)}
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      <StatusBadge statut={eleve.statut} />
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        className="h-8 px-2.5 text-xs gap-1.5"
                        onClick={() => handleRelancerSingle(eleve)}
                      >
                        <Send className="h-3 w-3" />
                        Relancer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Logs History */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Historique Chronologique des Relances Expédiées
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Traçabilité des notifications
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Date & Heure</th>
                <th className="py-4 px-6">Élève</th>
                <th className="py-4 px-6">Canal</th>
                <th className="py-4 px-6">Destinataire</th>
                <th className="py-4 px-6">Extrait du Message</th>
                <th className="py-4 px-6 text-center">Statut Envoi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relancesHistory.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4.5 px-6 font-mono font-medium text-slate-600 whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-4.5 px-6 font-bold text-slate-900">
                    {log.eleve_nom} ({log.classe})
                  </td>
                  <td className="py-4.5 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        log.canal === 'WhatsApp'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.canal}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 font-mono text-slate-700">{log.telephone}</td>
                  <td className="py-4.5 px-6 text-slate-600 truncate max-w-xs">
                    {log.message_snippet}
                  </td>
                  <td className="py-4.5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {log.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Campagne SMS Globale */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-red-600" />
                Lancer une Campagne SMS Globale
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs space-y-2 text-red-900">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                Confirmation d'envoi en masse :
              </div>
              <p className="leading-relaxed">
                Vous allez envoyer un SMS de relance automatisé à{' '}
                <span className="font-bold">{overdueEleves.length} tuteurs légaux</span> dont
                les échéances sont actuellement en retard.
              </p>
              <p className="font-mono text-[11px] text-red-700 font-semibold">
                Volume total ciblé : {formatMRU(totalImpayesCibles)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
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
