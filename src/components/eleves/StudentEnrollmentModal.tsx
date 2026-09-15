import React, { useId, useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { X, UserPlus, Info } from 'lucide-react';
import { messageErreurDonnees } from '../../data/errors';
import { todayISO } from '../../data/aggregations';
import { useInscrireEleve, type NouvelEleve } from '../../data/eleves';

interface StudentEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrolled: (eleve: { id: string; nom: string; prenom: string }) => void;
  classesList: string[];
  anneeScolaire: string | null;
}

const vide = (classe: string, annee: string | null): NouvelEleve => ({
  nom: '',
  prenom: '',
  classe,
  matricule: '',
  date_naissance: '',
  lieu_naissance: '',
  sexe: '',
  annee_scolaire: annee,
});

const inputClass =
  'w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none';

export const StudentEnrollmentModal: React.FC<StudentEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnrolled,
  classesList,
  anneeScolaire,
}) => {
  const [form, setForm] = useState<NouvelEleve>(() => vide(classesList[0] ?? '', anneeScolaire));
  const mutation = useInscrireEleve();
  const ids = { prenom: useId(), nom: useId(), classe: useId(), matricule: useId(), lieu: useId(), classes: useId() };

  if (!isOpen) return null;

  const update = <K extends keyof NouvelEleve>(key: K, value: NouvelEleve[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eleve = await mutation.mutateAsync({ ...form, annee_scolaire: anneeScolaire });
      setForm(vide(form.classe, anneeScolaire));
      mutation.reset();
      onEnrolled(eleve);
      onClose();
    } catch {
      // Message affiché à partir de mutation.error.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inscription-titre"
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 id="inscription-titre" className="text-lg font-bold text-slate-900 dark:text-white">
                Inscrire un nouvel élève
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enregistrement dans le registre de l'établissement{anneeScolaire ? ` (${anneeScolaire})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={ids.prenom} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input id={ids.prenom} type="text" required value={form.prenom} onChange={(e) => update('prenom', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor={ids.nom} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom de famille <span className="text-red-500">*</span>
              </label>
              <input id={ids.nom} type="text" required value={form.nom} onChange={(e) => update('nom', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={ids.classe} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Classe <span className="text-red-500">*</span>
              </label>
              <input
                id={ids.classe}
                type="text"
                required
                list={ids.classes}
                value={form.classe}
                onChange={(e) => update('classe', e.target.value)}
                placeholder="Choisir ou saisir une classe"
                className={inputClass}
              />
              <datalist id={ids.classes}>
                {classesList.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor={ids.matricule} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Matricule (facultatif)
              </label>
              <input id={ids.matricule} type="text" value={form.matricule} onChange={(e) => update('matricule', e.target.value)} className={`${inputClass} font-mono`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date de naissance</span>
              <DatePicker
                value={form.date_naissance}
                onChange={(val) => update('date_naissance', val)}
                max={todayISO()}
                size="sm"
                className="w-full"
                triggerClassName="w-full h-9 rounded-lg text-xs"
                placeholder="JJ/MM/AAAA"
              />
            </div>
            <div>
              <label htmlFor={ids.lieu} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lieu de naissance
              </label>
              <input id={ids.lieu} type="text" value={form.lieu_naissance} onChange={(e) => update('lieu_naissance', e.target.value)} className={inputClass} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sexe</span>
              <Select<'M' | 'F' | ''>
                value={form.sexe}
                onChange={(val) => update('sexe', val)}
                options={[
                  { value: '', label: 'Non renseigné' },
                  { value: 'M', label: 'Masculin (M)' },
                  { value: 'F', label: 'Féminin (F)' },
                ]}
                size="sm"
                triggerClassName="w-full h-9 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-[11px] text-slate-600 dark:text-slate-300">
            <Info className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              Le responsable légal est rattaché à l'élève lors de la création de son compte parent, qui passera par
              une fonction serveur. Les échéances se créent ensuite depuis « Échéances & Tarifs ».
            </span>
          </div>

          {mutation.error && (
            <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {messageErreurDonnees(mutation.error)}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" className="gap-2" loading={mutation.isPending} loadingText="Inscription…">
              <UserPlus className="h-4 w-4" />
              Valider l'inscription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
