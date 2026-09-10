import React, { useState, useMemo, useEffect } from 'react';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  ElevePedagogique,
} from '../../lib/mockData';
import { StudentInitials } from '../../components/ui/StudentInitials';
import {
  Search,
  Phone,
  X,
  MapPin,
  MoreHorizontal,
  FileText,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

export const TeacherClassesPage: React.FC = () => {
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEleve, setSelectedEleve] = useState<ElevePedagogique | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fermer le menu contextuel si clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.student-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const teacherStudents = useMemo(() => {
    return getElevesForTeacher(MOCK_ELEVES, CURRENT_ENSEIGNANT.classes_assignees);
  }, []);

  const filteredStudents = useMemo(() => {
    return teacherStudents.filter((e) => {
      const matchClasse = selectedClasse === 'all' || e.classe === selectedClasse;
      const matchQuery =
        e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.matricule.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClasse && matchQuery;
    });
  }, [teacherStudents, selectedClasse, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Mes Classes Assignées
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {CURRENT_ENSEIGNANT.classes_assignees.length} classes
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Consultation du registre pédagogique, suivi de l'assiduité et coordonnées d'urgence des tuteurs légaux.
          </p>
        </div>

        {/* Filter by class pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedClasse('all');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedClasse === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Toutes ({teacherStudents.length})
          </button>
          {CURRENT_ENSEIGNANT.classes_assignees.map((cls) => {
            const count = teacherStudents.filter((e) => e.classe === cls).length;
            const isSelected = selectedClasse === cls;
            return (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClasse(cls);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                {cls} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Overview Cards (Nexoov Pastel Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CURRENT_ENSEIGNANT.classes_assignees.map((cls) => {
          const elevesClasse = teacherStudents.filter((e) => e.classe === cls);
          const moy =
            elevesClasse.reduce((sum, e) => sum + e.moyenne_generale, 0) / (elevesClasse.length || 1);
          const isSelected = selectedClasse === cls;

          return (
            <div
              key={cls}
              onClick={() => {
                setSelectedClasse(isSelected ? 'all' : cls);
                setCurrentPage(1);
              }}
              className={`p-6 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200 border bg-emerald-50/60 dark:bg-emerald-950/20 shadow-2xs ${
                isSelected
                  ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-emerald-200/70 dark:border-emerald-900/50 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Niveau Académique
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    Classe de {cls}
                  </h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-emerald-100 dark:border-emerald-900/60 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Moyenne Générale :</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-lg font-mono mt-0.5 block">
                    {Math.round(moy * 10) / 10} / 20
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Effectif & Assiduité :</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-lg font-mono mt-0.5 block">
                    {elevesClasse.length} élèves • 95.2%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster & Detail Panel Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Table list */}
        <div className={`${selectedEleve ? 'xl:col-span-8' : 'xl:col-span-12'} transition-all space-y-4`}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par élève ou matricule..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {filteredStudents.length} élèves trouvés
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-6">Élève</th>
                    <th className="py-4 px-6">Classe</th>
                    <th className="py-4 px-6">Tuteur Légal & Contact</th>
                    <th className="py-4 px-6 text-center">Absences</th>
                    <th className="py-4 px-6 text-center">Retards</th>
                    <th className="py-4 px-6 text-right">Moyenne</th>
                    <th className="py-4 px-6 text-right">Actions</th>
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
                      const isSelected = selectedEleve?.id === el.id;
                      return (
                        <tr
                          key={el.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* 2-line student display + avatar */}
                          <td
                            className="py-4 px-6 min-w-[220px] cursor-pointer"
                            onClick={() => setSelectedEleve(el)}
                          >
                            <div className="flex items-center gap-3">
                              <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                  {el.prenom} {el.nom}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                                  #{el.matricule} • {el.sexe === 'M' ? 'Garçon' : 'Fille'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Classe */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold">
                              {el.classe}
                            </span>
                          </td>

                          {/* Tuteur */}
                          <td className="py-4 px-6 min-w-[200px]">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {el.nom_tuteur}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 text-xs truncate">
                              <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{el.telephone_tuteur}</span>
                            </div>
                          </td>

                          {/* Absences */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            {el.nb_absences > 0 ? (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full font-bold text-xs font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {el.nb_absences} j
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-mono font-semibold">0</span>
                            )}
                          </td>

                          {/* Retards */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            {el.nb_retards > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full font-bold text-xs font-mono">
                                {el.nb_retards}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-mono font-semibold">0</span>
                            )}
                          </td>

                          {/* Moyenne */}
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                            {el.moyenne_generale} / 20
                          </td>

                          {/* Context menu "..." */}
                          <td className="py-4 px-6 text-right whitespace-nowrap relative student-menu-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === el.id ? null : el.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuId === el.id && (
                              <div className="absolute right-6 top-12 z-30 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-left animate-in fade-in zoom-in-95">
                                <button
                                  onClick={() => {
                                    setSelectedEleve(el);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  Voir la fiche élève
                                </button>
                                <button
                                  onClick={() => {
                                    showToast(`Ouverture carnet de notes pour ${el.prenom}`);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  Saisir une note
                                </button>
                                <button
                                  onClick={() => {
                                    showToast(`Signalement absence préparé pour ${el.prenom}`);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                                >
                                  <CalendarCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  Marquer absence/retard
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
            <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Affichage de{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                à{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Math.min(currentPage * itemsPerPage, filteredStudents.length)}
                </span>{' '}
                sur{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {filteredStudents.length}
                </span>{' '}
                élèves
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Detail Panel */}
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
                      Matricule: {selectedEleve.matricule}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Classe : {selectedEleve.classe} • Né le {selectedEleve.date_naissance}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEleve(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tuteur & Contact Urgence */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-2 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Contact Responsable / Urgence
                </span>
                <div className="font-semibold text-slate-900 dark:text-white">{selectedEleve.nom_tuteur}</div>
                <div className="text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{selectedEleve.telephone_tuteur}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedEleve.adresse_tuteur}</span>
                </div>
              </div>

              {/* Pedagogical Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                    Moyenne Actuelle
                  </span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                    {selectedEleve.moyenne_generale} / 20
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                    Total Absences
                  </span>
                  <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                    {selectedEleve.nb_absences} j
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-slate-400 dark:text-slate-500 text-[11px] italic">
                Dossier pédagogique sécurisé. Aucune donnée financière n'est accessible aux enseignants.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
