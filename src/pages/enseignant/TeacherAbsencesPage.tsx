import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  MOCK_ABSENCES_INITIAL,
  AbsenceRecord,
} from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { KpiCard } from '../../components/ui/KpiCard';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'retard';

interface StudentAttendanceState {
  status: AttendanceStatus;
  motif?: string;
  justifiee?: boolean;
}

export const TeacherAbsencesPage: React.FC = () => {
  const [selectedClasse, setSelectedClasse] = useState<string>('6ème A');
  const [selectedDate, setSelectedDate] = useState<string>('2026-03-09');
  const [selectedCreneau, setSelectedCreneau] = useState<'matin' | 'apres_midi'>('matin');
  const [absencesHistory, setAbsencesHistory] = useState<AbsenceRecord[]>(MOCK_ABSENCES_INITIAL);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Pagination pour la table d'appel
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // État local de la feuille d'émargement
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceState>>({});

  const teacherStudents = useMemo(() => {
    return getElevesForTeacher(MOCK_ELEVES, CURRENT_ENSEIGNANT.classes_assignees).filter(
      (e) => e.classe === selectedClasse
    );
  }, [selectedClasse]);

  const totalPages = Math.ceil(teacherStudents.length / itemsPerPage) || 1;
  const paginatedStudents = teacherStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatus = (eleveId: string): AttendanceStatus => {
    return attendanceMap[eleveId]?.status || 'present';
  };

  const setStatus = (eleveId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [eleveId]: {
        ...prev[eleveId],
        status,
        justifiee: status === 'present' ? undefined : prev[eleveId]?.justifiee || false,
        motif: status === 'present' ? undefined : prev[eleveId]?.motif || '',
      },
    }));
  };

  const updateDetails = (eleveId: string, motif: string, justifiee: boolean) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [eleveId]: {
        ...prev[eleveId],
        status: prev[eleveId]?.status || 'absent',
        motif,
        justifiee,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const nextMap: Record<string, StudentAttendanceState> = {};
    teacherStudents.forEach((el) => {
      nextMap[el.id] = { status: 'present' };
    });
    setAttendanceMap(nextMap);
    setActiveToast({
      message: `Tous les élèves de ${selectedClasse} sont marqués présents.`,
      type: 'info',
    });
  };

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.75 },
        colors: ['#10b981', '#3b82f6', '#059669'],
        disableForReducedMotion: true,
        ticks: 120,
        scalar: 0.85,
      });
    } catch {
      // Ignorer
    }
  };

  const handleSaveAttendance = () => {
    const newRecords: AbsenceRecord[] = [];
    teacherStudents.forEach((el) => {
      const state = attendanceMap[el.id];
      if (state && (state.status === 'absent' || state.status === 'retard')) {
        newRecords.push({
          id: `abs-${Date.now()}-${el.id}`,
          eleve_id: el.id,
          eleve_nom: el.nom,
          eleve_prenom: el.prenom,
          classe: selectedClasse,
          date_absence: selectedDate,
          creneau: selectedCreneau,
          type: state.status === 'retard' ? 'retard' : 'absence',
          justifiee: !!state.justifiee,
          motif: state.motif || (state.status === 'retard' ? 'Arrivée tardive' : 'Non renseigné'),
        });
      }
    });

    setAbsencesHistory((prev) => [...newRecords, ...prev]);
    triggerConfettiCelebration();
    setActiveToast({
      message: `Feuille d'appel de ${selectedClasse} (${selectedCreneau}) enregistrée avec succès !`,
      type: 'success',
    });
  };

  const countPresents = teacherStudents.filter((e) => getStatus(e.id) === 'present').length;
  const countAbsents = teacherStudents.filter((e) => getStatus(e.id) === 'absent').length;
  const countRetards = teacherStudents.filter((e) => getStatus(e.id) === 'retard').length;
  const attendanceRate = teacherStudents.length > 0 ? Math.round((countPresents / teacherStudents.length) * 100) : 100;

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

      {/* Top Banner & Fast Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Saisie Rapide des Absences & Retards
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Émargement Express
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Faites l'appel de vos cours en un coup d'œil. Les données sont automatiquement rattachées au dossier élève.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={handleMarkAllPresent}
          >
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Tous Présents (1 clic)
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            onClick={handleSaveAttendance}
          >
            <FileCheck className="h-4 w-4" />
            Enregistrer l'Appel
          </Button>
        </div>
      </div>

      {/* 4 Pastel Stat Cards (Nexoov Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Élèves Présents"
          amount={countPresents}
          unit="count"
          subtitle={`Sur ${teacherStudents.length} convoqués`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />

        <KpiCard
          title="Élèves Absents"
          amount={countAbsents}
          unit="count"
          subtitle="Signalés non-présents"
          icon={<XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />

        <KpiCard
          title="Arrivées Tardives"
          amount={countRetards}
          unit="count"
          subtitle="Enregistrés en retard"
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />

        <KpiCard
          title="Taux de Présence"
          customValue={`${attendanceRate}%`}
          progress={attendanceRate}
          subtitle="Taux calculé en direct"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />
      </div>

      {/* Session Controls: Class, Date & Session Slot */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
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
              options={CURRENT_ENSEIGNANT.classes_assignees.map((cls) => ({
                value: cls,
                label: cls,
              }))}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />

            {/* Date */}
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />

            {/* Créneau Horaire */}
            <Select<'matin' | 'apres_midi'>
              value={selectedCreneau}
              onChange={setSelectedCreneau}
              icon={<Clock className="h-3.5 w-3.5" />}
              options={[
                { value: 'matin', label: 'Matin (08h - 12h)' },
                { value: 'apres_midi', label: 'Après-midi (14h - 18h)' },
              ]}
              size="sm"
              triggerClassName="h-10 rounded-xl text-xs font-bold"
            />
          </div>

          {/* Session details */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Session : <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClasse}</span> • {selectedCreneau === 'matin' ? '08h00 - 12h00' : '14h00 - 18h00'}
          </div>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6">Élève</th>
                <th className="py-4 px-6 text-center w-80">État de Présence (1 clic)</th>
                <th className="py-4 px-6">Motif & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.map((el) => {
                const status = getStatus(el.id);
                const details = attendanceMap[el.id];

                return (
                  <tr
                    key={el.id}
                    className={`transition-colors ${
                      status === 'absent'
                        ? 'bg-red-50/40 dark:bg-red-950/20'
                        : status === 'retard'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Student Info: 2 lines */}
                    <td className="py-4.5 px-6 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                            {el.prenom} {el.nom}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                            #{el.matricule} • {el.sexe === 'M' ? 'Garçon' : 'Fille'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Attendance Toggles (Présent / Absent / Retard) */}
                    <td className="py-4.5 px-6 text-center">
                      <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                        <button
                          type="button"
                          onClick={() => setStatus(el.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Présent
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(el.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(el.id, 'retard')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'retard'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Retard
                        </button>
                      </div>
                    </td>

                    {/* Motif & Justification Inline */}
                    <td className="py-4.5 px-6">
                      {status !== 'present' ? (
                        <div className="flex items-center gap-3 animate-scale-in">
                          <input
                            type="text"
                            placeholder={status === 'retard' ? 'Ex: 15 min de retard' : 'Motif de l\'absence...'}
                            value={details?.motif || ''}
                            onChange={(e) =>
                              updateDetails(el.id, e.target.value, details?.justifiee || false)
                            }
                            className="flex-1 max-w-sm h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium select-none">
                            <input
                              type="checkbox"
                              checked={details?.justifiee || false}
                              onChange={(e) =>
                                updateDetails(el.id, details?.motif || '', e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Justifiée</span>
                          </label>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          En classe • Aucune observation requise
                        </span>
                      )}
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

      {/* Historique Récent des Absences */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Derniers Signalements d'Absences Enregistrés
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {absencesHistory.slice(0, 4).map((abs) => (
            <div
              key={abs.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {abs.eleve_prenom} {abs.eleve_nom}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    abs.type === 'retard'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {abs.type === 'retard' ? 'Retard' : 'Absent'}
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between font-mono">
                <span>{abs.classe}</span>
                <span>{abs.date_absence}</span>
              </div>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                {abs.motif || 'Aucun motif renseigné'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
