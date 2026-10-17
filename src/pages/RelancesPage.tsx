import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StudentInitials } from '../components/ui/StudentInitials';
import { KpiCard } from '../components/ui/KpiCard';
import { StudentDetailDrawer } from '../components/dashboard/StudentDetailDrawer';
import { EleveWithStats } from '../lib/mockData';
import { formatMRU } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import {
  Send,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const RelancesPage: React.FC = () => {
  const authProfile = useAuthStore((s) => s.profile);
  const [elevesList, setElevesList] = useState<EleveWithStats[]>([]);

  // Charger les élèves et échéances réelles depuis Supabase
  React.useEffect(() => {
    if (authProfile?.ecole_id) {
      const fetchOverdueData = async () => {
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
        } catch (err) {
          console.warn('[RelancesPage] Erreur chargement:', err);
        }
      };
      fetchOverdueData();
    }
  }, [authProfile?.ecole_id]);

  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);

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

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {/* Floating Bulk Action Bar */}
      {selectedEleveIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-6">
          <span className="text-xs font-bold text-slate-300">
            <span className="text-blue-400 font-mono text-sm">{selectedEleveIds.length}</span> élève(s) sélectionné(s)
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={true}
              title="Fonction en cours d'intégration télécom"
              className="gap-1.5 py-1 text-xs opacity-60 cursor-not-allowed bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <Send className="h-3.5 w-3.5" />
              Relance groupée (Bientôt disponible)
            </Button>

            <button
              onClick={() => setSelectedEleveIds([])}
              className="text-xs text-slate-400 hover:text-white ml-2 underline cursor-pointer"
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
            Suivi des créances en retard et préparation des relances tuteurs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={true}
          title="Fonction en cours d'intégration télécom"
          className="gap-2 shrink-0 opacity-60 cursor-not-allowed shadow-none"
        >
          <Send className="h-4 w-4" />
          Campagne SMS (Bientôt disponible)
        </Button>
      </div>

      {/* Avertissement officiel persistance */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="font-semibold">
          Module en cours d'intégration : les relances automatiques par SMS et WhatsApp sont en attente de passerelle opérateur.
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Envoi Automatisé"
          customValue="Bientôt"
          subtitle="Intégration télécom en cours"
          icon={<MessageSquare className="h-5 w-5" />}
          variant="default"
        />

        <KpiCard
          staggerIndex={1}
          title="Élèves Débiteurs"
          amount={overdueEleves.length}
          unit="count"
          subtitle="Dossiers en retard de paiement"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />

        <KpiCard
          staggerIndex={2}
          title="Volume Impayé"
          amount={totalImpayesCibles}
          unit="MRU"
          subtitle="Montant total à recouvrer"
          icon={<Send className="h-5 w-5" />}
          variant="warning"
        />

        <KpiCard
          staggerIndex={3}
          title="Canaux Prévus"
          customValue="SMS / WhatsApp"
          subtitle="Passerelle en développement"
          icon={<PhoneCall className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Roster of Overdue Students */}
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
              Élèves Débiteurs ({overdueEleves.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Liste des élèves avec échéances en retard ou soldes partiels.
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
                <th className="py-4 px-5 text-right">Relance</th>
                <th className="py-4 px-4 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedOverdueEleves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
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
                          {eleve.telephone_tuteur || 'Non renseigné'}
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
                          variant="outline"
                          disabled={true}
                          className="h-8 px-2.5 text-xs gap-1.5 opacity-60 cursor-not-allowed"
                          title="Envoi bientôt disponible"
                        >
                          <Send className="h-3 w-3" />
                          Bientôt disponible
                        </Button>
                      </td>
                      <td className="py-4 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuRowId(isMenuOpen ? null : eleve.id)}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                setDrawerEleve(eleve);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Voir la fiche</span>
                            </button>

                            <button
                              disabled={true}
                              title="Fonction en cours d'intégration télécom"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 font-semibold cursor-not-allowed"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Envoyer WhatsApp (Bientôt disponible)</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuRowId(null);
                                window.print();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700 cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                              <span>Imprimer avis d'impayé</span>
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
      />
    </div>
  );
};
