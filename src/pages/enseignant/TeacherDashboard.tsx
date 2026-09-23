import React, { useMemo } from 'react';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  MOCK_ABSENCES_INITIAL,
  MOCK_EVALUATIONS_INITIAL,
} from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { useAuthStore } from '../../store/useAuthStore';
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
  const authProfile = useAuthStore((s) => s.profile);
  const isRealAccount = Boolean(authProfile?.ecole_id);

  const teacherName = authProfile
    ? `${authProfile.prenom} ${authProfile.nom}`
    : `${CURRENT_ENSEIGNANT.prenom} ${CURRENT_ENSEIGNANT.nom}`;

  const teacherStudents = useMemo(() => {
    if (isRealAccount) return [];
    return getElevesForTeacher(MOCK_ELEVES, CURRENT_ENSEIGNANT.classes_assignees);
  }, [isRealAccount]);

  const totalEleves = teacherStudents.length;
  const unverifiedAbsences = isRealAccount ? 0 : MOCK_ABSENCES_INITIAL.filter((a) => !a.justifiee).length;

  const averageGrade = useMemo(() => {
    if (isRealAccount) return 0;
    const allNotes: number[] = [];
    MOCK_EVALUATIONS_INITIAL.forEach((ev) => {
      Object.values(ev.notes).forEach((n) => {
        if (n !== null && n !== undefined) allNotes.push(n);
      });
    });
    if (allNotes.length === 0) return 0;
    const sum = allNotes.reduce((a, b) => a + b, 0);
    return Math.round((sum / allNotes.length) * 10) / 10;
  }, [isRealAccount]);

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Espace Pédagogique
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Année 2025–2026 • Trimestre 2
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bonjour, {teacherName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Classes assignées :{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isRealAccount ? 'Aucune classe pour le moment' : CURRENT_ENSEIGNANT.classes_assignees.join(', ')}
            </span>{' '}
            • Matières : {isRealAccount ? 'Aucune matière assignée' : CURRENT_ENSEIGNANT.matieres.join(', ')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
          >
            <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            Saisir une Note
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-xs"
            onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
          >
            <CalendarCheck className="h-4 w-4" />
            Faire l'Appel du Jour
          </Button>
        </div>
      </div>

      {/* Pedagogical KPIs (Nexoov Pastel Cards with Emerald Accent) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Élèves Assignés"
          amount={totalEleves}
          unit="count"
          subtitle={isRealAccount ? '0 classe' : 'Répartis sur 2 classes'}
          icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_classes')}
        />

        <KpiCard
          title="Assiduité Globale"
          customValue={isRealAccount ? '- %' : '93.8%'}
          progress={isRealAccount ? 0 : 93.8}
          subtitle={isRealAccount ? "Aucune donnée d'assiduité" : 'Taux de présence hebdomadaire'}
          icon={<CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
        />

        <KpiCard
          title="Absences à Justifier"
          amount={unverifiedAbsences}
          unit="count"
          subtitle={isRealAccount ? 'Aucune absence en attente' : 'Motifs en attente de tuteur'}
          icon={<AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
        />

        <KpiCard
          title="Moyenne des Devoirs"
          customValue={isRealAccount ? '- / 20' : `${averageGrade} / 20`}
          subtitle={isRealAccount ? '0 évaluation enregistrée' : 'Sur 4 évaluations récentes'}
          icon={<BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          variant="default"
          onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
        />
      </div>

      {/* Schedule & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule for Today */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Séances & Emploi du Temps du Jour
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Mercredi 9 Septembre 2026
            </span>
          </div>

          <div className="space-y-3">
            {isRealAccount ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
                <Clock className="h-8 w-8 mx-auto text-emerald-500/70 mb-1" />
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Aucune séance programmée pour aujourd'hui
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Votre emploi du temps pédagogique s'affichera automatiquement dès sa configuration par la direction de votre école.
                </p>
              </div>
            ) : (
              <>
                {/* Session 1 */}
                <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center font-mono pr-4 border-r border-emerald-200 dark:border-emerald-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">08:00</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">10:00</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Mathématiques</span>
                        <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-2xs">
                          En cours
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Classe : <strong className="text-slate-800 dark:text-slate-200">6ème A</strong> • Salle 104 (Bâtiment Principal)
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    onClick={() => onNavigateToTab && onNavigateToTab('teacher_absences')}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Émarger
                  </Button>
                </div>

                {/* Session 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center font-mono pr-4 border-r border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">10:15</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">12:00</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Sciences de la Vie et de la Terre
                        </span>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 border border-slate-200 dark:border-slate-700">
                          À venir
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Classe : <strong className="text-slate-800 dark:text-slate-200">CM2 A</strong> • Laboratoire SVT
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Dans 2 heures</span>
                </div>

                {/* Session 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center font-mono pr-4 border-r border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">15:00</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">17:00</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Mathématiques</span>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 border border-slate-200 dark:border-slate-700">
                          Après-midi
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Classe : <strong className="text-slate-800 dark:text-slate-200">CM2 A</strong> • Salle 201
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Session de révision</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Col: Recent Evaluations & Quick Notices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Dernières Évaluations
            </h2>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('teacher_grades')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-3">
            {isRealAccount ? (
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
                <BookmarkCheck className="h-6 w-6 mx-auto text-emerald-500/70 mb-1" />
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Aucune évaluation enregistrée
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Utilisez le bouton "Saisir une Note" ci-dessus pour publier vos premières évaluations.
                </p>
              </div>
            ) : (
              MOCK_EVALUATIONS_INITIAL.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {ev.classe} • {ev.matiere}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{ev.date}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.titre}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Coeff. {ev.coefficient} • Barème /{ev.bareme}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {Object.keys(ev.notes).length} notes saisies
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
