import React, { useState } from 'react';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  ParentMatiereNote,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ToastNotification } from '../../components/ui/ToastNotification';
import {
  GraduationCap,
  Download,
  Sparkles,
  Award,
  TrendingUp,
  FileText,
  Printer,
} from 'lucide-react';

interface ParentPedagogiePageProps {
  selectedChildId: string;
}

export const ParentPedagogiePage: React.FC<ParentPedagogiePageProps> = ({
  selectedChildId,
}) => {
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>('T2');
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const enfant =
    MOCK_PARENT_ENFANTS_DETAILS[selectedChildId] ||
    MOCK_PARENT_ENFANTS_DETAILS['el-001'];

  // Calcul du total des points
  const totalPoints = enfant.bulletin.reduce(
    (acc, m) => acc + m.moyenne * m.coefficient,
    0
  );
  const totalCoefs = enfant.bulletin.reduce((acc, m) => acc + m.coefficient, 0);
  const moyenneCalculee = totalCoefs > 0 ? totalPoints / totalCoefs : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-fade-in">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Résultats Scolaires
            </span>
            <span className="text-xs text-slate-500">• Notes & Évaluations Périodiques</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bulletin de Notes — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Classe de {enfant.classe} • Année scolaire 2025-2026
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sélecteur de trimestre */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSelectedTrimestre('T1')}
              className={`px-2.5 py-1 rounded transition-all ${
                selectedTrimestre === 'T1'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestre 1
            </button>
            <button
              onClick={() => setSelectedTrimestre('T2')}
              className={`px-2.5 py-1 rounded transition-all ${
                selectedTrimestre === 'T2'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestre 2 (En cours)
            </button>
            <button
              onClick={() => setSelectedTrimestre('T3')}
              className={`px-2.5 py-1 rounded transition-all ${
                selectedTrimestre === 'T3'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              Trimestre 3
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setActiveToast({
                message: `Téléchargement du bulletin officiel du Trimestre 2 pour ${enfant.prenom} ${enfant.nom}...`,
                type: 'success',
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Bulletin PDF
          </Button>
        </div>
      </div>

      {/* 3 Cartes de Synthèse Académique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border-none">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Moyenne Trimestrielle</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {moyenneCalculee.toFixed(2)}
            </span>
            <span className="text-sm font-bold text-indigo-300">/ 20</span>
          </div>
          <div className="mt-2 text-xs text-indigo-200 font-medium flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-300" />
            <span>Mention : Félicitations du Conseil</span>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Rang & Classement</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {enfant.rang}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Parmi tous les élèves inscrits en {enfant.classe}
          </p>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Moyenne de la Classe</span>
            <GraduationCap className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-700">
            12.4 <span className="text-sm font-normal text-slate-400">/ 20</span>
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            +{(moyenneCalculee - 12.4).toFixed(1)} pts au-dessus de la moyenne de classe
          </p>
        </Card>
      </div>

      {/* Tableau détaillé des Matières et Notes */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Détail des Matières & Appréciations des Professeurs
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold gap-1 text-slate-500 hover:text-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Matière & Enseignant</th>
                <th className="py-3 px-4 text-center">Coef.</th>
                <th className="py-3 px-4 text-right">Note /20</th>
                <th className="py-3 px-4 text-right">Moy. Classe</th>
                <th className="py-3 px-4">Appréciation Pédagogique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enfant.bulletin.map((m: ParentMatiereNote, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{m.matiere}</div>
                    <div className="text-xs text-slate-400">{m.professeur}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 text-xs">
                    {m.coefficient}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-black text-indigo-700 text-base font-mono">
                      {m.moyenne.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                    {m.moyenne_classe.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-slate-600 italic">
                      « {m.appreciation} »
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
