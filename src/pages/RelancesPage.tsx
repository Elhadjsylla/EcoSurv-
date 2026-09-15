import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StudentInitials } from '../components/ui/StudentInitials';
import { KpiCard } from '../components/ui/KpiCard';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { StudentDetailDrawer } from '../components/dashboard/StudentDetailDrawer';
import { formatMRU } from '../lib/utils';
import { useSituationsEleves } from '../data/eleves';
import { Send, MessageSquare, PhoneCall, AlertTriangle, ChevronLeft, ChevronRight, History } from 'lucide-react';

export const RelancesPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const [drawerEleveId, setDrawerEleveId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const elevesEnRetard = useMemo(
    () =>
      (data ?? [])
        .filter((e) => e.statut === 'en_retard')
        .map((e) => ({
          eleve: e,
          // Seules les échéances échues comptent dans le montant à relancer.
          resteEchu: e.echeances.filter((ech) => ech.statut === 'en_retard').reduce((s, ech) => s + ech.reste, 0),
        }))
        .sort((a, b) => b.resteEchu - a.resteEchu),
    [data]
  );

  const volumeEchu = elevesEnRetard.reduce((s, r) => s + r.resteEchu, 0);
  const joignables = elevesEnRetard.filter((r) => r.eleve.tuteur?.telephone).length;
  const totalPages = Math.max(1, Math.ceil(elevesEnRetard.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const lignes = elevesEnRetard.slice((page - 1) * pageSize, page * pageSize);
  const drawerEleve = (data ?? []).find((e) => e.id === drawerEleveId) ?? null;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Relances & Rappels Impayés
            </h1>
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              {elevesEnRetard.length} dossiers en retard
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Élèves dont au moins une échéance est échue et non soldée.
          </p>
        </div>

        <ComingSoon detail="envoi SMS / WhatsApp">
          <Button variant="danger" size="sm" className="gap-2 shrink-0" disabled>
            <Send className="h-4 w-4" />
            Lancer une campagne SMS
          </Button>
        </ComingSoon>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Élèves en retard"
          amount={elevesEnRetard.length}
          unit="count"
          subtitle="Au moins une échéance échue"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />
        <KpiCard
          staggerIndex={1}
          title="Montant échu impayé"
          amount={volumeEchu}
          unit="MRU"
          subtitle="Échéances passées non soldées"
          icon={<Send className="h-5 w-5" />}
          variant="warning"
        />
        <KpiCard
          staggerIndex={2}
          title="Tuteurs joignables"
          amount={joignables}
          unit="count"
          subtitle={`Téléphone renseigné sur ${elevesEnRetard.length} dossiers`}
          icon={<PhoneCall className="h-5 w-5" />}
          variant="success"
        />
        <KpiCard
          staggerIndex={3}
          title="Relances envoyées"
          customValue="—"
          subtitle="Suivi des envois disponible prochainement"
          icon={<MessageSquare className="h-5 w-5" />}
          variant="primary"
        />
      </div>

      {elevesEnRetard.length === 0 ? (
        <EmptyState title="Aucun élève en retard" description="Toutes les échéances échues sont soldées." />
      ) : (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="py-4 px-5 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Élèves en retard ({elevesEnRetard.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-5">Élève</th>
                  <th className="py-4 px-5">Classe</th>
                  <th className="py-4 px-5">Tuteur Légal & Contact</th>
                  <th className="py-4 px-5 text-right">Échu impayé</th>
                  <th className="py-4 px-5 text-right">Reste total</th>
                  <th className="py-4 px-5 text-center">Statut</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {lignes.map(({ eleve, resteEchu }) => (
                  <tr
                    key={eleve.id}
                    onClick={() => setDrawerEleveId(eleve.id)}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {eleve.prenom} {eleve.nom}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">#{eleve.matricule ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {eleve.classe ?? '—'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {eleve.tuteur ? (
                        <>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{eleve.tuteur.nom}</div>
                          <div className="text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 text-[11px]">
                            <PhoneCall className="h-3 w-3 text-slate-400" />
                            {eleve.tuteur.telephone ?? 'Non renseigné'}
                          </div>
                        </>
                      ) : (
                        <span className="italic text-slate-400">Aucun tuteur rattaché</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                      {formatMRU(resteEchu)}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-slate-600 dark:text-slate-400">{formatMRU(eleve.remaining)}</td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <StatusBadge statut={eleve.statut} />
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <ComingSoon detail="envoi SMS / WhatsApp" side="left">
                        <Button size="sm" variant="danger" className="h-8 px-2.5 text-xs gap-1.5" disabled>
                          <Send className="h-3 w-3" />
                          Relancer
                        </Button>
                      </ComingSoon>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1}</span> à{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * pageSize, elevesEnRetard.length)}</span> sur{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{elevesEnRetard.length}</span> dossiers
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

      <EmptyState
        comingSoon
        icon={<History className="h-5 w-5" />}
        title="Historique des relances expédiées"
        description="L'envoi des rappels SMS / WhatsApp et leur historique arriveront avec la passerelle de messagerie (Edge Function)."
      />

      <StudentDetailDrawer eleve={drawerEleve} onClose={() => setDrawerEleveId(null)} />
    </div>
  );
};
