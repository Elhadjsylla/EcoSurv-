import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTeacherData, TeacherStudent } from '../../hooks/useTeacherData';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { KpiCard } from '../../components/ui/KpiCard';
import { AbsenceStudentRow } from '../../components/enseignant/AbsenceStudentRow';
import { useAbsencesSaisie } from '../../hooks/useAbsencesSaisie';
import { useDeclarationsReperes } from '../../hooks/useDeclarationsAbsence';
import { entryChanged, formatSavedAt } from '../../lib/absences';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
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
  RefreshCw,
} from 'lucide-react';

interface RealAbsenceRecord {
  id: string;
  ecole_id: string;
  eleve_id: string;
  date_absence: string;
  type: 'absence' | 'retard';
  justifiee: boolean;
  motif?: string | null;
  saisie_par?: string | null;
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
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const reduceMotion = Boolean(useReducedMotion());

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

  // Feuille d'appel de la classe et de la date : l'état enregistré en base est lu à chaque changement,
  // les modifications locales ne sont écrites qu'au clic sur « Enregistrer ».
  const studentIds = useMemo(() => classStudents.map((e) => e.id), [classStudents]);
  const sheet = useAbsencesSaisie({
    ecoleId: authProfile?.ecole_id,
    userId: authProfile?.id,
    studentIds,
    date: selectedDate,
  });

  // Repères d'information (déclarations des parents couvrant la date). Une erreur de chargement
  // laisse la feuille fonctionner comme avant, sans repère ; rien n'est coché à partir de ces données.
  const reperes = useDeclarationsReperes(studentIds, selectedDate);

  // Revenir à la première page quand la classe change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClasse]);

  // Changer de classe ou de date abandonne les saisies non enregistrées : on demande confirmation.
  const confirmDiscardIfNeeded = (): boolean =>
    sheet.changedCount === 0 ||
    window.confirm('Des modifications ne sont pas enregistrées. Voulez-vous les abandonner ?');

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
        .select('id, ecole_id, eleve_id, date_absence, type, justifiee, motif, saisie_par')
        .eq('ecole_id', authProfile.ecole_id)
        .in('eleve_id', eleveIds)
        .order('date_absence', { ascending: false })
        .limit(50);

      if (error) {
        console.error(
          '[TeacherAbsencesPage] Erreur lecture absences:',
          error.code,
          error.message,
          error.details
        );
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

  const handleMarkAllPresent = () => {
    sheet.markUnsetPresent();
    setActiveToast({
      message: 'Les élèves sans état sont marqués présents. Cliquez sur « Enregistrer » pour confirmer.',
      type: 'info',
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedClasse || classStudents.length === 0) {
      setActiveToast({ message: 'Aucun élève dans la classe sélectionnée.', type: 'warning' });
      return;
    }
    const result = await sheet.save();
    setActiveToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      // Rafraîchir l'historique récent, lui aussi relu depuis la base.
      await fetchAbsencesHistory();
    }
  };

  // Compteurs calculés sur l'état affiché (saisies locales comprises).
  const statusOf = (id: string) => sheet.entryOf(id).status;
  const countPresents = classStudents.filter((e) => statusOf(e.id) === 'present').length;
  const countAbsents = classStudents.filter((e) => statusOf(e.id) === 'absent').length;
  const countRetards = classStudents.filter((e) => statusOf(e.id) === 'retard').length;
  const countUnset = classStudents.length - countPresents - countAbsents - countRetards;

  const isSheetLoading = sheet.loadState === 'loading';
  const hasLoadError = sheet.loadState === 'error';
  const showRoster = !isSheetLoading && (!hasLoadError || sheet.hasDraft);
  const isDirty = sheet.changedCount > 0;
  const isSubmitting = sheet.saving;

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
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Faites l'appel de vos élèves. Rien n'est enregistré avant que vous cliquiez sur « Enregistrer ».
          </p>
        </div>
      </div>

      {/* État si aucune classe affectée */}
      {teacherClasses.length === 0 ? (
        <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <GraduationCap className="h-12 w-12 mx-auto text-blue-500/70" />
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
              title="Sans état"
              amount={countUnset}
              unit="count"
              subtitle="Pas encore renseignés"
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
                    if (v === selectedClasse || !confirmDiscardIfNeeded()) return;
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
                  onChange={(d) => {
                    // Une date vide ou inchangée ne déclenche rien ; un changement abandonne les saisies non enregistrées.
                    if (!d || d === selectedDate || !confirmDiscardIfNeeded()) return;
                    setSelectedDate(d);
                  }}
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
            {/* Bandeau d'état de la feuille : ce que la base contient réellement */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-4 py-3 sm:px-6">
              <AnimatePresence mode="wait" initial={false}>
                {isSheetLoading ? (
                  <motion.p
                    key="loading"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.12 }}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Chargement de l&rsquo;appel enregistré…
                  </motion.p>
                ) : hasLoadError ? (
                  <motion.div
                    key="error"
                    role="alert"
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.14 }}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <p className="flex items-start gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        L&rsquo;appel enregistré n&rsquo;a pas pu être chargé. Ce qui est affiché peut ne pas être à
                        jour.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => void sheet.reload()}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Réessayer
                    </button>
                  </motion.div>
                ) : isDirty ? (
                  <motion.p
                    key="dirty"
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.14 }}
                    className="flex items-center gap-2 text-xs font-bold text-[#1D4ED8] dark:text-blue-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#1D4ED8] dark:bg-blue-400" aria-hidden="true" />
                    Modifications non enregistrées
                  </motion.p>
                ) : sheet.savedAt || sheet.rows.length > 0 ? (
                  <motion.p
                    key="saved"
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.14 }}
                    className="flex items-center gap-2 text-xs font-bold text-primary-text dark:text-primary-text"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {sheet.savedAt ? `Enregistrée à ${formatSavedAt(sheet.savedAt)}` : 'Enregistrée'}
                  </motion.p>
                ) : (
                  <motion.div
                    key="none"
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.14 }}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        Aucune absence ni retard enregistré
                      </span>{' '}
                      pour cette classe et cette date. Un appel où tous les élèves sont présents n&rsquo;est pas
                      mémorisé.
                    </p>
                    {sheet.unsetCount > 0 && classStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                      >
                        <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        Tout marquer présent
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSheetLoading ? (
              <div className="space-y-3 p-3 sm:p-4" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : !showRoster ? null : paginatedStudents.length === 0 ? (
              <p className="py-12 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Aucun élève trouvé dans la classe {selectedClasse}.
              </p>
            ) : (
              <ul className="space-y-3 p-3 sm:p-4">
                {paginatedStudents.map((el, i) => (
                  <AbsenceStudentRow
                    key={el.id}
                    index={i}
                    nom={el.nom}
                    prenom={el.prenom}
                    matricule={el.matricule}
                    sexe={el.sexe}
                    entry={sheet.entryOf(el.id)}
                    modified={entryChanged(sheet.entryOf(el.id), sheet.saved[el.id])}
                    disabled={isSubmitting}
                    repere={reperes[el.id] ?? null}
                    onStatus={(s) => sheet.setStatus(el.id, s)}
                    onDetails={(patch) => sheet.setDetails(el.id, patch)}
                  />
                ))}
              </ul>
            )}

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
                            ? 'bg-[#1D4ED8] text-white shadow-xs'
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

          {/* Barre d'enregistrement : toujours accessible en bas de l'écran */}
          <div className="sticky bottom-0 z-20 -mx-6 sm:-mx-8 lg:-mx-10 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-6 sm:px-8 lg:px-10 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300" aria-live="polite">
                {isDirty ? (
                  <span className="font-bold text-[#1D4ED8] dark:text-blue-300">
                    {sheet.changedCount} modification{sheet.changedCount > 1 ? 's' : ''} non enregistrée
                    {sheet.changedCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>Aucune modification en attente.</span>
                )}
                {isDirty && showRoster && sheet.unsetCount > 0 && (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {sheet.unsetCount} élève{sheet.unsetCount > 1 ? 's' : ''} sans état seront considéré
                    {sheet.unsetCount > 1 ? 's' : ''} présent{sheet.unsetCount > 1 ? 's' : ''}.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSubmitting || !isDirty || isSheetLoading || classStudents.length === 0}
                className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileCheck className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Historique Récent des Absences Enregistrées */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary-text dark:text-primary-text" />
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
