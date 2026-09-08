import React from 'react';
import { Card } from '../components/ui/Card';
import { Send } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const RelancesPage: React.FC = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Relances Impayés
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Envoi automatisé et historique des rappels SMS / WhatsApp aux tuteurs.
          </p>
        </div>
        <Button variant="danger" size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          Lancer Campagne SMS
        </Button>
      </div>

      <Card className="p-12 text-center border-dashed">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Send className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Module de Relance Automatisée
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
          Historique des SMS de relance expédiés aux tuteurs d'élèves en retard de paiement.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          Statut : En cours de finalisation
        </div>
      </Card>
    </div>
  );
};
