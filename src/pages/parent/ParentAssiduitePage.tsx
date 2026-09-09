import React, { useState } from 'react';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  AbsenceRecord,
  MOCK_ABSENCES_INITIAL,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { ToastNotification } from '../../components/ui/ToastNotification';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  X,
  FileCheck,
} from 'lucide-react';

interface ParentAssiduitePageProps {
  selectedChildId: string;
}

export const ParentAssiduitePage: React.FC<ParentAssiduitePageProps> = ({
  selectedChildId,
}) => {
  const enfant =
    MOCK_PARENT_ENFANTS_DETAILS[selectedChildId] ||
    MOCK_PARENT_ENFANTS_DETAILS['el-001'];

  // Récupération des absences de l'enfant
  const [absencesList, setAbsencesList] = useState<AbsenceRecord[]>(() => {
    const records = MOCK_ABSENCES_INITIAL.filter(
      (a) => a.eleve_id === selectedChildId
    );
    if (records.length > 0) return records;

    // Donnée initiale réaliste par défaut si aucune absence dans mock
    return [
      {
        id: `abs-sample-${selectedChildId}`,
        eleve_id: selectedChildId,
        eleve_nom: enfant.nom,
        eleve_prenom: enfant.prenom,
        classe: enfant.classe,
        date_absence: '2026-02-14',
        creneau: 'matin',
        type: 'absence',
        justifiee: true,
        motif: 'Certificat médical fourni (grippe saisonnière)',
      },
    ];
  });

  // Modal de déclaration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateAbsence, setDateAbsence] = useState('2026-03-10');
  const [creneau, setCreneau] = useState<'journee' | 'matin' | 'apres_midi'>('journee');
  const [motif, setMotif] = useState('Rendez-vous médical');
  const [commentaire, setCommentaire] = useState('');
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const totalAbsences = absencesList.filter((a) => a.type === 'absence').length;
  const justifiees = absencesList.filter((a) => a.justifiee).length;
  const nonJustifiees = totalAbsences - justifiees;

  const handleDeclareAbsence = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: AbsenceRecord = {
      id: `abs-${Date.now()}`,
      eleve_id: selectedChildId,
      eleve_nom: enfant.nom,
      eleve_prenom: enfant.prenom,
      classe: enfant.classe,
      date_absence: dateAbsence,
      creneau: creneau === 'journee' ? 'matin' : creneau,
      type: 'absence',
      justifiee: true,
      motif: `${motif}${commentaire ? ` : ${commentaire}` : ''}`,
    };

    setAbsencesList([newRecord, ...absencesList]);
    setIsModalOpen(false);
    setCommentaire('');

    setActiveToast({
      message: `Justification transmise à la vie scolaire pour ${enfant.prenom} le ${dateAbsence}.`,
      type: 'success',
    });
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-fade-in">
      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <ToastNotification
            message={activeToast.message}
            type={activeToast.type}
            onClose={() => setActiveToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Vie Scolaire
            </span>
            <span className="text-xs text-slate-500">• Suivi de l'Assiduité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Assiduité & Absences — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Suivi des présences en temps réel. Justifiez une absence ou déclarez un empêchement directement à l'établissement.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-sm py-2.5 px-4 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Déclarer une Absence
        </Button>
      </div>

      {/* 3 Cartes de Synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 sm:p-7 rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Total Absences</span>
            <CalendarCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalAbsences} séance(s)
          </div>
          <p className="text-xs text-slate-500 mt-2">Depuis le début de l'année</p>
        </Card>

        <Card className="p-6 sm:p-7 rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Absences Justifiées</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {justifiees}
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-2">
            Validées par l'administration
          </p>
        </Card>

        <Card className="p-6 sm:p-7 rounded-2xl border-slate-200/80 shadow-xs bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
            <span>À Justifier</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black ${
              nonJustifiees > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {nonJustifiees}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {nonJustifiees > 0
              ? 'Veuillez transmettre un justificatif'
              : 'Dossier d\'assiduité en règle'}
          </p>
        </Card>
      </div>

      {/* Historique des Absences */}
      <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Registre des Absences et Retards
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Année scolaire 2025-2026
          </span>
        </div>

        <div className="space-y-4">
          {absencesList.map((item) => (
            <div
              key={item.id}
              className="p-4.5 sm:p-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                    item.justifiee
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {item.justifiee ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {item.type === 'absence' ? 'Absence' : 'Retard'} • Créneau du {item.creneau}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Date : <span className="font-semibold text-slate-700">{item.date_absence}</span>
                  </div>
                  {item.motif && (
                    <div className="text-xs text-slate-600 mt-1.5 italic">
                      Motif : « {item.motif} »
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.justifiee ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileCheck className="h-3.5 w-3.5" /> Justifiée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertCircle className="h-3.5 w-3.5" /> Non justifiée
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Déclarer / Justifier une absence */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-indigo-300" />
                  Déclarer une Absence
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Pour {enfant.prenom} {enfant.nom} ({enfant.classe})
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-indigo-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDeclareAbsence} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Date de l'absence
                </label>
                <DatePicker
                  value={dateAbsence}
                  onChange={setDateAbsence}
                  size="sm"
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Créneau concerné
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'journee', label: 'Journée entière' },
                    { id: 'matin', label: 'Matinée' },
                    { id: 'apres_midi', label: 'Après-midi' },
                  ].map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() =>
                        setCreneau(c.id as 'journee' | 'matin' | 'apres_midi')
                      }
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        creneau === c.id
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-500 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Motif principal
                </label>
                <Select
                  value={motif}
                  onChange={setMotif}
                  options={[
                    { value: 'Rendez-vous médical', label: 'Rendez-vous médical' },
                    { value: "Maladie de l'enfant", label: "Maladie de l'enfant" },
                    { value: 'Raison familiale impérieuse', label: 'Raison familiale impérieuse' },
                    { value: 'Voyage / Déplacement', label: 'Voyage / Déplacement' },
                    { value: 'Autre motif', label: 'Autre motif' },
                  ]}
                  size="sm"
                  triggerClassName="w-full h-10 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Détails ou remarques (facultatif)
                </label>
                <textarea
                  rows={3}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Précisez ici les détails utiles pour la vie scolaire..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Transmettre
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
