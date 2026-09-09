import React, { useState, useMemo } from 'react';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  ElevePedagogique,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { StudentInitials } from '../../components/ui/StudentInitials';
import {
  Search,
  Phone,
  X,
  MapPin,
} from 'lucide-react';

export const TeacherClassesPage: React.FC = () => {
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEleve, setSelectedEleve] = useState<ElevePedagogique | null>(null);

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

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Mes Classes Assignées
            </h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              {CURRENT_ENSEIGNANT.classes_assignees.length} classes
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
            Consultation du registre pédagogique, suivi de l'assiduité et coordonnées d'urgence des tuteurs légaux.
          </p>
        </div>

        {/* Filter by class pills */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSelectedClasse('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedClasse === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Toutes ({teacherStudents.length})
          </button>
          {CURRENT_ENSEIGNANT.classes_assignees.map((cls) => {
            const count = teacherStudents.filter((e) => e.classe === cls).length;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClasse(cls)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedClasse === cls
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {cls} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CURRENT_ENSEIGNANT.classes_assignees.map((cls) => {
          const elevesClasse = teacherStudents.filter((e) => e.classe === cls);
          const moy =
            elevesClasse.reduce((sum, e) => sum + e.moyenne_generale, 0) / (elevesClasse.length || 1);
          const isSelected = selectedClasse === cls;

          return (
            <Card
              key={cls}
              onClick={() => setSelectedClasse(isSelected ? 'all' : cls)}
              className={`p-6 sm:p-7 rounded-2xl cursor-pointer transition-all hover:border-emerald-400 ${
                isSelected ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Niveau Académique
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">Classe de {cls}</h3>
                </div>
                <span className="rounded-xl bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-bold border border-emerald-200">
                  {elevesClasse.length} élèves
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Moyenne Générale :</span>
                  <span className="font-extrabold text-slate-900 text-lg font-mono mt-0.5 block">
                    {Math.round(moy * 10) / 10} / 20
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Taux d'assiduité :</span>
                  <span className="font-extrabold text-emerald-700 text-lg font-mono mt-0.5 block">
                    95.2%
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Roster & Detail Panel Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Table list */}
        <div className={`${selectedEleve ? 'xl:col-span-8' : 'xl:col-span-12'} transition-all space-y-4`}>
          <Card className="p-6 rounded-2xl space-y-6">
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par élève ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Students Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6">Élève & Matricule</th>
                      <th className="py-4 px-6">Classe</th>
                      <th className="py-4 px-6">Tuteur Légal & Contact</th>
                      <th className="py-4 px-6 text-center">Absences</th>
                      <th className="py-4 px-6 text-center">Retards</th>
                      <th className="py-4 px-6 text-right">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                          Aucun élève trouvé dans cette sélection.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((el) => {
                        const isSelected = selectedEleve?.id === el.id;
                        return (
                          <tr
                            key={el.id}
                            onClick={() => setSelectedEleve(el)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-emerald-50/90 border-l-4 border-emerald-600'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-3">
                                <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                                <div>
                                  <div className="font-bold text-slate-900 leading-tight">
                                    {el.prenom} {el.nom}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    {el.matricule} • {el.sexe === 'M' ? 'Garçon' : 'Fille'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4.5 px-6">
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                {el.classe}
                              </span>
                            </td>

                            <td className="py-4.5 px-6">
                              <div>
                                <div className="font-semibold text-slate-800">{el.nom_tuteur}</div>
                                <div className="text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                  <Phone className="h-3 w-3 text-emerald-600" />
                                  <span>{el.telephone_tuteur}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-bold">
                              {el.nb_absences > 0 ? (
                                <span className="text-amber-600 font-bold">{el.nb_absences} j</span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center font-mono">
                              {el.nb_retards > 0 ? (
                                <span className="text-blue-600 font-bold">{el.nb_retards}</span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                              {el.moyenne_generale} / 20
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side Detail Panel */}
        {selectedEleve && (
          <div className="xl:col-span-4 animate-stagger-rise">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <StudentInitials nom={selectedEleve.nom} prenom={selectedEleve.prenom} size="lg" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedEleve.prenom} {selectedEleve.nom}
                    </h3>
                    <p className="text-xs text-emerald-700 font-mono font-semibold">
                      Matricule: {selectedEleve.matricule}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Classe : {selectedEleve.classe} • Né le {selectedEleve.date_naissance}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEleve(null)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tuteur & Contact Urgence */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Contact Responsable / Urgence
                </span>
                <div className="font-semibold text-slate-900">{selectedEleve.nom_tuteur}</div>
                <div className="text-slate-700 font-mono flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{selectedEleve.telephone_tuteur}</span>
                </div>
                <div className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedEleve.adresse_tuteur}</span>
                </div>
              </div>

              {/* Pedagogical Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block uppercase">
                    Moyenne Actuelle
                  </span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700">
                    {selectedEleve.moyenne_generale} / 20
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block uppercase">
                    Total Absences
                  </span>
                  <span className="text-xl font-extrabold font-mono text-amber-600">
                    {selectedEleve.nb_absences} j
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-slate-400 text-[11px] italic">
                Dossier pédagogique sécurisé. Aucune donnée financière n'est accessible aux enseignants.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
