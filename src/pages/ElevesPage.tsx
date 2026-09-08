import React from 'react';
import { Card } from '../components/ui/Card';
import { Users, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ElevesPage: React.FC = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestion des Élèves
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Répertoire complet des élèves inscrits et gestion des dossiers.
          </p>
        </div>
        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Inscrire un Élève
        </Button>
      </div>

      <Card className="p-12 text-center border-dashed">
        <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Module Gestion des Élèves (V1 MVP)
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
          Ce module permet la création, la recherche et l'édition des fiches élèves et tuteurs.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          Statut : En cours de finalisation
        </div>
      </Card>
    </div>
  );
};
