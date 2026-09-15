import React from 'react';
import { GraduationCap } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/DataState';
import { useEnfantSelectionne } from './useEnfantSelectionne';

interface ParentPedagogiePageProps {
  selectedChildId: string;
}

/**
 * Les notes et bulletins ne sont pas encore en base (V2) : l'écran l'indique
 * au lieu d'afficher un bulletin fictif.
 */
export const ParentPedagogiePage: React.FC<ParentPedagogiePageProps> = ({ selectedChildId }) => {
  const { enfant, isLoading, error, refetch } = useEnfantSelectionne(selectedChildId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Bulletin de Notes{enfant ? ` — ${enfant.prenom} ${enfant.nom}` : ''}
        </h1>
        {enfant?.classe && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Classe de {enfant.classe}</p>}
      </div>

      <EmptyState
        comingSoon
        icon={<GraduationCap className="h-5 w-5" />}
        title="Notes et bulletins"
        description="Les résultats scolaires seront consultables ici dès que les enseignants pourront saisir les évaluations dans EcoSurv."
      />
    </div>
  );
};
