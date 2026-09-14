import React from 'react';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  CURRENT_PARENT,
} from '../../lib/mockData';
import { useEcoleStore } from '../../store/useEcoleStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { formatMRU } from '../../lib/utils';
import {
  CreditCard,
  GraduationCap,
  CalendarCheck,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  School,
  Phone,
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
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              Espace Tuteur Légal
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• {ecole.nom}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bonjour, {CURRENT_PARENT.prenom} {CURRENT_PARENT.nom} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl">
            Retrouvez la situation académique, l'assiduité en temps réel et le règlement des frais scolaires pour vos enfants inscrits.
          </p>
        </div>

        {/* Sélecteur rapide d'enfant pour Mobile / Tablette */}
        <div className="flex flex-wrap gap-2.5 pt-2 md:pt-0 shrink-0">
          {CURRENT_PARENT.enfants_ids.map((id) => {
            const item = MOCK_PARENT_ENFANTS_DETAILS[id];
            const isSelected = selectedChildId === id;
            if (!item) return null;

            return (
              <button
                key={id}
                onClick={() => onSelectChild(id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-white text-purple-700 font-black' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
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

      {/* Focus Enfant Sélectionné Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-xl flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            {enfant.photo_initiales}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {enfant.prenom} {enfant.nom}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                {enfant.classe}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <span>Matricule: #{enfant.matricule}</span>
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
            className="text-xs font-semibold gap-2 px-3.5 py-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
          >
            <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Voir le Bulletin
          </Button>
          {enfant.reste_a_payer > 0 && (
            <Button
              size="sm"
              onClick={() => onNavigateTab('parent_paiements')}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-2 px-3.5 py-2 shadow-xs"
            >
              <CreditCard className="h-4 w-4" />
              Régler ({formatMRU(enfant.reste_a_payer)})
            </Button>
          )}
        </div>
      </div>

      {/* 3 Pastel KPI Cards (Nexoov Style with Purple Accent) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Frais de Scolarité"
          amount={enfant.reste_a_payer}
          unit="MRU"
          subtitle={
            enfant.reste_a_payer === 0
              ? `Compte à jour (${formatMRU(enfant.total_regle)} réglés)`
              : `Échéance de ${formatMRU(enfant.prochaine_echeance_montant)} attendue`
          }
          icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant={enfant.reste_a_payer === 0 ? 'success' : 'purple'}
          onClick={() => onNavigateTab('parent_paiements')}
        />

        <KpiCard
          title="Résultats Trimestre 2"
          customValue={`${enfant.moyenne_generale.toFixed(1)} / 20`}
          subtitle={`Rang : ${enfant.rang} • Tableau d'Honneur`}
          icon={<Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant="purple"
          onClick={() => onNavigateTab('parent_pedagogie')}
        />

        <KpiCard
          title="Assiduité & Présence"
          customValue="Présent aujourd'hui"
          subtitle={`${enfant.nb_absences_total} absence(s), ${enfant.nb_retards_total} retard(s)`}
          icon={<CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
          onClick={() => onNavigateTab('parent_assiduite')}
        />
      </div>

      {/* 2 Colonnes : Emploi du temps du jour & Notes récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emploi du Temps du Jour */}
        <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
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
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold font-mono">
                    {cours.heure}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{cours.matiere}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{cours.professeur}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {cours.salle}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Dernières Évaluations & Notes */}
        <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dernières Notes Reçues
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('parent_pedagogie')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Tout voir
            </button>
          </div>

          <div className="space-y-3">
            {enfant.bulletin.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{item.matiere}</div>
                  <div className="text-xs text-slate-400">
                    Coef. {item.coefficient} • {item.professeur}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-0.5 line-clamp-1">
                    « {item.appreciation} »
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
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
      <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <School className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ecole.nom} • Secrétariat</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ouvert du Lundi au Vendredi de 08:00 à 17:00 (Tevragh-Zeina)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${ecole.telephone}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            {ecole.telephone}
          </a>
          <button
            onClick={() => onNavigateTab('parent_assiduite')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            Déclarer Absence
          </button>
        </div>
      </Card>
    </div>
  );
};
