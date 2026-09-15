import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { KpiCard } from '../../components/ui/KpiCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { formatDate } from '../../lib/format';
import { todayISO } from '../../data/aggregations';
import { messageErreurDonnees } from '../../data/errors';
import { useElevesEnseignant, useEnregistrerAppel, type SaisiePresence, type StatutPresence } from '../../data/enseignant';
import { CalendarCheck, CheckCircle2, XCircle, Clock, Sparkles, FileCheck, Users, ChevronLeft, ChevronRight } from 'lucide-react';

type Toast = { message: string; type: 'success' | 'info' | 'warning' };

const PRESENT: SaisiePresence = { statut: 'present', motif: '', justifiee: false };

export const TeacherAbsencesPage: React.FC = () => {
  const { classes, data, isLoading, error, refetch } = useElevesEnseignant();
  const enregistrer = useEnregistrerAppel();

  const mesClasses = useMemo(() => classes ?? [], [classes]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [saisies, setSaisies] = useState<Record<string, SaisiePresence>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const classe = selectedClasse || mesClasses[0] || '';
  const elevesClasse = useMemo(() => (data?.eleves ?? []).filter((e) => e.classe === classe), [data, classe]);
  const absences = useMemo(() => data?.absences ?? [], [data]);

  // La feuille d'appel reprend ce qui est déjà enregistré pour cette classe et cette date.
  useEffect(() => {
    const initiales: Record<string, SaisiePresence> = {};
    for (const eleve of elevesClasse) {
      const existantes = absences.filter((a) => a.eleve_id === eleve.id && a.date_absence === selectedDate);
      const saisie = existantes.find((a) => a.type === 'absence') ?? existantes.find((a) => a.type === 'retard');
      initiales[eleve.id] = saisie
        ? { statut: saisie.type === 'absence' ? 'absent' : 'retard', motif: saisie.motif ?? '', justifiee: saisie.justifiee }
        : PRESENT;
    }
    setSaisies(initiales);
    setCurrentPage(1);
  }, [elevesClasse, absences, selectedDate]);

  const statutDe = (id: string): StatutPresence => saisies[id]?.statut ?? 'present';
  const modifier = (id: string, patch: Partial<SaisiePresence>) =>
    setSaisies((prev) => {
      const courant = prev[id] ?? PRESENT;
      const suivant = { ...courant, ...patch };
      return { ...prev, [id]: suivant.statut === 'present' ? PRESENT : suivant };
    });

  const countPresents = elevesClasse.filter((e) => statutDe(e.id) === 'present').length;
  const countAbsents = elevesClasse.filter((e) => statutDe(e.id) === 'absent').length;
  const countRetards = elevesClasse.filter((e) => statutDe(e.id) === 'retard').length;
  const tauxPresence = elevesClasse.length > 0 ? Math.round((countPresents / elevesClasse.length) * 100) : 100;

  const totalPages = Math.max(1, Math.ceil(elevesClasse.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = elevesClasse.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSave = async () => {
    try {
      const resultat = await enregistrer.mutateAsync({
        date: selectedDate,
        eleveIds: elevesClasse.map((e) => e.id),
        saisies,
      });
      setToast({
        message: `Appel de ${classe} du ${formatDate(selectedDate)} enregistré : ${resultat.enregistrees} absence(s) ou retard(s).`,
        type: 'success',
      });
    } catch (e) {
      setToast({ message: messageErreurDonnees(e), type: 'warning' });
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (mesClasses.length === 0) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
        <EmptyState
          title="Aucune classe ne vous est affectée"
          description="La direction de l'établissement doit vous affecter vos classes avant la saisie des absences."
        />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Saisie des Absences & Retards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Faites l'appel d'une classe pour une date : la saisie est enregistrée dans le dossier de chaque élève.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={() => setSaisies(Object.fromEntries(elevesClasse.map((e) => [e.id, PRESENT])))}
          >
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Tous présents
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-xs"
            onClick={handleSave}
            loading={enregistrer.isPending}
            loadingText="Enregistrement…"
            disabled={elevesClasse.length === 0}
          >
            <FileCheck className="h-4 w-4" />
            Enregistrer l'appel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Élèves présents"
          amount={countPresents}
          unit="count"
          subtitle={`Sur ${elevesClasse.length} élèves`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Élèves absents"
          amount={countAbsents}
          unit="count"
          subtitle="Dans la saisie en cours"
          icon={<XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />
        <KpiCard
          title="Arrivées tardives"
          amount={countRetards}
          unit="count"
          subtitle="Dans la saisie en cours"
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />
        <KpiCard
          title="Taux de présence"
          progress={tauxPresence}
          subtitle="Calculé sur la saisie en cours"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />
      </div>

      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={classe}
              onChange={setSelectedClasse}
              prefix="Classe :"
              options={mesClasses.map((c) => ({ value: c, label: c }))}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />
            <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)} max={todayISO()} size="sm" triggerClassName="h-10 rounded-xl text-xs font-bold" />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Appel de <span className="font-bold text-slate-800 dark:text-slate-200">{classe}</span> • {formatDate(selectedDate)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {elevesClasse.length === 0 ? (
          <EmptyState title={`Aucun élève actif en ${classe}`} className="m-6" />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-6">Élève</th>
                    <th className="py-4 px-6 text-center w-80">Présence</th>
                    <th className="py-4 px-6">Motif & justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map((el) => {
                    const statut = statutDe(el.id);
                    const saisie = saisies[el.id] ?? PRESENT;
                    return (
                      <tr
                        key={el.id}
                        className={`transition-colors ${
                          statut === 'absent'
                            ? 'bg-red-50/40 dark:bg-red-950/20'
                            : statut === 'retard'
                            ? 'bg-amber-50/40 dark:bg-amber-950/20'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-4 px-6 min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                                {el.prenom} {el.nom}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">#{el.matricule ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div
                            role="radiogroup"
                            aria-label={`Présence de ${el.prenom} ${el.nom}`}
                            className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1"
                          >
                            {(
                              [
                                ['present', 'Présent', CheckCircle2, 'bg-emerald-600'],
                                ['absent', 'Absent', XCircle, 'bg-rose-600'],
                                ['retard', 'Retard', Clock, 'bg-amber-600'],
                              ] as const
                            ).map(([valeur, label, Icon, actif]) => (
                              <button
                                key={valeur}
                                type="button"
                                role="radio"
                                aria-checked={statut === valeur}
                                onClick={() => modifier(el.id, { statut: valeur })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  statut === valeur
                                    ? `${actif} text-white shadow-xs`
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {statut !== 'present' ? (
                            <div className="flex items-center gap-3 animate-scale-in">
                              <input
                                type="text"
                                aria-label="Motif"
                                placeholder={statut === 'retard' ? 'Ex : 15 min de retard' : "Motif de l'absence..."}
                                value={saisie.motif}
                                onChange={(e) => modifier(el.id, { motif: e.target.value })}
                                className="flex-1 max-w-sm h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                              />
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium select-none">
                                <input
                                  type="checkbox"
                                  checked={saisie.justifiee}
                                  onChange={(e) => modifier(el.id, { justifiee: e.target.checked })}
                                  className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Justifiée</span>
                              </label>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">En classe</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * itemsPerPage, elevesClasse.length)}</span> sur{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{elevesClasse.length}</span> élèves
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
                        ? 'bg-emerald-600 text-white shadow-xs'
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

      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Derniers signalements enregistrés
        </h3>
        {absences.length === 0 ? (
          <EmptyState title="Aucune absence enregistrée" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {absences.slice(0, 8).map((abs) => (
              <div key={abs.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {abs.eleve_prenom} {abs.eleve_nom}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      abs.type === 'retard'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    {abs.type === 'retard' ? 'Retard' : 'Absent'}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between">
                  <span>{abs.classe ?? '—'}</span>
                  <span>{formatDate(abs.date_absence)}</span>
                </div>
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                  {abs.motif || 'Aucun motif renseigné'} • {abs.justifiee ? 'Justifiée' : 'Non justifiée'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
