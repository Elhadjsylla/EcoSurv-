import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  MOCK_EVALUATIONS_INITIAL,
  EvaluationRecord,
} from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { KpiCard } from '../../components/ui/KpiCard';
import {
  PlusCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const TeacherGradesPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(MOCK_EVALUATIONS_INITIAL);
  const [selectedClasse, setSelectedClasse] = useState<string>('6ème A');
  const [selectedMatiere, setSelectedMatiere] = useState<string>('Mathématiques');
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>('Trimestre 2');
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Pagination pour la table de saisie
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal Nouvelle Évaluation
  const [isNewEvalModalOpen, setIsNewEvalModalOpen] = useState(false);
  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalCoeff, setNewEvalCoeff] = useState(2);
  const [newEvalDate, setNewEvalDate] = useState('2026-03-09');

  // Élèves de la classe choisie
  const teacherStudents = useMemo(() => {
    return getElevesForTeacher(MOCK_ELEVES, CURRENT_ENSEIGNANT.classes_assignees).filter(
      (e) => e.classe === selectedClasse
    );
  }, [selectedClasse]);

  // Évaluations filtrées pour la classe et matière
  const classEvals = useMemo(() => {
    return evaluations.filter(
      (ev) => ev.classe === selectedClasse && ev.matiere === selectedMatiere
    );
  }, [evaluations, selectedClasse, selectedMatiere]);

  // Évaluation active sélectionnée pour la saisie
  const [selectedEvalId, setSelectedEvalId] = useState<string>(classEvals[0]?.id || '');

  React.useEffect(() => {
    if (classEvals.length > 0 && !classEvals.some((ev) => ev.id === selectedEvalId)) {
      setSelectedEvalId(classEvals[0].id);
    }
  }, [classEvals, selectedEvalId]);

  const currentEval = useMemo(() => {
    return classEvals.find((ev) => ev.id === selectedEvalId) || classEvals[0] || null;
  }, [classEvals, selectedEvalId]);

  // Notes en cours d'édition pour currentEval
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (currentEval) {
      const initialNotes: Record<string, string> = {};
      teacherStudents.forEach((el) => {
        const val = currentEval.notes[el.id];
        initialNotes[el.id] = val !== undefined && val !== null ? String(val) : '';
      });
      setNotesState(initialNotes);
    }
  }, [currentEval, teacherStudents]);

  const handleNoteChange = (eleveId: string, val: string) => {
    const num = parseFloat(val);
    if (val === '' || (!isNaN(num) && num >= 0 && num <= 20)) {
      setNotesState((prev) => ({ ...prev, [eleveId]: val }));
    }
  };

  const totalPages = Math.ceil(teacherStudents.length / itemsPerPage) || 1;
  const paginatedStudents = teacherStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistiques en temps réel de l'évaluation en cours
  const stats = useMemo(() => {
    const validNotes: number[] = [];
    Object.values(notesState).forEach((v) => {
      const parsed = parseFloat(v);
      if (!isNaN(parsed)) validNotes.push(parsed);
    });

    if (validNotes.length === 0) {
      return { moyenne: '--', min: '--', max: '--', tauxReussite: 0, count: 0 };
    }

    const sum = validNotes.reduce((a, b) => a + b, 0);
    const moyenne = Math.round((sum / validNotes.length) * 10) / 10;
    const min = Math.min(...validNotes);
    const max = Math.max(...validNotes);
    const reussis = validNotes.filter((n) => n >= 10).length;
    const tauxReussite = Math.round((reussis / validNotes.length) * 100);

    return { moyenne, min, max, tauxReussite, count: validNotes.length };
  }, [notesState]);

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.75 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
        disableForReducedMotion: true,
        ticks: 120,
        scalar: 0.85,
      });
    } catch {
      // Ignorer
    }
  };

  const handleSaveGrades = () => {
    if (!currentEval) return;

    const parsedNotes: Record<string, number | null> = {};
    Object.entries(notesState).forEach(([id, val]) => {
      const parsed = parseFloat(val);
      parsedNotes[id] = !isNaN(parsed) ? parsed : null;
    });

    setEvaluations((prev) =>
      prev.map((ev) => {
        if (ev.id === currentEval.id) {
          return { ...ev, notes: parsedNotes };
        }
        return ev;
      })
    );

    triggerConfettiCelebration();
    setActiveToast({
      message: `Notes enregistrées pour "${currentEval.titre}" (${selectedClasse}).`,
      type: 'success',
    });
  };

  const handleCreateEvaluation = () => {
    if (!newEvalTitle.trim()) {
      setActiveToast({ message: 'Veuillez saisir un titre pour le devoir.', type: 'warning' });
      return;
    }

    const newEval: EvaluationRecord = {
      id: `eval-${Date.now()}`,
      classe: selectedClasse,
      matiere: selectedMatiere,
      titre: newEvalTitle.trim(),
      date: newEvalDate,
      trimestre: selectedTrimestre as any,
      coefficient: newEvalCoeff,
      bareme: 20,
      notes: {},
    };

    setEvaluations((prev) => [newEval, ...prev]);
    setSelectedEvalId(newEval.id);
    setIsNewEvalModalOpen(false);
    setNewEvalTitle('');
    setActiveToast({
      message: `Nouvelle évaluation "${newEval.titre}" créée pour ${selectedClasse}.`,
      type: 'success',
    });
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {/* Toast Notification */}
      {activeToast && (
        <ToastNotification
          message={activeToast.message}
          type={activeToast.type}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Carnet de Notes & Évaluations
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Barème /20
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Saisie fluide des devoirs, contrôles continus et calcul automatique des moyennes de classe.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={() => setIsNewEvalModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            + Nouvelle Évaluation
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            onClick={handleSaveGrades}
          >
            <Save className="h-4 w-4" />
            Enregistrer les Notes
          </Button>
        </div>
      </div>

      {/* 4 Pastel Stat Cards (Nexoov Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Moyenne de la Classe"
          customValue={`${stats.moyenne} ${stats.moyenne !== '--' ? '/ 20' : ''}`}
          subtitle={`${stats.count} notes saisies`}
          icon={<GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />

        <KpiCard
          title="Note la Plus Haute"
          customValue={`${stats.max} ${stats.max !== '--' ? '/ 20' : ''}`}
          subtitle="Meilleure performance"
          icon={<Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />

        <KpiCard
          title="Note la Plus Basse"
          customValue={`${stats.min} ${stats.min !== '--' ? '/ 20' : ''}`}
          subtitle="Seuil d'alerte pédagogique"
          icon={<AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />

        <KpiCard
          title="Taux de Réussite"
          customValue={`${stats.tauxReussite}%`}
          progress={stats.tauxReussite}
          subtitle="Notes supérieures ou égales à 10"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
      </div>

      {/* Filter & Subject Selection Bar */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Classe */}
            <Select
              value={selectedClasse}
              onChange={(v) => {
                setSelectedClasse(v);
                setCurrentPage(1);
              }}
              prefix="Classe :"
              options={CURRENT_ENSEIGNANT.classes_assignees.map((c) => ({
                value: c,
                label: c,
              }))}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />

            {/* Matière */}
            <Select
              value={selectedMatiere}
              onChange={setSelectedMatiere}
              prefix="Matière :"
              options={CURRENT_ENSEIGNANT.matieres.map((m) => ({
                value: m,
                label: m,
              }))}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />

            {/* Trimestre */}
            <Select
              value={selectedTrimestre}
              onChange={setSelectedTrimestre}
              prefix="Période :"
              options={[
                { value: 'Trimestre 1', label: 'Trimestre 1' },
                { value: 'Trimestre 2', label: 'Trimestre 2' },
                { value: 'Trimestre 3', label: 'Trimestre 3' },
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />
          </div>

          {/* Évaluation Selector Tabs */}
          {classEvals.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-xl">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 shrink-0">
                Évaluation :
              </span>
              {classEvals.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvalId(ev.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    selectedEvalId === ev.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {ev.titre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grade Entry Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            {currentEval ? currentEval.titre : 'Aucune évaluation sélectionnée'} — Classe : {selectedClasse}
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Saisissez les notes (touche Tab pour passer à l'élève suivant)
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6 w-12 text-center">N°</th>
                <th className="py-4 px-6">Élève</th>
                <th className="py-4 px-6">Classe</th>
                <th className="py-4 px-6 text-center w-40">Note (/20)</th>
                <th className="py-4 px-6 text-center">Statut</th>
                <th className="py-4 px-6">Appréciation Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.map((el, index) => {
                const noteStr = notesState[el.id] ?? '';
                const noteVal = parseFloat(noteStr);
                const isRated = !isNaN(noteVal);
                const isPassing = isRated && noteVal >= 10;
                const studentNumber = (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <tr key={el.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4.5 px-6 text-center text-slate-400 dark:text-slate-500 font-mono">
                      {studentNumber}
                    </td>

                    {/* 2-line student display */}
                    <td className="py-4.5 px-6 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                            {el.prenom} {el.nom}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                            #{el.matricule}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {el.classe}
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="-- / 20"
                          value={noteStr}
                          onChange={(e) => handleNoteChange(el.id, e.target.value)}
                          className={`w-24 h-10 text-center font-mono font-extrabold text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                            !isRated
                              ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-emerald-600'
                              : isPassing
                              ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 focus:ring-emerald-600'
                              : 'border-rose-400 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 focus:ring-rose-600'
                          }`}
                        />
                        <span className="text-slate-400 dark:text-slate-500 font-bold">/ 20</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      {!isRated ? (
                        <span className="text-slate-400 dark:text-slate-500 font-medium italic text-[11px]">
                          Non noté
                        </span>
                      ) : isPassing ? (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-[11px] font-bold inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Validé
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-3 py-1 text-[11px] font-bold inline-flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> À consolider
                        </span>
                      )}
                    </td>

                    <td className="py-4.5 px-6 text-slate-500 dark:text-slate-400 text-xs">
                      {isRated && noteVal >= 16
                        ? 'Excellent travail, très bonne maîtrise.'
                        : isRated && noteVal >= 12
                        ? 'Bon travail, régularité appréciée.'
                        : isRated && noteVal >= 10
                        ? 'Satisfaisant, peut progresser.'
                        : isRated
                        ? 'Difficultés identifiées, soutien recommandé.'
                        : 'En attente de notation.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Affichage de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {teacherStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            à{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, teacherStudents.length)}
            </span>{' '}
            sur{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {teacherStudents.length}
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

      {/* Modal Création Nouvelle Évaluation */}
      {isNewEvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Créer une Nouvelle Évaluation
              </h3>
              <button
                onClick={() => setIsNewEvalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Intitulé de l'Évaluation *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Devoir Surveillé N°2, Contrôle de Mathématiques..."
                  value={newEvalTitle}
                  onChange={(e) => setNewEvalTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Classe</label>
                  <input
                    type="text"
                    disabled
                    value={selectedClasse}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Matière</label>
                  <input
                    type="text"
                    disabled
                    value={selectedMatiere}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newEvalCoeff}
                    onChange={(e) => setNewEvalCoeff(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
                  <DatePicker
                    value={newEvalDate}
                    onChange={setNewEvalDate}
                    size="sm"
                    className="w-full"
                    triggerClassName="w-full h-9 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewEvalModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCreateEvaluation}
              >
                Créer l'Évaluation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
