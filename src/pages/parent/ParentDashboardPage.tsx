import React from 'react';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  CURRENT_PARENT,
} from '../../lib/mockData';
import { useEcoleStore } from '../../store/useEcoleStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatMRU } from '../../lib/utils';
import {
  CreditCard,
  GraduationCap,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Phone,
  Sparkles,
  MapPin,
  Calendar,
  School,
} from 'lucide-react';
import { ParentNavTab } from '../../components/parent/ParentSidebar';

interface ParentDashboardPageProps {
  selectedChildId: string;
  onSelectChild: (id: string) => void;
  onNavigateTab: (tab: ParentNavTab) => void;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({
  selectedChildId,
  onSelectChild,
  onNavigateTab,
}) => {
  const ecole = useEcoleStore((s) => s.ecole);
  const enfant = MOCK_PARENT_ENFANTS_DETAILS[selectedChildId] || MOCK_PARENT_ENFANTS_DETAILS['el-001'];

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Espace Tuteur Légal
              </span>
              <span className="text-xs text-indigo-300">• {ecole.nom}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bonjour, {CURRENT_PARENT.prenom} {CURRENT_PARENT.nom}
            </h1>
            <p className="text-sm text-indigo-200/90 mt-1.5 max-w-xl">
              Retrouvez la situation académique, l'assiduité en temps réel et le règlement des frais scolaires pour vos enfants inscrits.
            </p>
          </div>

          {/* Sélecteur rapide d'enfant pour Mobile / Tablette */}
          <div className="flex flex-wrap gap-2.5 pt-2 md:pt-0 shrink-0">
            {CURRENT_PARENT.enfants_ids.map((id) => {
              const item = MOCK_PARENT_ENFANTS_DETAILS[id];
              const isSelected = selectedChildId === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelectChild(id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-white text-indigo-950 border-white shadow-lg scale-102'
                      : 'bg-indigo-950/60 border-indigo-700/60 text-indigo-200 hover:bg-indigo-900/60'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-800 text-indigo-200'
                    }`}
                  >
                    {item.photo_initiales}
                  </span>
                  <span>{item.prenom}</span>
                  <span className="text-[10px] opacity-75">({item.classe})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Focus Enfant Sélectionné Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold text-xl flex items-center justify-center shrink-0 border border-indigo-200">
            {enfant.photo_initiales}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">
                {enfant.prenom} {enfant.nom}
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {enfant.classe}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span>Matricule: {enfant.matricule}</span>
              <span>•</span>
              <span>Prof. Principal: {enfant.professeur_principal}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('parent_pedagogie')}
            className="text-xs font-semibold gap-2 px-3.5 py-2"
          >
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Voir le Bulletin
          </Button>
          {enfant.reste_a_payer > 0 && (
            <Button
              size="sm"
              onClick={() => onNavigateTab('parent_paiements')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-2 px-3.5 py-2 shadow-sm"
            >
              <CreditCard className="h-4 w-4" />
              Régler ({formatMRU(enfant.reste_a_payer)})
            </Button>
          )}
        </div>
      </div>

      {/* 3 Cartes Synthétiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statut Financier */}
        <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-white relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Frais de Scolarité</span>
            <CreditCard className="h-4 w-4 text-indigo-600" />
          </div>

          {enfant.reste_a_payer === 0 ? (
            <div>
              <div className="flex items-center gap-2 text-emerald-600 text-lg font-extrabold mt-1">
                <CheckCircle2 className="h-5 w-5" />
                <span>Compte à jour</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Totalité de la scolarité réglée ({formatMRU(enfant.total_regle)})
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-rose-600 text-lg font-extrabold mt-1">
                <AlertCircle className="h-5 w-5" />
                <span>{formatMRU(enfant.reste_a_payer)} restant</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Échéance de {formatMRU(enfant.prochaine_echeance_montant)} attendue
              </p>
              <button
                onClick={() => onNavigateTab('parent_paiements')}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Payer par Mobile Money <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </Card>

        {/* Moyenne & Rang */}
        <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Résultats Trimestre 2</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">
              {enfant.moyenne_generale.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-400">/ 20</span>
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <span>Rang : {enfant.rang}</span>
            <span>• Tableau d'Honneur</span>
          </p>
          <button
            onClick={() => onNavigateTab('parent_pedagogie')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Consulter les notes par matière <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Card>

        {/* Assiduité */}
        <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Assiduité & Présence</span>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Présent aujourd'hui
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total : {enfant.nb_absences_total} absence(s), {enfant.nb_retards_total} retard(s)
          </p>
          <button
            onClick={() => onNavigateTab('parent_assiduite')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Historique ou Justifier une absence <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Card>
      </div>

      {/* 2 Colonnes : Emploi du temps du jour & Notes récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emploi du Temps du Jour */}
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Emploi du Temps d'Aujourd'hui
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="space-y-2.5">
            {enfant.emploi_du_temps_aujourdhui.map((cours, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 rounded bg-indigo-100 text-indigo-900 text-xs font-bold font-mono">
                    {cours.heure}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{cours.matiere}</div>
                    <div className="text-xs text-slate-500">{cours.professeur}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {cours.salle}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Dernières Évaluations & Notes */}
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Dernières Notes Reçues
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('parent_pedagogie')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Tout voir
            </button>
          </div>

          <div className="space-y-3">
            {enfant.bulletin.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.matiere}</div>
                  <div className="text-xs text-slate-400">
                    Coef. {item.coefficient} • {item.professeur}
                  </div>
                  <div className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-1">
                    « {item.appreciation} »
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="text-base font-black text-indigo-600 font-mono">
                    {item.moyenne.toFixed(1)} <span className="text-xs text-slate-400">/ 20</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Classe: {item.moyenne_classe.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Contacts de l'Établissement */}
      <Card className="p-4 bg-slate-900 text-white border-none shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <School className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold">{ecole.nom} • Secrétariat</h4>
            <p className="text-xs text-slate-400">
              Ouvert du Lundi au Vendredi de 08:00 à 17:00 (Tevragh-Zeina)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${ecole.telephone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-indigo-400" />
            {ecole.telephone}
          </a>
          <button
            onClick={() => onNavigateTab('parent_assiduite')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            Déclarer Absence
          </button>
        </div>
      </Card>
    </div>
  );
};
