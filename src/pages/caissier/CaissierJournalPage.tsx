import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { KpiCard } from '../../components/ui/KpiCard';
import { Tooltip } from '../../components/ui/Tooltip';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { RecuPaiement } from '../../components/paiements/RecuPaiement';
import { formatMRU } from '../../lib/utils';
import { formatDateHeure, libelleMethode, libelleStatutPaiement, referenceRecu } from '../../lib/format';
import { nomComplet, todayISO } from '../../data/aggregations';
import { usePaiementsEcole } from '../../data/paiements';
import { useEcole } from '../../data/ecole';
import { useSession } from '../../data/useSession';
import type { MethodePaiement, PaiementView, StatutPaiement } from '../../types/domain';
import {
  Search,
  Receipt,
  ArrowDownToLine,
  Filter,
  Banknote,
  Clock3,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
} from 'lucide-react';

type Periode = 'today' | '7j' | '30j' | 'all';

const methodeBadge: Record<string, string> = {
  especes: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  bankily: 'bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
  masrvi: 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  cheque: 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
};

const statutBadge: Record<StatutPaiement, string> = {
  confirme: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  en_attente: 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  echoue: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  rembourse: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  annule: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

/** Date locale (AAAA-MM-JJ) à laquelle un paiement est rattaché dans le journal. */
const jourDuPaiement = (p: PaiementView) => todayISO(new Date(p.paye_le ?? p.created_at));

export const CaissierJournalPage: React.FC = () => {
  const { userId, profile } = useSession();
  const { data, isLoading, error, refetch } = usePaiementsEcole();
  const { data: ecole } = useEcole();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'all' | MethodePaiement>('all');
  const [periode, setPeriode] = useState<Periode>('all');
  const [recu, setRecu] = useState<PaiementView | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const paiements = useMemo(() => data ?? [], [data]);
  const today = todayISO();

  const enPeriode = useMemo(() => {
    if (periode === 'all') return paiements;
    const jours = periode === 'today' ? 0 : periode === '7j' ? 6 : 29;
    const debut = new Date();
    debut.setDate(debut.getDate() - jours);
    const borne = todayISO(debut);
    return paiements.filter((p) => jourDuPaiement(p) >= borne);
  }, [paiements, periode]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enPeriode.filter((p) => {
      const matchSearch =
        !q ||
        referenceRecu(p).toLowerCase().includes(q) ||
        (p.eleve?.nom ?? '').toLowerCase().includes(q) ||
        (p.eleve?.prenom ?? '').toLowerCase().includes(q) ||
        (p.eleve?.matricule ?? '').toLowerCase().includes(q);
      return matchSearch && (selectedMethod === 'all' || p.methode === selectedMethod);
    });
  }, [enPeriode, searchQuery, selectedMethod]);

  useEffect(() => setCurrentPage(1), [searchQuery, selectedMethod, periode]);

  const confirmesDuJour = paiements.filter((p) => p.statut === 'confirme' && jourDuPaiement(p) === today);
  const totalJour = confirmesDuJour.reduce((s, p) => s + p.montant, 0);
  const especesJour = confirmesDuJour.filter((p) => p.methode === 'especes').reduce((s, p) => s + p.montant, 0);
  const enAttente = paiements.filter((p) => p.statut === 'en_attente');
  const totalPeriode = filtered.filter((p) => p.statut === 'confirme').reduce((s, p) => s + p.montant, 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const lignes = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const encaissePar = (p: PaiementView): string | null =>
    p.encaisse_par === userId ? nomComplet(profile) : p.encaisse_par ? 'Un membre du personnel' : null;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Journal de Caisse</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Paiements enregistrés dans l'établissement, confirmés ou en attente de confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ComingSoon detail="export CSV">
            <Button variant="outline" size="sm" className="flex items-center gap-2" disabled>
              <ArrowDownToLine className="h-4 w-4" />
              Exporter CSV
            </Button>
          </ComingSoon>
          <ComingSoon detail="clôture de caisse journalière">
            <Button size="sm" className="flex items-center gap-2 font-semibold bg-amber-600 hover:bg-amber-700 border-amber-600 text-white" disabled>
              <Lock className="h-4 w-4" /> Clôturer la caisse du jour
            </Button>
          </ComingSoon>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Encaissé aujourd'hui"
          amount={totalJour}
          unit="MRU"
          subtitle={`${confirmesDuJour.length} paiement(s) confirmé(s)`}
          icon={<Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />
        <KpiCard
          title="Espèces aujourd'hui"
          amount={especesJour}
          unit="MRU"
          subtitle="Comptage physique du tiroir"
          icon={<Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="En attente de confirmation"
          amount={enAttente.length}
          unit="count"
          subtitle={`${formatMRU(enAttente.reduce((s, p) => s + p.montant, 0))} non imputés`}
          icon={<Clock3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />
        <KpiCard
          title="Confirmé sur la sélection"
          amount={totalPeriode}
          unit="MRU"
          subtitle={`${filtered.length} ligne(s) affichée(s)`}
          icon={<FileCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          variant="default"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par référence, élève, matricule..."
              aria-label="Rechercher dans le journal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select<Periode>
              value={periode}
              onChange={setPeriode}
              prefix="Période :"
              options={[
                { value: 'today', label: "Aujourd'hui" },
                { value: '7j', label: '7 derniers jours' },
                { value: '30j', label: '30 derniers jours' },
                { value: 'all', label: 'Tout' },
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
            <Select<'all' | MethodePaiement>
              value={selectedMethod}
              onChange={setSelectedMethod}
              prefix="Mode :"
              icon={<Filter className="h-4 w-4" />}
              options={[
                { value: 'all', label: 'Tous les modes' },
                { value: 'especes', label: 'Espèces' },
                { value: 'bankily', label: 'Bankily (BPM)' },
                { value: 'masrvi', label: 'Masrvi (BMCI)' },
                { value: 'cheque', label: 'Chèque' },
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        {paiements.length === 0 ? (
          <EmptyState title="Aucun paiement enregistré" description="Les encaissements du guichet apparaîtront ici." className="m-6" />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Date / Heure</th>
                    <th className="py-4 px-6">Référence</th>
                    <th className="py-4 px-6">Élève</th>
                    <th className="py-4 px-6">Échéance</th>
                    <th className="py-4 px-6">Mode</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6 text-right">Montant</th>
                    <th className="py-4 px-6 text-right">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lignes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Aucun paiement ne correspond à vos filtres.
                      </td>
                    </tr>
                  ) : (
                    lignes.map((p) => {
                      const { date, heure } = formatDateHeure(p.paye_le ?? p.created_at);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{heure}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{date}</div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-amber-700 dark:text-amber-400 text-xs whitespace-nowrap">
                            {referenceRecu(p)}
                          </td>
                          <td className="py-4 px-6 min-w-[200px]">
                            {p.eleve ? (
                              <div className="flex items-center gap-2.5">
                                <StudentInitials nom={p.eleve.nom} prenom={p.eleve.prenom} size="sm" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                    {p.eleve.prenom} {p.eleve.nom}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                    #{p.eleve.matricule ?? '—'} • {p.eleve.classe ?? '—'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="italic text-slate-400">Élève sorti des effectifs</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-slate-300 text-xs font-medium">{p.echeance_libelle ?? '—'}</td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${methodeBadge[p.methode] ?? statutBadge.annule}`}>
                              {libelleMethode(p.methode)}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statutBadge[p.statut]}`}>
                              {libelleStatutPaiement(p.statut)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-extrabold font-mono text-slate-900 dark:text-white text-sm whitespace-nowrap">
                            {formatMRU(p.montant)}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <Tooltip content="Voir le reçu">
                              <button
                                onClick={() => setRecu(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Voir le reçu"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * itemsPerPage, filtered.length)}</span> sur{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> paiements
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === p
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <RecuPaiement paiement={recu} ecoleNom={ecole?.nom ?? ''} encaissePar={recu ? encaissePar(recu) : null} onClose={() => setRecu(null)} />
    </div>
  );
};
