import React, { useState } from 'react';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  ParentMatiereNote,
} from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { generateBulletinPdf } from '../../lib/pdf/generateBulletinPdf';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { KpiCard } from '../../components/ui/KpiCard';
import {
  GraduationCap,
  ArrowDownToLine,
  Award,
  FileText,
  Printer,
  AlertCircle,
} from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { useParentChildren } from '../../hooks/useParentChildren';

interface ParentPedagogiePageProps {
  selectedChildId: string;
}

export const ParentPedagogiePage: React.FC<ParentPedagogiePageProps> = ({
  selectedChildId,
}) => {
  const authEcole = useAuthStore((s) => s.ecole);
  const ecoleNom = authEcole?.nom || 'Établissement Scolaire';
  const { activeChild, errorMessage: childrenError } = useParentChildren(selectedChildId, () => {});

  const [selectedTrimestre, setSelectedTrimestre] = useState<string>('T2');
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  if (childrenError) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Impossible de charger les données scolaires
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
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Aucun élève rattaché pour le moment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Votre espace famille est actif. Les notes, coefficients, appréciations et bulletins trimestriels de votre enfant apparaîtront dès leur publication par l'équipe pédagogique.
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
    statut_paiement: (activeChild.remaining === 0 ? 'paye' : 'partiel') as any,
    total_regle: activeChild.total_paid,
    bulletin: [] as ParentMatiereNote[],
    emploi_du_temps_aujourdhui: [],
    nb_absences_total: 0,
    nb_retards_total: 0,
  };

  // Calcul du total des points
  const totalPoints = enfant.bulletin.reduce(
    (acc, m) => acc + m.moyenne * m.coefficient,
    0
  );
  const totalCoefs = enfant.bulletin.reduce((acc, m) => acc + m.coefficient, 0);
  const moyenneCalculee = totalCoefs > 0 ? totalPoints / totalCoefs : 0;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              Résultats Scolaires
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Notes & Évaluations Périodiques</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bulletin de Notes — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Classe de {enfant.classe} • Année scolaire 2025-2026
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Sélecteur de trimestre */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setSelectedTrimestre('T1')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTrimestre === 'T1'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Trimestre 1
            </button>
            <button
              onClick={() => setSelectedTrimestre('T2')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTrimestre === 'T2'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Trimestre 2 (En cours)
            </button>
            <button
              onClick={() => setSelectedTrimestre('T3')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTrimestre === 'T3'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              Trimestre 3
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              generateBulletinPdf({
                enfantNom: enfant.nom,
                enfantPrenom: enfant.prenom,
                matricule: enfant.matricule,
                classe: enfant.classe,
                trimestre: selectedTrimestre,
                rang: enfant.rang,
                effectif: 32,
                moyenneGenerale: moyenneCalculee,
                moyenneClasse: 12.4,
                matieres: enfant.bulletin,
                ecoleNom,
              });
              setActiveToast({
                message: `Bulletin officiel du ${selectedTrimestre === 'T1' ? '1er' : selectedTrimestre === 'T2' ? '2ème' : '3ème'} Trimestre téléchargé en PDF pour ${enfant.prenom} ${enfant.nom}.`,
                type: 'success',
              });
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-2 px-3.5 py-2.5 rounded-xl shadow-xs"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Bulletin PDF
          </Button>
        </div>
      </div>

      {/* 3 Pastel KPI Cards (Purple & Complementary accents) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Moyenne Trimestrielle"
          customValue={`${moyenneCalculee.toFixed(2)} / 20`}
          subtitle="Mention : Félicitations du Conseil"
          icon={<GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant="purple"
        />

        <KpiCard
          title="Rang & Classement"
          customValue={`${enfant.rang}e rang`}
          subtitle={`Parmi les élèves de ${enfant.classe}`}
          icon={<Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />

        <KpiCard
          title="Moyenne de la Classe"
          customValue="12.4 / 20"
          subtitle={`+${(moyenneCalculee - 12.4).toFixed(1)} pts au-dessus de la classe`}
          icon={<GraduationCap className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          variant="default"
        />
      </div>

      {/* Tableau détaillé des Matières et Notes */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Détail des Matières & Appréciations des Professeurs
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Matière & Enseignant</th>
                  <th className="py-4 px-6 text-center">Coef.</th>
                  <th className="py-4 px-6 text-right">Note /20</th>
                  <th className="py-4 px-6 text-right">Moy. Classe</th>
                  <th className="py-4 px-6">Appréciation Pédagogique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {enfant.bulletin.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">
                      Aucune évaluation ni note enregistrée pour le moment pour ce trimestre.
                    </td>
                  </tr>
                ) : (
                  enfant.bulletin.map((m: ParentMatiereNote, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* 2-line: Matière + Professeur */}
                      <td className="py-4.5 px-6 min-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{m.matiere}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{m.professeur}</div>
                      </td>
                      <td className="py-4.5 px-6 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {m.coefficient}
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <span className="font-black text-purple-600 dark:text-purple-400 text-base font-mono">
                          {m.moyenne.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                        {m.moyenne_classe.toFixed(1)}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="text-xs text-slate-600 dark:text-slate-300 italic">
                          « {m.appreciation} »
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
