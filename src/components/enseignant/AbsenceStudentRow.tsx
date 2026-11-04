import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import { MOTIFS } from '../../lib/declarationsAbsence';
import { StudentInitials } from '../ui/StudentInitials';
import {
  QUICK_MOTIFS,
  describeDetail,
  type AttendanceEntry,
  type AttendanceStatus,
} from '../../lib/absences';

interface Props {
  nom: string;
  prenom: string;
  matricule: string;
  sexe?: string | null;
  entry: AttendanceEntry;
  /** Vrai si l'état affiché diffère de celui enregistré en base. */
  modified: boolean;
  disabled?: boolean;
  index: number;
  onStatus: (status: AttendanceStatus) => void;
  onDetails: (patch: { motif?: string; justifiee?: boolean }) => void;
  /**
   * Information seulement : déclaration d'absence du parent qui couvre cette date (acceptée ou en attente).
   * N'agit jamais sur l'état saisi : l'enseignant reste maître de ce qu'il enregistre.
   */
  repere?: { motif: string; statut: 'acceptee' | 'en_attente' } | null;
}

const STATUS_BUTTONS: {
  id: AttendanceStatus;
  label: string;
  icon: React.ReactNode;
  active: string;
  idle: string;
}[] = [
  {
    id: 'present',
    label: 'Présent',
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
    active: 'bg-emerald-600 text-white',
    idle: 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50',
  },
  {
    id: 'absent',
    label: 'Absent',
    icon: <XCircle className="h-4 w-4" aria-hidden="true" />,
    active: 'bg-rose-600 text-white',
    idle: 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/50',
  },
  {
    id: 'retard',
    label: 'Retard',
    icon: <Clock className="h-4 w-4" aria-hidden="true" />,
    active: 'bg-primary text-white',
    idle: 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50',
  },
];

const MOTIF_LABEL: Record<string, string> = Object.fromEntries(MOTIFS.map((m) => [m.value, m.label]));

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]';

export const AbsenceStudentRow: React.FC<Props> = ({
  nom,
  prenom,
  matricule,
  sexe,
  entry,
  modified,
  disabled = false,
  index,
  onStatus,
  onDetails,
  repere = null,
}) => {
  const reduceMotion = Boolean(useReducedMotion());
  const status = entry.status;
  const hasDetails = status === 'absent' || status === 'retard';
  const stateBar =
    status === 'absent'
      ? 'border-l-rose-500'
      : status === 'retard'
        ? 'border-l-amber-500'
        : status === 'present'
          ? 'border-l-emerald-500'
          : 'border-l-slate-200 dark:border-l-slate-700';

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.16, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.02 }}
      className={`rounded-2xl border border-l-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs ${stateBar}`}
    >
      <div className="flex items-center gap-3">
        <StudentInitials nom={nom} prenom={prenom} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-white">
            {prenom} {nom}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
            #{matricule}
            {sexe ? ` • ${sexe === 'M' ? 'Garçon' : sexe === 'F' ? 'Fille' : sexe}` : ''}
          </div>
        </div>
        {modified && (
          <span
            className="shrink-0 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-bold text-[#1D4ED8] dark:text-blue-300"
            title="Modifié, pas encore enregistré"
          >
            Modifié
          </span>
        )}
      </div>

      {repere && (
        <p
          className={`mt-2.5 flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
            repere.statut === 'acceptee'
              ? 'border-success-border bg-success-surface text-success-text'
              : 'border-warning-border bg-warning-surface text-warning-text'
          }`}
        >
          <FileText className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {repere.statut === 'acceptee'
              ? `Déclarée par le parent : ${MOTIF_LABEL[repere.motif] ?? repere.motif} (acceptée)`
              : 'Déclaration en attente de traitement'}
          </span>
        </p>
      )}

      <div
        role="radiogroup"
        aria-label={`État de ${prenom} ${nom}`}
        className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1"
      >
        {STATUS_BUTTONS.map((b) => {
          const selected = status === b.id;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onStatus(b.id)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${
                selected ? b.active : b.idle
              }`}
            >
              {b.icon}
              {b.label}
            </button>
          );
        })}
      </div>

      {status === null && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Pas encore renseigné.</p>
      )}

      <AnimatePresence initial={false}>
        {hasDetails && (
          <motion.div
            key="details"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-3">
              {entry.conflict && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 p-2.5 text-[11px] text-blue-900 dark:text-blue-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    La base contenait à la fois une absence et un retard pour ce jour. L&rsquo;enregistrement ne
                    gardera que l&rsquo;état choisi ici.
                  </span>
                </div>
              )}

              <div>
                <span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Motif {status === 'retard' ? 'du retard' : 'de l’absence'} (facultatif)
                </span>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK_MOTIFS.map((m) => {
                    const on = entry.motif.trim().toLowerCase() === m.toLowerCase();
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={disabled}
                        aria-pressed={on}
                        onClick={() => onDetails({ motif: on ? '' : m })}
                        className={`min-h-[44px] rounded-full border px-3.5 text-xs font-semibold transition-colors sm:min-h-[32px] ${FOCUS} ${
                          on
                            ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  disabled={disabled}
                  value={entry.motif}
                  maxLength={200}
                  onChange={(e) => onDetails({ motif: e.target.value })}
                  placeholder="Ou écrivez un motif"
                  aria-label={`Motif pour ${prenom} ${nom}`}
                  className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] sm:h-9"
                />
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={entry.justifiee}
                disabled={disabled}
                onClick={() => onDetails({ justifiee: !entry.justifiee })}
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 ${FOCUS}`}
              >
                <span>{status === 'retard' ? 'Retard justifié' : 'Absence justifiée'}</span>
                <span
                  aria-hidden="true"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    entry.justifiee ? 'bg-[#1D4ED8]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-all ${
                      entry.justifiee ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {status === 'retard' ? 'Retard' : 'Absence'} — {describeDetail(entry)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
};
