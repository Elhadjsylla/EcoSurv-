import React, { useState, useMemo } from 'react';
import { MOCK_ELEVES, EleveWithStats } from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { formatMRU } from '../../lib/utils';
import {
  AlertCircle,
  Search,
  CreditCard,
  Phone,
  Filter,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CaissierImpayesPageProps {
  onGoToGuichetWithEleve: (eleveId: string) => void;
}

export const CaissierImpayesPage: React.FC<CaissierImpayesPageProps> = ({
  onGoToGuichetWithEleve,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_retard' | 'partiel'>('all');

  // Filtrer uniquement les élèves qui ont un reste à payer
  const elevesAvecReste = useMemo(() => {
    return MOCK_ELEVES.filter((e) => e.remaining > 0);
  }, []);

  const classesList = useMemo(() => {
    const set = new Set(MOCK_ELEVES.map((e) => e.classe));
    return Array.from(set).sort();
  }, []);

  // Total des arriérés
  const totalArrieres = useMemo(() => {
    return elevesAvecReste.reduce((acc, e) => acc + e.remaining, 0);
  }, [elevesAvecReste]);

  const nbRetards = useMemo(() => {
    return elevesAvecReste.filter((e) => e.statut === 'en_retard').length;
  }, [elevesAvecReste]);

  // Filtrage combiné
  const filteredEleves = useMemo(() => {
    return elevesAvecReste.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.telephone_tuteur.includes(q) ||
        e.nom_tuteur.toLowerCase().includes(q);

      const matchesClasse =
        selectedClasse === 'all' || e.classe === selectedClasse;

      const matchesStatus =
        statusFilter === 'all' || e.statut === statusFilter;

      return matchesSearch && matchesClasse && matchesStatus;
    });
  }, [elevesAvecReste, searchQuery, selectedClasse, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Recouvrement Guichet
            </span>
            <span className="text-xs text-slate-500">• Consultation des Soldes Dûs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relevé des Impayés & Arriérés
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Recherchez un parent ou élève au guichet pour identifier immédiatement le solde restant dû et encaisser en un clic.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total des Arriérés Dûs</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {formatMRU(totalArrieres)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Sur l'ensemble des {elevesAvecReste.length} élèves débiteurs
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Élèves en Retard Critique</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {nbRetards} élèves
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Échéance échue dépassée sans versement
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Guichet d'Accueil</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-sm font-semibold text-slate-800 mt-1">
            Orientation Immédiate
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Cliquez sur "Encaisser" pour charger le dossier au guichet de paiement
          </div>
        </Card>
      </div>

      {/* Table & Filters */}
      <Card className="p-5 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Recherche par élève, tuteur, n° téléphone (+222...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Toutes les classes</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'en_retard' | 'partiel')
              }
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_retard">En retard uniquement</option>
              <option value="partiel">Paiement partiel</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4">Contact Tuteur</th>
                <th className="py-3 px-4 text-right">Déjà Réglé</th>
                <th className="py-3 px-4 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Action Guichet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEleves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Aucun élève trouvé avec des arriérés pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredEleves.map((e: EleveWithStats) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <StudentInitials
                          nom={e.nom}
                          prenom={e.prenom}
                          size="sm"
                          className="bg-amber-100 text-amber-800"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {e.nom} {e.prenom}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {e.matricule}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 text-xs">
                      {e.classe}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 text-xs font-medium">
                        {e.nom_tuteur} ({e.lien_parente})
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {e.telephone_tuteur}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 text-xs">
                      {formatMRU(e.total_paid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 text-sm">
                      {formatMRU(e.remaining)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {e.statut === 'en_retard' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="h-3 w-3" /> En retard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3" /> Partiel
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="sm"
                        onClick={() => onGoToGuichetWithEleve(e.id)}
                        className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Encaisser
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
