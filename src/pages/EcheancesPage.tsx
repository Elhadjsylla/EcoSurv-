import React from 'react';
import { Card } from '../components/ui/Card';
import { CreditCard, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EcheancesPage: React.FC = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Échéances & Tarifs
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Définition des tranches de paiement et suivi des échéanciers.
          </p>
        </div>
        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Échéance
        </Button>
      </div>

      <Card className="p-12 text-center border-dashed">
        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Module Échéances & Tarifs
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
          Configuration des frais d'inscription et des mensualités par niveau d'étude.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          Statut : En cours de finalisation
        </div>
      </Card>
    </div>
  );
};
