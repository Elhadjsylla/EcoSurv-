import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTeacherData, TeacherStudent } from '../../hooks/useTeacherData';
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
  CheckCheck,
  FileCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
} from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'retard';

interface StudentAttendanceState {
  status: AttendanceStatus;
  motif?: string;
  justifiee?: boolean;
}

interface RealAbsenceRecord {
  id: string;
  eleve_id: string;
  date_absence: string;
  type: 'absence' | 'retard';
  justifiee: boolean;
  motif?: string | null;
  saisie_par?: string | null;
  created_at: string;
  // Données enrichies côté client
  eleve_nom: string;
  eleve_prenom: string;
  classe: string;
}

export const TeacherAbsencesPage: React.FC = () => {
  const authProfile = useAuthStore((s) => s.profile);
  const { classes: teacherClasses, eleves: allTeacherStudents, isLoading: isTeacherDataLoading } = useTeacherData();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedClasse, setSelectedClasse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [absencesHistory, setAbsencesHistory] = useState<RealAbsenceRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // État local de la feuille d'émargement pour la classe sélectionnée
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceState>>({});

  // Pagination pour la table d'appel
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Initialiser la première classe affectée
  useEffect(() => {
    if (teacherClasses.length > 0 && (!selectedClasse || !teacherClasses.includes(selectedClasse))) {
      setSelectedClasse(teacherClasses[0]);
      setCurrentPage(1);
    }
  }, [teacherClasses, selectedClasse]);

  // Élèves de la classe choisie
  const classStudents = useMemo(() => {
    if (!selectedClasse) return [];
    return allTeacherStudents.filter((e) => e.classe === selectedClasse);
  }, [allTeacherStudents, selectedClasse]);

  // Réinitialiser la feuille d'appel quand la classe change
  useEffect(() => {
    setAttendanceMap({});
    setCurrentPage(1);
  }, [selectedClasse]);

  // Charger l'historique réel des absences
  const fetchAbsencesHistory = useCallback(async () => {
    if (!authProfile?.ecole_id || allTeacherStudents.length === 0) {
      setAbsencesHistory([]);
      return;
    }

    const eleveIds = allTeacherStudents.map((e) => e.id);
    setIsLoadingHistory(true);

    try {
      const { data, error } = await supabase
        .from('absences')
        .select('id, eleve_id, date_absence, type, justifiee, motif, saisie_par, created_at')
        .eq('ecole_id', authProfile.ecole_id)
        .in('eleve_id', eleveIds)
        .order('date_absence', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[TeacherAbsencesPage] Erreur lecture absences:', error);
        return;
      }

      // Map avec les élèves connus en mémoire
      const studentMap = new Map<string, TeacherStudent>();
      allTeacherStudents.forEach((st) => studentMap.set(st.id, st));

      const enriched: RealAbsenceRecord[] = (data || []).map((row) => {
        const student = studentMap.get(row.eleve_id);
        return {
          ...row,
          eleve_nom: student?.nom || 'Inconnu',
          eleve_prenom: student?.prenom || '',
          classe: student?.classe || '',
        };
      });

      setAbsencesHistory(enriched);
    } catch (err) {
      console.error('[TeacherAbsencesPage] Erreur inattendue chargement absences:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [authProfile?.ecole_id, allTeacherStudents]);

  useEffect(() => {
    fetchAbsencesHistory();
  }, [fetchAbsencesHistory]);

  const totalPages = Math.ceil(classStudents.length / itemsPerPage) || 1;
  const paginatedStudents = classStudents.slice(
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
        justifiee: status === 'present' ? false : prev[eleveId]?.justifiee || false,
        motif: status === 'present' ? '' : prev[eleveId]?.motif || '',
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
    classStudents.forEach((el) => {
      nextMap[el.id] = { status: 'present', motif: '', justifiee: false };
    });
    setAttendanceMap(nextMap);
    setActiveToast({
      message: `Tous les élèves de ${selectedClasse} sont marqués présents.`,
      type: 'info',
    });
  };

  const handleSaveAttendance = async () => {
    if (!authProfile?.id || !authProfile.ecole_id) {
      setActiveToast({ message: 'Session invalide. Veuillez vous reconnecter.', type: 'error' });
      return;
    }

    const ecoleId = authProfile.ecole_id;
    const userId = authProfile.id;

    if (!selectedClasse || classStudents.length === 0) {
      setActiveToast({ message: 'Aucun élève dans la classe sélectionnée.', type: 'warning' });
      return;
    }

    // Isoler les signalements à persister (absences ou retards uniquement)
    const recordsToUpsert: {
      ecole_id: string;
      eleve_id: string;
      date_absence: string;
      type: 'absence' | 'retard';
      justifiee: boolean;
      motif: string | null;
      saisie_par: string;
    }[] = [];

    classStudents.forEach((el) => {
      const state = attendanceMap[el.id];
      const status = state?.status || 'present';
      if (status === 'absent' || status === 'retard') {
        recordsToUpsert.push({
          ecole_id: ecoleId,
          eleve_id: el.id,
          date_absence: selectedDate,
          type: status === 'absent' ? 'absence' : 'retard',
          justifiee: Boolean(state?.justifiee),
          motif: state?.motif?.trim() || null,
          saisie_par: userId,
        });
      }
    });

    setIsSubmitting(true);

    try {
      if (recordsToUpsert.length === 0) {
        // Tous présents : pas d'enregistrement nécessaire dans la table absences
        setActiveToast({
          message: `Feuille d'émargement validée pour le ${selectedDate} : aucun élève absent ou en retard.`,
          type: 'success',
        });
        setIsSubmitting(false);
        return;
      }

      // Enregistrement réel dans public.absences
      const { error } = await supabase
        .from('absences')
        .upsert(recordsToUpsert, { onConflict: 'eleve_id,date_absence,type' });

      if (error) {
        console.error('[TeacherAbsencesPage] Erreur enregistrement absences:', error);
        setActiveToast({
          message: `Échec d'enregistrement : ${error.message}`,
          type: 'error',
        });
        return;
      }

      setActiveToast({
        message: `Appel de ${selectedClasse} enregistré avec succès (${recordsToUpsert.length} signalement(s)).`,
        type: 'success',
      });

      // Rafraîchir l'historique
      await fetchAbsencesHistory();
    } catch (err: any) {
      console.error('[TeacherAbsencesPage] Erreur inattendue:', err);
      setActiveToast({
        message: `Erreur inattendue : ${err?.message || 'Impossible d\'enregistrer l\'appel'}`,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const countPresents = classStudents.filter((e) => getStatus(e.id) === 'present').length;
  const countAbsents = classStudents.filter((e) => getStatus(e.id) === 'absent').length;
  const countRetards = classStudents.filter((e) => getStatus(e.id) === 'retard').length;
  const attendanceRate = classStudents.length > 0 ? Math.round((countPresents / classStudents.length) * 100) : 100;

  if (isTeacherDataLoading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-pulse">
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

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

      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Saisie des Absences & Retards
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Enregistrement Réel
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Faites l'appel de vos élèves. Les absences et retards sont directement enregistrés dans le registre de l'école.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting || classStudents.length === 0}
            className="gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            onClick={handleMarkAllPresent}
          >
            <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Tous Présents
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={isSubmitting || classStudents.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            onClick={handleSaveAttendance}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            {isSubmitting ? 'Enregistrement...' : "Enregistrer l'Appel"}
          </Button>
        </div>
      </div>

      {/* État si aucune classe affectée */}
      {teacherClasses.length === 0 ? (
        <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <GraduationCap className="h-12 w-12 mx-auto text-emerald-500/70" />
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-base">
            Aucune classe ne vous est affectée pour le moment.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Dès que la direction de votre école vous attribuera des classes, vous pourrez faire l'appel ici.
          </p>
        </div>
      ) : (
        <>
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard
              title="Élèves Présents"
              amount={countPresents}
              unit="count"
              subtitle={`Sur ${classStudents.length} élèves`}
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
              subtitle="Signalés en retard"
              icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              variant="warning"
            />

            <KpiCard
              title="Taux de Présence"
              customValue={`${attendanceRate}%`}
              progress={attendanceRate}
              subtitle="Calculé sur la classe"
              icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              variant="primary"
            />
          </div>

          {/* Session Controls: Class & Date (retrait des créneaux) */}
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
                  options={teacherClasses.map((cls) => ({ value: cls, label: cls }))}
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
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Appel du jour : <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClasse}</span> • Date : <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDate}</span>
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
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        Aucun élève trouvé dans la classe {selectedClasse}.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((el) => {
                      const status = getStatus(el.id);
                      const details = attendanceMap[el.id];

                      return (
                        <tr
                          key={el.id}
                          className={`transition-colors ${
                            status === 'absent'
                              ? 'bg-rose-50/40 dark:bg-rose-950/20'
                              : status === 'retard'
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Student Info */}
                          <td className="py-4.5 px-6 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                                  {el.prenom} {el.nom}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                                  #{el.matricule}
                                  {el.genre ? ` • ${el.genre === 'M' ? 'Garçon' : el.genre === 'F' ? 'Fille' : el.genre}` : ''}
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
                                  placeholder={status === 'retard' ? 'Motif du retard...' : "Motif de l'absence..."}
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
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {classStudents.length > 0 && (
              <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Affichage de{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  à{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {Math.min(currentPage * itemsPerPage, classStudents.length)}
                  </span>{' '}
                  sur{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {classStudents.length}
                  </span>{' '}
                  élèves
                </div>

                {totalPages > 1 && (
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
                )}
              </div>
            )}
          </div>

          {/* Historique Récent des Absences Enregistrées */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Derniers Signalements d'Absences Enregistrés en Base
              </h3>
              {isLoadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>

            {absencesHistory.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
                Aucune absence ou retard enregistré pour vos classes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {absencesHistory.slice(0, 4).map((abs) => (
                  <div
                    key={abs.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
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
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-between font-mono">
                      <span>{abs.classe}</span>
                      <span>{abs.date_absence}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] truncate">
                      {abs.motif || (abs.justifiee ? 'Justifiée' : 'Aucun motif')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
