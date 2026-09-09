import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CURRENT_ENSEIGNANT,
  MOCK_ELEVES,
  getElevesForTeacher,
  MOCK_ABSENCES_INITIAL,
  AbsenceRecord,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileCheck,
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

  // État local de la feuille d'émargement de la session en cours
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceState>>({});

  const teacherStudents = useMemo(() => {
    return getElevesForTeacher(MOCK_ELEVES, CURRENT_ENSEIGNANT.classes_assignees).filter(
      (e) => e.classe === selectedClasse
    );
  }, [selectedClasse]);

  // Récupérer ou initialiser le statut de présence d'un élève
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

  // Action express : Marquer tous les élèves comme présents en 1 clic
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

  // Célébration discrète par confetti
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

  // Validation et enregistrement de l'appel
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Saisie Rapide des Absences & Retards
            </h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              Émargement Express
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
            Faites l'appel de vos cours en un coup d'œil. Les données sont automatiquement rattachées au dossier élève.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={handleMarkAllPresent}
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Tous Présents (1 clic)
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
            onClick={handleSaveAttendance}
          >
            <FileCheck className="h-4 w-4" />
            Enregistrer l'Appel
          </Button>
        </div>
      </div>

      {/* Session Controls: Class, Date & Session Slot */}
      <Card className="p-6 rounded-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Classe */}
            <Select
              value={selectedClasse}
              onChange={setSelectedClasse}
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

          {/* Counters Pills */}
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Présents : {countPresents}
            </span>
            <span className="rounded-full bg-red-50 text-red-700 px-3 py-1.5 border border-red-200 flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              Absents : {countAbsents}
            </span>
            <span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-200 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Retards : {countRetards}
            </span>
          </div>
        </div>
      </Card>

      {/* Roster Attendance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Élève & Matricule</th>
                <th className="py-4 px-6 text-center w-80">État de Présence (1 clic)</th>
                <th className="py-4 px-6">Motif & Justification (si absent)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherStudents.map((el) => {
                const status = getStatus(el.id);
                const details = attendanceMap[el.id];

                return (
                  <tr
                    key={el.id}
                    className={`transition-colors ${
                      status === 'absent'
                        ? 'bg-red-50/40'
                        : status === 'retard'
                        ? 'bg-amber-50/40'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Student Info */}
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-tight">
                            {el.prenom} {el.nom}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {el.matricule} • {el.sexe === 'M' ? 'Garçon' : 'Fille'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Attendance Toggles (Présent / Absent / Retard) */}
                    <td className="py-4.5 px-6 text-center">
                      <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                        <button
                          type="button"
                          onClick={() => setStatus(el.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
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
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
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
                              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
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
                            className="flex-1 max-w-sm h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium select-none">
                            <input
                              type="checkbox"
                              checked={details?.justifiee || false}
                              onChange={(e) =>
                                updateDetails(el.id, details?.motif || '', e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Justifiée</span>
                          </label>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
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
      </div>

      {/* Historique Récent des Absences */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-emerald-600" />
          Derniers Signalements d'Absences Enregistrés
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {absencesHistory.slice(0, 4).map((abs) => (
            <div
              key={abs.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {abs.eleve_prenom} {abs.eleve_nom}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    abs.type === 'retard'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {abs.type === 'retard' ? 'Retard' : 'Absent'}
                </span>
              </div>
              <div className="text-slate-500 text-[11px] flex items-center justify-between font-mono">
                <span>{abs.classe}</span>
                <span>{abs.date_absence}</span>
              </div>
              <div className="pt-1 text-slate-600 text-[11px]">
                {abs.motif || 'Aucun motif renseigné'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
