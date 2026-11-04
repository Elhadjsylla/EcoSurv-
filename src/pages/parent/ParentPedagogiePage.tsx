import React, { useState } from 'react';
import { ParentMatiereNote } from '../../types';
import { useAnneeScolaire } from '../../hooks/useAnneeScolaire';
import { Button } from '../../components/ui/Button';
import { generateBulletinPdf } from '../../lib/pdf/generateBulletinPdf';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { KpiCard } from '../../components/ui/KpiCard';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { MobileCardList, MobileCard } from '../../components/ui/MobileCards';
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
  onSelectChild?: (id: string) => void;
}

export const ParentPedagogiePage: React.FC<ParentPedagogiePageProps> = ({
  selectedChildId,
  onSelectChild,
}) => {
  const authEcole = useAuthStore((s) => s.ecole);
  const anneeScolaire = useAnneeScolaire();
  const ecoleNom = authEcole?.nom || 'Établissement Scolaire';
  const { activeChild, errorMessage: childrenError } = useParentChildren(selectedChildId, onSelectChild || (() => { }));

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
          <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-primary-text dark:text-primary-text flex items-center justify-center mx-auto shadow-sm">
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

  const enfant = {
    id: activeChild.id,
    nom: activeChild.nom,
    prenom: activeChild.prenom,
    classe: activeChild.classe,
    matricule: activeChild.matricule,
    photo_initiales: activeChild.photo_initiales,
    rang: '-',
    moyenne_generale: 0,
    reste_a_payer: activeChild.remaining,
    statut_paiement: (activeChild.remaining === 0 ? 'paye' : 'partiel') as any,
    total_regle: activeChild.total_paid,
    bulletin: [] as ParentMatiereNote[],
    emploi_du_temps_aujourdhui: [],
    nb_absences_total: 0,
    nb_retards_total: 0,
  };

  const hasNotes = enfant.bulletin.length > 0;

  // Calcul du total des points
  const totalPoints = enfant.bulletin.reduce(
    (acc, m) => acc + m.moyenne * m.coefficient,
    0
  );
  const totalCoefs = enfant.bulletin.reduce((acc, m) => acc + m.coefficient, 0);
  const moyenneCalculee = hasNotes && totalCoefs > 0 ? totalPoints / totalCoefs : null;

  const trimestreLabel =
    selectedTrimestre === 'T1'
      ? 'Trimestre 1'
      : selectedTrimestre === 'T2'
        ? 'Trimestre 2'
        : 'Trimestre 3';

  const formattedRang =
    !hasNotes || !enfant.rang || enfant.rang === '-'
      ? '—'
      : `${enfant.rang}${String(enfant.rang) === '1' ? 'er' : 'e'} rang`;

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
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-primary-text dark:text-primary-text border border-blue-200 dark:border-blue-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Résultats Scolaires • {trimestreLabel}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Notes & Évaluations Périodiques</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bulletin de Notes — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Classe de {enfant.classe}{anneeScolaire ? ` • Année scolaire ${anneeScolaire}` : ''}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:shrink-0">
          {/* Sélecteur de trimestre : contrôle segmenté pleine largeur sous 640 px */}
          <SegmentedControl
            label="Trimestre"
            value={selectedTrimestre}
            onChange={setSelectedTrimestre}
            options={[
              { value: 'T1', label: 'Trimestre 1', shortLabel: 'T1' },
              { value: 'T2', label: 'Trimestre 2', shortLabel: 'T2', suffix: '(En cours)', marker: true, ariaLabel: 'Trimestre 2 (en cours)' },
              { value: 'T3', label: 'Trimestre 3', shortLabel: 'T3' },
            ]}
          />

          <Button
            size="sm"
            disabled={!hasNotes}
            title={
              !hasNotes
                ? "Export indisponible : aucune note saisie ce trimestre"
                : "Télécharger le bulletin trimestriel en PDF"
            }
            onClick={() => {
              if (!hasNotes || moyenneCalculee === null) return;
              generateBulletinPdf({
                enfantNom: enfant.nom,
                enfantPrenom: enfant.prenom,
                matricule: enfant.matricule,
                classe: enfant.classe,
                trimestre: selectedTrimestre,
                anneeScolaire,
                rang: enfant.rang,
                effectif: 0,
                moyenneGenerale: moyenneCalculee,
                moyenneClasse: 0,
                matieres: enfant.bulletin,
                ecoleNom,
              });
              setActiveToast({
                message: `Bulletin du ${selectedTrimestre === 'T1' ? '1er' : selectedTrimestre === 'T2' ? '2ème' : '3ème'} Trimestre téléchargé en PDF pour ${enfant.prenom} ${enfant.nom}.`,
                type: 'success',
              });
            }}
            className="w-full sm:w-auto whitespace-nowrap bg-primary hover:bg-primary-hover text-white text-xs font-semibold gap-2 px-3.5 py-2.5 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="h-4 w-4 shrink-0" />
            Bulletin PDF
          </Button>
        </div>
      </div>

      {/* 3 Pastel KPI Cards (Purple & Complementary accents) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title={`Moyenne ${trimestreLabel}`}
          customValue={moyenneCalculee !== null ? `${moyenneCalculee.toFixed(2)} / 20` : '—'}
          subtitle={
            moyenneCalculee !== null
              ? (moyenneCalculee >= 10 ? 'Admis(e)' : 'Travail à consolider')
              : 'Aucune note saisie ce trimestre'
          }
          icon={<GraduationCap className="w-5 h-5 text-primary-text dark:text-primary-text" />}
          variant="purple"
        />

        <KpiCard
          title="Rang & Classement"
          customValue={formattedRang}
          subtitle={
            hasNotes && enfant.rang && enfant.rang !== '-'
              ? `Parmi les élèves de ${enfant.classe}`
              : 'Classement indisponible'
          }
          icon={<Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />

        <KpiCard
          title="Moyenne de la Classe"
          customValue="—"
          subtitle="Aucune évaluation de classe"
          icon={<GraduationCap className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          variant="default"
        />
      </div>

      {/* Tableau détaillé des Matières et Notes */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-primary-text dark:text-primary-text" />
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

        {/* Sous 640 px : une carte par matière (libellés visibles, texte long à la ligne) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden sm:hidden">
          {enfant.bulletin.length === 0 ? (
            <p className="py-8 px-4 text-center text-xs italic text-slate-500 dark:text-slate-400">
              Aucune note saisie ce trimestre pour cet élève.
            </p>
          ) : (
            <MobileCardList label="Détail des matières">
              {enfant.bulletin.map((m: ParentMatiereNote, idx: number) => (
                <MobileCard
                  key={idx}
                  index={idx}
                  title={m.matiere}
                  subtitle={m.professeur}
                  badge={
                    <span className="inline-block rounded-full border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 font-mono text-xs font-black text-primary-text">
                      {m.moyenne.toFixed(1)} / 20
                    </span>
                  }
                  facts={[
                    { label: 'Coefficient', value: m.coefficient },
                    { label: 'Moy. classe', value: <span className="font-mono">{m.moyenne_classe.toFixed(1)}</span> },
                    { label: 'Appréciation', wide: true, value: <span className="italic font-normal">« {m.appreciation} »</span> },
                  ]}
                />
              ))}
            </MobileCardList>
          )}
        </div>

        <div className="hidden sm:block rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                      Aucune note saisie ce trimestre pour cet élève.
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
                        <span className="font-black text-primary-text dark:text-primary-text text-base font-mono">
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
