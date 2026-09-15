import React, { useEffect, useMemo, useState } from 'react';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { Tooltip } from '../../components/ui/Tooltip';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { formatDate } from '../../lib/format';
import { useElevesEnseignant } from '../../data/enseignant';
import { Search, X, ChevronLeft, ChevronRight, GraduationCap, Eye, ShieldCheck } from 'lucide-react';

export const TeacherClassesPage: React.FC = () => {
  const { classes, data, isLoading, error, refetch } = useElevesEnseignant();
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEleveId, setSelectedEleveId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const eleves = useMemo(() => data?.eleves ?? [], [data]);
  const absences = useMemo(() => data?.absences ?? [], [data]);
  const mesClasses = classes ?? [];

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eleves.filter((e) => {
      const matchClasse = selectedClasse === 'all' || e.classe === selectedClasse;
      const matchQuery =
        !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || (e.matricule ?? '').toLowerCase().includes(q);
      return matchClasse && matchQuery;
    });
  }, [eleves, selectedClasse, searchQuery]);

  useEffect(() => setCurrentPage(1), [selectedClasse, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const selectedEleve = eleves.find((e) => e.id === selectedEleveId) ?? null;
  const absencesEleve = selectedEleve ? absences.filter((a) => a.eleve_id === selectedEleve.id) : [];

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (mesClasses.length === 0) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
        <EmptyState
          title="Aucune classe ne vous est affectée"
          description="La direction de l'établissement doit vous affecter vos classes pour que vos élèves apparaissent ici."
        />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Mes Classes Assignées</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              {mesClasses.length} classe(s)
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Registre de vos élèves et suivi de leur assiduité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedClasse('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedClasse === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Toutes ({eleves.length})
          </button>
          {mesClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClasse(cls)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedClasse === cls
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              }`}
            >
              {cls} ({eleves.filter((e) => e.classe === cls).length})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mesClasses.map((cls) => {
          const elevesClasse = eleves.filter((e) => e.classe === cls);
          const isSelected = selectedClasse === cls;
          return (
            <button
              type="button"
              key={cls}
              onClick={() => setSelectedClasse(isSelected ? 'all' : cls)}
              className={`text-left p-6 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200 border bg-emerald-50/60 dark:bg-emerald-950/20 shadow-2xs ${
                isSelected
                  ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-emerald-200/70 dark:border-emerald-900/50 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Classe</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{cls}</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-emerald-100 dark:border-emerald-900/60 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Effectif</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-lg font-mono mt-0.5 block">{elevesClasse.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Absences</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-lg font-mono mt-0.5 block">
                    {elevesClasse.reduce((s, e) => s + e.nb_absences, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Retards</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-lg font-mono mt-0.5 block">
                    {elevesClasse.reduce((s, e) => s + e.nb_retards, 0)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className={`${selectedEleve ? 'xl:col-span-8' : 'xl:col-span-12'} transition-all space-y-4`}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par élève ou matricule..."
                  aria-label="Rechercher un élève"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">{filteredStudents.length} élèves</div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-6">Élève</th>
                    <th className="py-4 px-6">Classe</th>
                    <th className="py-4 px-6">Né(e) le</th>
                    <th className="py-4 px-6 text-center">Absences</th>
                    <th className="py-4 px-6 text-center">Retards</th>
                    <th className="py-4 px-6 text-center">Non justifiées</th>
                    <th className="py-4 px-6 text-right">Fiche</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        Aucun élève trouvé dans cette sélection.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((el) => {
                      const isSelected = selectedEleveId === el.id;
                      return (
                        <tr
                          key={el.id}
                          onClick={() => setSelectedEleveId(el.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/90 dark:bg-emerald-950/40' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-4 px-6 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                  {el.prenom} {el.nom}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                                  #{el.matricule ?? '—'}
                                  {el.sexe ? ` • ${el.sexe === 'M' ? 'Garçon' : 'Fille'}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold">
                              {el.classe ?? '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(el.date_naissance)}</td>
                          <td className="py-4 px-6 text-center font-mono font-semibold">{el.nb_absences}</td>
                          <td className="py-4 px-6 text-center font-mono font-semibold">{el.nb_retards}</td>
                          <td className="py-4 px-6 text-center font-mono font-semibold">
                            {el.nb_non_justifiees > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400">{el.nb_non_justifiees}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <Tooltip content="Voir la fiche élève">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEleveId(el.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Voir la fiche élève"
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
                Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{filteredStudents.length === 0 ? 0 : (page - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * itemsPerPage, filteredStudents.length)}</span> sur{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> élèves
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
          </div>
        </div>

        {selectedEleve && (
          <div className="xl:col-span-4 animate-stagger-rise">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <StudentInitials nom={selectedEleve.nom} prenom={selectedEleve.prenom} size="lg" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedEleve.prenom} {selectedEleve.nom}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                      Matricule : {selectedEleve.matricule ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Classe : {selectedEleve.classe ?? '—'} • Né(e) le {formatDate(selectedEleve.date_naissance)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEleveId(null)}
                  aria-label="Fermer la fiche"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {(
                  [
                    ['Absences', selectedEleve.nb_absences, 'text-rose-600 dark:text-rose-400'],
                    ['Retards', selectedEleve.nb_retards, 'text-amber-600 dark:text-amber-400'],
                    ['À justifier', selectedEleve.nb_non_justifiees, 'text-slate-700 dark:text-slate-200'],
                  ] as const
                ).map(([label, valeur, couleur]) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">{label}</span>
                    <span className={`text-xl font-extrabold font-mono ${couleur}`}>{valeur}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Historique d'assiduité</h4>
                {absencesEleve.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">Aucune absence ni retard saisi.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                    {absencesEleve.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-xs rounded-lg border border-slate-200/80 dark:border-slate-700/60 p-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {a.type === 'retard' ? 'Retard' : 'Absence'} • {formatDate(a.date_absence)}
                        </span>
                        <span className={a.justifiee ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-start gap-2 pt-2 text-slate-400 dark:text-slate-500 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-px" />
                Dossier pédagogique : aucune donnée financière ni coordonnée de tuteur n'est accessible aux enseignants.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
