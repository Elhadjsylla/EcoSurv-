import { useEcoleStore } from '../../store/useEcoleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentChildren } from '../../hooks/useParentChildren';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/ui/KpiCard';
import { formatMRU } from '../../lib/utils';
import {
  CreditCard,
  GraduationCap,
  CalendarCheck,
  Clock,
  Calendar,
  School,
  Phone,
  Users,
  AlertCircle,
  RefreshCw,
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
  const authEcole = useAuthStore((s) => s.ecole);
  const authProfile = useAuthStore((s) => s.profile);
  const ecoleNom = authEcole?.nom || ecole.nom;

  const parentName = authProfile
    ? `${authProfile.prenom} ${authProfile.nom}`
    : 'Parent';

  const {
    children: parentChildren,
    activeChild,
    isLoading: isChildrenLoading,
    errorMessage: childrenError,
    refresh: refreshChildren,
  } = useParentChildren(selectedChildId, onSelectChild);

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              Espace Tuteur Légal
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• {ecoleNom}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bonjour, {parentName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl">
            Retrouvez la situation académique, l'assiduité en temps réel et le règlement des frais scolaires pour vos enfants inscrits.
          </p>
        </div>

        {/* Sélecteur rapide d'enfant pour Mobile / Tablette */}
        <div className="flex flex-wrap gap-2.5 pt-2 md:pt-0 shrink-0">
          {parentChildren.map((item) => {
            const isSelected = activeChild?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectChild(item.id)}
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

      {/* État d'erreur SQL / RLS / Réseau vs État vide légitime (0 enfant) vs Enfant sélectionné */}
      {childrenError ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xs text-center space-y-4 max-w-xl mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Impossible de charger les données
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {childrenError}
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChildren}
              disabled={isChildrenLoading}
              className="gap-2 border-slate-300 dark:border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isChildrenLoading ? 'animate-spin' : ''}`} />
              <span>Réessayer</span>
            </Button>
          </div>
        </div>
      ) : !activeChild ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xs text-center space-y-4 max-w-xl mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Aucun élève rattaché pour le moment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Votre espace famille est actif. Les informations scolaires et le règlement des frais de vos enfants apparaîtront automatiquement dès que l'école aura finalisé votre rattachement.
          </p>
        </div>
      ) : (
        <>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-xl flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
              {activeChild.photo_initiales}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeChild.prenom} {activeChild.nom}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  {activeChild.classe}
                </span>
              </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <span>Matricule: #{activeChild.matricule}</span>
              <span>•</span>
              <span>Lien: {activeChild.lien}</span>
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
          {activeChild.remaining > 0 && (
            <Button
              size="sm"
              onClick={() => onNavigateTab('parent_paiements')}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-2 px-3.5 py-2 shadow-xs"
            >
              <CreditCard className="h-4 w-4" />
              Régler ({formatMRU(activeChild.remaining)})
            </Button>
          )}
        </div>
      </div>

      {/* 3 Pastel KPI Cards (Nexoov Style with Purple Accent) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Frais de Scolarité"
          amount={activeChild.remaining}
          unit="MRU"
          subtitle={
            activeChild.remaining === 0
              ? `Compte à jour (${formatMRU(activeChild.total_paid)} réglés)`
              : `Total scolarité : ${formatMRU(activeChild.total_due)}`
          }
          icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant={activeChild.remaining === 0 ? 'success' : 'purple'}
          onClick={() => onNavigateTab('parent_paiements')}
        />

        <KpiCard
          title="Résultats Scolaires"
          customValue="En attente"
          subtitle="Bulletins en cours de saisie"
          icon={<GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant="purple"
          onClick={() => onNavigateTab('parent_pedagogie')}
        />

        <KpiCard
          title="Assiduité & Présence"
          customValue="Suivi régulier"
          subtitle="Consultez le relevé d'assiduité"
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
                Emploi du Temps
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="py-8 text-center">
            <p className="text-xs text-slate-400 italic">Aucun cours programmé aujourd'hui</p>
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

          <div className="py-8 text-center">
            <p className="text-xs text-slate-400 italic">Aucune note enregistrée ce trimestre</p>
          </div>
        </Card>
      </div>
      </>
      )}

      {/* Contacts de l'Établissement */}
      <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <School className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ecoleNom} • Secrétariat</h4>
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
