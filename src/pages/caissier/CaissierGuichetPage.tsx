import React, { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Tooltip } from '../../components/ui/Tooltip';
import { ErrorState, LoadingState } from '../../components/ui/DataState';
import { PaiementForm } from '../../components/paiements/PaiementForm';
import { RecuPaiement } from '../../components/paiements/RecuPaiement';
import { messagePaiementEnregistre } from '../../components/paiements/messages';
import { formatMRU } from '../../lib/utils';
import { formatDate } from '../../lib/format';
import { nomComplet } from '../../data/aggregations';
import { useSituationsEleves } from '../../data/eleves';
import { useEcole } from '../../data/ecole';
import { useSession } from '../../data/useSession';
import type { PaiementView } from '../../types/domain';
import { CreditCard, Search, Building, User, X } from 'lucide-react';

interface CaissierGuichetPageProps {
  preselectedEleveId?: string;
}

type Toast = { message: string; type: 'success' | 'info' | 'warning' };

export const CaissierGuichetPage: React.FC<CaissierGuichetPageProps> = ({ preselectedEleveId }) => {
  const { profile } = useSession();
  const { data, isLoading, error, refetch } = useSituationsEleves();
  const { data: ecole } = useEcole();
  const elevesList = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEleveId, setSelectedEleveId] = useState<string>(preselectedEleveId ?? '');
  const [recu, setRecu] = useState<PaiementView | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const operateur = nomComplet(profile);
  const selectedEleve = elevesList.find((e) => e.id === selectedEleveId) ?? null;

  const searchedEleves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return elevesList
      .filter(
        (e) =>
          e.nom.toLowerCase().includes(q) ||
          e.prenom.toLowerCase().includes(q) ||
          (e.matricule ?? '').toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [elevesList, searchQuery]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Guichet d'Encaissement & Paiements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Enregistrez les versements rattachés aux échéances des élèves et délivrez un reçu.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Opérateur :</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Building className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {operateur}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Identification de l'élève */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 sm:p-7 rounded-2xl space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              1. Identifier l'élève
            </h2>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher par nom ou matricule..."
                aria-label="Rechercher un élève"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all"
              />
            </div>

            {searchQuery.trim() && (
              <div className="space-y-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 p-1.5 scrollbar-thin">
                {searchedEleves.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Aucun élève trouvé pour cette recherche.
                  </div>
                ) : (
                  searchedEleves.map((el) => (
                    <button
                      type="button"
                      key={el.id}
                      onClick={() => {
                        setSelectedEleveId(el.id);
                        setSearchQuery('');
                      }}
                      className="w-full p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs cursor-pointer transition-all flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {el.prenom} {el.nom}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {el.matricule ?? '—'} • {el.classe ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Reste dû</span>
                        <span className="text-xs font-extrabold font-mono text-rose-600 dark:text-rose-400">{formatMRU(el.remaining)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedEleve ? (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/25 p-4 space-y-3 animate-scale-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StudentInitials nom={selectedEleve.nom} prenom={selectedEleve.prenom} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedEleve.prenom} {selectedEleve.nom}
                      </h3>
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-mono font-bold">
                        {selectedEleve.matricule ?? '—'} • Classe : {selectedEleve.classe ?? '—'}
                      </p>
                    </div>
                  </div>
                  <Tooltip content="Changer d'élève">
                    <button
                      onClick={() => setSelectedEleveId('')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-white dark:hover:bg-slate-800"
                      aria-label="Changer d'élève"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total déjà payé</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                      {formatMRU(selectedEleve.total_paid)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Reste à recouvrer</span>
                    <span className="text-sm font-extrabold font-mono text-rose-600 dark:text-rose-400">
                      {formatMRU(selectedEleve.remaining)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  {selectedEleve.echeances.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 truncate text-slate-700 dark:text-slate-300">
                        {e.libelle} <span className="text-slate-400">• {formatDate(e.date_echeance)}</span>
                      </span>
                      <StatusBadge statut={e.statut} className="shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <User className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Aucun élève sélectionné</p>
                <p className="text-[11px]">Recherchez un élève par nom ou matricule pour charger son échéancier.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Enregistrement du règlement */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              2. Enregistrement du règlement
            </h2>
            {selectedEleve ? (
              <PaiementForm
                key={selectedEleve.id}
                eleve={selectedEleve}
                accent="amber"
                onSaved={(paiement, echeance) => {
                  setToast(messagePaiementEnregistre(paiement, selectedEleve));
                  setRecu({
                    ...paiement,
                    echeance_libelle: echeance.libelle,
                    eleve: {
                      id: selectedEleve.id,
                      nom: selectedEleve.nom,
                      prenom: selectedEleve.prenom,
                      matricule: selectedEleve.matricule,
                      classe: selectedEleve.classe,
                    },
                  });
                }}
              />
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Sélectionnez d'abord un élève.</p>
            )}
          </Card>
        </div>
      </div>

      <RecuPaiement paiement={recu} ecoleNom={ecole?.nom ?? ''} encaissePar={operateur} onClose={() => setRecu(null)} />
    </div>
  );
};
