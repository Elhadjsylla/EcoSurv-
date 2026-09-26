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
import { KpiCard } from '../../components/ui/KpiCard';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  X,
  FileCheck,
  Calendar,
} from 'lucide-react';

import { useParentChildren } from '../../hooks/useParentChildren';

interface ParentAssiduitePageProps {
  selectedChildId: string;
}

export const ParentAssiduitePage: React.FC<ParentAssiduitePageProps> = ({
  selectedChildId,
}) => {
  const { activeChild, errorMessage: childrenError } = useParentChildren(selectedChildId, () => {});

  if (childrenError) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Impossible de charger les données d'assiduité
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {childrenError}
          </p>
        </div>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Aucun élève rattaché pour le moment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Votre espace famille est actif. Le relevé d'assiduité, les absences et les déclarations de justificatifs d'absence de vos enfants apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  const mockEnfant = MOCK_PARENT_ENFANTS_DETAILS[activeChild.id];
  const enfant = mockEnfant || {
    id: activeChild.id,
    nom: activeChild.nom,
    prenom: activeChild.prenom,
    classe: activeChild.classe,
    matricule: activeChild.matricule,
    photo_initiales: activeChild.photo_initiales,
    rang: 1,
    moyenne_generale: 0,
    reste_a_payer: activeChild.remaining,
    statut_paiement: activeChild.remaining === 0 ? 'paye' : 'partiel',
    total_regle: activeChild.total_paid,
    bulletin: [],
    emploi_du_temps_aujourdhui: [],
    nb_absences_total: 0,
    nb_retards_total: 0,
  };

  // Récupération des absences de l'enfant
  const [absencesList, setAbsencesList] = useState<AbsenceRecord[]>(() => {
    const records = MOCK_ABSENCES_INITIAL.filter(
      (a) => a.eleve_id === activeChild.id
    );
    if (records.length > 0) return records;
    if (mockEnfant) {
      return [
        {
          id: 'abs-1',
          eleve_id: activeChild.id,
          eleve_nom: enfant.nom,
          eleve_prenom: enfant.prenom,
          classe: enfant.classe,
          date_absence: '2026-02-14',
          creneau: 'matin' as const,
          type: 'absence',
          justifiee: false,
          motif: 'Non justifié',
        },
      ];
    }
    return [];
  });

  // Modal de déclaration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateAbsence, setDateAbsence] = useState('2026-03-10');
  const [creneau, setCreneau] = useState<'journee' | 'matin' | 'apres_midi'>('journee');
  const [motif, setMotif] = useState('Rendez-vous médical');
  const [commentaire, setCommentaire] = useState('');
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
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
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-fade-in text-slate-900 dark:text-slate-100">
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

      {/* Header Banner - Nexoov DA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Vie Scolaire
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Registre d'assiduité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Assiduité & Absences — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Suivi des présences en temps réel. Justifiez une absence ou déclarez un empêchement directement à l'établissement.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-2 shadow-sm py-2.5 px-4 rounded-xl shrink-0 transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Déclarer une Absence
        </Button>
      </div>

      {/* 3 Cartes KPI Pastel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Absences"
          customValue={`${totalAbsences} séance(s)`}
          subtitle="Depuis la rentrée scolaire"
          icon={<CalendarCheck className="w-5 h-5" />}
          variant="purple"
        />

        <KpiCard
          title="Absences Justifiées"
          customValue={justifiees}
          subtitle="Validées par l'administration"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />

        <KpiCard
          title="À Justifier"
          customValue={nonJustifiees}
          subtitle={
            nonJustifiees > 0
              ? 'Justificatif requis rapidement'
              : "Dossier d'assiduité en règle"
          }
          icon={<AlertCircle className="w-5 h-5" />}
          variant={nonJustifiees > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Historique des Absences */}
      <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Registre des Absences et Retards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historique chronologique des événements scolaires
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Année 2025-2026
          </span>
        </div>

        <div className="space-y-3.5">
          {absencesList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.justifiee
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                      : 'bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60'
                  }`}
                >
                  {item.justifiee ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>{item.type === 'absence' ? 'Absence' : 'Retard'}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                      Créneau : {item.creneau}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Date constatée : <strong className="font-semibold text-slate-700 dark:text-slate-300">{item.date_absence}</strong></span>
                  </div>
                  {item.motif && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic bg-slate-50 dark:bg-slate-800/60 py-1 px-2.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                      Motif : « {item.motif} »
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {item.justifiee ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <FileCheck className="h-3.5 w-3.5" /> Justifiée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 dark:from-purple-950 dark:to-slate-900 text-white p-5 flex items-center justify-between border-b border-purple-800/40">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-purple-300" />
                  Déclarer une Absence
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Pour {enfant.prenom} {enfant.nom} ({enfant.classe})
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-purple-300 hover:text-white p-1 rounded-lg transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDeclareAbsence} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Date de l'absence
                </label>
                <DatePicker
                  value={dateAbsence}
                  onChange={setDateAbsence}
                  size="sm"
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-xl text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
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
                          ? 'bg-purple-50 text-purple-900 border-purple-500 shadow-xs dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-500'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
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
                  triggerClassName="w-full h-10 rounded-lg text-xs font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Détails ou remarques (facultatif)
                </label>
                <textarea
                  rows={3}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Précisez ici les détails utiles pour la vie scolaire..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 flex items-center gap-1.5 shadow-sm"
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
