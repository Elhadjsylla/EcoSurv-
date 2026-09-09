import React, { useMemo } from 'react';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  MOCK_ABSENCES_INITIAL,
  MOCK_EVALUATIONS_INITIAL,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users,
  CalendarCheck,
  BookOpen,
  Clock,
  AlertCircle,
  BookmarkCheck,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigateToTab?: (tab: 'teacher_classes' | 'teacher_absences' | 'teacher_grades') => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateToTab }) => {
  const teacherStudents = useMemo(() => {
    return getElevesForTeacher(MOCK_ELEVES, CURRENT_ENSEIGNANT.classes_assignees);
  }, []);

  const totalEleves = teacherStudents.length;
  const unverifiedAbsences = MOCK_ABSENCES_INITIAL.filter((a) => !a.justifiee).length;

  const averageGrade = useMemo(() => {
    const allNotes: number[] = [];
    MOCK_EVALUATIONS_INITIAL.forEach((ev) => {
      Object.values(ev.notes).forEach((n) => {
        if (n !== null && n !== undefined) allNotes.push(n);
      });
    });
    if (allNotes.length === 0) return 14.2;
    const sum = allNotes.reduce((a, b) => a + b, 0);
    return Math.round((sum / allNotes.length) * 10) / 10;
  }, []);

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              Espace Pédagogique
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Année 2025–2026 • Trimestre 2
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bonjour, {CURRENT_ENSEIGNANT.prenom} {CURRENT_ENSEIGNANT.nom} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Classes assignées :{' '}
            <span className="font-bold text-slate-800">
              {CURRENT_ENSEIGNANT.classes_assignees.join(', ')}
            </span>{' '}
            • Matières : {CURRENT_ENSEIGNANT.matieres.join(', ')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-300"
            onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
          >
            <BookOpen className="h-4 w-4 text-slate-600" />
            Saisir une Note
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
          >
            <CalendarCheck className="h-4 w-4" />
            Faire l'Appel du Jour
          </Button>
        </div>
      </div>

      {/* Pedagogical KPIs (Strictly ZERO financial metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 : Effectif Total */}
        <Card
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_classes')}
          className="p-6 rounded-2xl cursor-pointer group hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-slate-200 bg-white hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Élèves Assignés
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono mt-3">
            {totalEleves}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center justify-between">
            <span>Répartis sur 2 classes</span>
            <span className="text-[10px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              Voir classes →
            </span>
          </p>
        </Card>

        {/* KPI 2 : Taux de Présence */}
        <Card
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
          className="p-6 rounded-2xl cursor-pointer group hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-slate-200 bg-white hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assiduité Globale
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 group-hover:scale-110 transition-transform">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono mt-3">
            93.8%
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: '93.8%' }} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center justify-between">
            <span>Présents cette semaine</span>
            <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              Émargement →
            </span>
          </p>
        </Card>

        {/* KPI 3 : Absences Non Justifiées */}
        <Card
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
          className="p-6 rounded-2xl cursor-pointer group hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-slate-200 bg-white hover:border-amber-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Absences à Justifier
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 font-mono mt-3">
            {unverifiedAbsences}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center justify-between">
            <span>Motifs en attente tuteur</span>
            <span className="text-[10px] font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">
              Vérifier →
            </span>
          </p>
        </Card>

        {/* KPI 4 : Moyenne Générale */}
        <Card
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
          className="p-6 rounded-2xl cursor-pointer group hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-slate-200 bg-white hover:border-indigo-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Moyenne des Devoirs
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-indigo-700 font-mono mt-3">
            {averageGrade} <span className="text-sm font-semibold text-slate-500">/ 20</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center justify-between">
            <span>Sur 4 évaluations récentes</span>
            <span className="text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
              Carnet →
            </span>
          </p>
        </Card>
      </div>

      {/* Schedule & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule for Today */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Séances & Emploi du Temps du Jour
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              Mercredi 9 Septembre 2026
            </span>
          </div>

          <div className="space-y-3">
            {/* Session 1 */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center font-mono pr-4 border-r border-emerald-200">
                  <div className="text-xs font-bold text-slate-900">08:00</div>
                  <div className="text-[11px] text-slate-500">10:00</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Mathématiques</span>
                    <span className="rounded bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                      En cours
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Classe : <strong className="text-slate-800">6ème A</strong> • Salle 104 (Bâtiment Principal)
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Émarger
              </Button>
            </div>

            {/* Session 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-center font-mono pr-4 border-r border-slate-200">
                  <div className="text-xs font-bold text-slate-900">10:15</div>
                  <div className="text-[11px] text-slate-500">12:00</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Sciences de la Vie et de la Terre
                    </span>
                    <span className="rounded bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 border border-slate-200">
                      À venir
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Classe : <strong className="text-slate-800">CM2 A</strong> • Laboratoire SVT
                  </div>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">Dans 2 heures</span>
            </div>

            {/* Session 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-center font-mono pr-4 border-r border-slate-200">
                  <div className="text-xs font-bold text-slate-900">15:00</div>
                  <div className="text-[11px] text-slate-500">17:00</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Mathématiques</span>
                    <span className="rounded bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 border border-slate-200">
                      Après-midi
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Classe : <strong className="text-slate-800">CM2 A</strong> • Salle 201
                  </div>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">Session de révision</span>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Evaluations & Quick Notices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-blue-600" />
              Dernières Évaluations
            </h2>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_EVALUATIONS_INITIAL.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {ev.classe} • {ev.matiere}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{ev.date}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">{ev.titre}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Coeff. {ev.coefficient} • Barème /{ev.bareme}</span>
                  <span className="text-emerald-700 font-semibold">
                    {Object.keys(ev.notes).length} notes saisies
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
