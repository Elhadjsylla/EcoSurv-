import React, { useState, useMemo } from 'react';
import {
  MOCK_ELEVES,
  EleveWithStats,
  getDashboardKpis,
} from '../lib/mockData';
import { StudentInitials } from '../components/ui/StudentInitials';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatMRU } from '../lib/utils';
import { StudentEnrollmentModal } from '../components/eleves/StudentEnrollmentModal';
import { StudentDetailPanel } from '../components/eleves/StudentDetailPanel';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ArrowUpDown,
  CheckCircle,
  X,
  PlusCircle,
} from 'lucide-react';

export const ElevesPage: React.FC = () => {
  const [elevesList, setElevesList] = useState<EleveWithStats[]>(MOCK_ELEVES);
  const [selectedEleveId, setSelectedEleveId] = useState<string>(MOCK_ELEVES[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'solde'>('nom');

  // Modales
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [paymentModalEleve, setPaymentModalEleve] = useState<EleveWithStats | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // KPIs
  const kpis = useMemo(() => getDashboardKpis(elevesList), [elevesList]);

  // Classes disponibles
  const classesList = useMemo(() => {
    const set = new Set(elevesList.map((e) => e.classe));
    return Array.from(set);
  }, [elevesList]);

  // Filtrage et Tri
  const filteredEleves = useMemo(() => {
    let result = elevesList.filter((e) => {
      const matchQuery =
        e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.nom_tuteur.toLowerCase().includes(searchQuery.toLowerCase());

      const matchClasse = selectedClasse === 'all' || e.classe === selectedClasse;
      const matchStatut = selectedStatut === 'all' || e.statut === selectedStatut;

      return matchQuery && matchClasse && matchStatut;
    });

    if (sortBy === 'nom') {
      result = [...result].sort((a, b) => a.nom.localeCompare(b.nom));
    } else if (sortBy === 'matricule') {
      result = [...result].sort((a, b) => a.matricule.localeCompare(b.matricule));
    } else if (sortBy === 'solde') {
      result = [...result].sort((a, b) => b.remaining - a.remaining);
    }

    return result;
  }, [elevesList, searchQuery, selectedClasse, selectedStatut, sortBy]);

  // Élève sélectionné pour le panneau de droite
  const selectedEleve = useMemo(() => {
    return elevesList.find((e) => e.id === selectedEleveId) || filteredEleves[0] || null;
  }, [elevesList, selectedEleveId, filteredEleves]);

  // Inscription d'un nouvel élève
  const handleEnrollStudent = (newEleve: EleveWithStats) => {
    setElevesList((prev) => [newEleve, ...prev]);
    setSelectedEleveId(newEleve.id);
    showToast(`Élève ${newEleve.prenom} ${newEleve.nom} inscrit avec succès !`);
  };

  // Encaissement fictif au guichet caissier
  const handleConfirmPayment = (amount: number, methode: string) => {
    if (!paymentModalEleve) return;

    setElevesList((prev) =>
      prev.map((e) => {
        if (e.id === paymentModalEleve.id) {
          const newPaid = e.total_paid + amount;
          const newRemaining = Math.max(0, e.total_due - newPaid);
          const newStatut =
            newRemaining === 0
              ? 'paye'
              : newPaid > 0
              ? 'partiel'
              : 'en_retard';

          return {
            ...e,
            total_paid: newPaid,
            remaining: newRemaining,
            statut: newStatut,
            timeline_paiements: [
              {
                id: `pay-${Date.now()}`,
                libelle: 'Encaissement Guichet',
                montant: amount,
                date: new Date().toLocaleDateString('fr-FR'),
                methode: methode as any,
                statut: 'regle',
                recu_ref: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
              },
              ...e.timeline_paiements,
            ],
          };
        }
        return e;
      })
    );

    showToast(
      `Paiement de ${formatMRU(amount)} enregistré pour ${paymentModalEleve.prenom} ${paymentModalEleve.nom}`
    );
    setPaymentModalEleve(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Institutional Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestion des Élèves & Scolarités
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              Année 2025–2026
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Registre académique centralisé, facturation mensuelle et suivi des recouvrements en Ouguiya (MRU).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Import Excel/CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setIsEnrollModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            + Inscrire un nouvel élève
          </Button>
        </div>
      </div>

      {/* Metric Quick Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Effectif Total
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {kpis.nombreEleves}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" /> 100% enregistrés
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Élèves En Règle
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              {kpis.nombrePaye + kpis.nombreAJour}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Scolarité solde ou à jour
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Échéances en Retard
            </span>
            <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
              {kpis.nombreEnRetard}
            </div>
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">
              {formatMRU(kpis.totalImpayes)} total impayé
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recouvrement Global
            </span>
            <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
              {kpis.tauxRecouvrement}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              {formatMRU(kpis.totalEncaisse)} encaissés
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filtration & Control Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom d'élève, matricule (#DEMO-...) ou tuteur légal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Toutes les classes ({classesList.length})</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Tous statuts financiers</option>
                <option value="paye">Réglé (Payé)</option>
                <option value="en_retard">En retard</option>
                <option value="partiel">Partiel</option>
                <option value="a_jour">À jour</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="nom">Trier par Nom (A-Z)</option>
                <option value="matricule">Trier par Matricule</option>
                <option value="solde">Trier par Solde Dû</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Primary Split Architecture: 65% Roster Table / 35% Detailed Ledger Dossier */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Wing (65% -> 8 cols on XL) */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-900">
              {filteredEleves.length} élève(s) affiché(s)
            </span>
            <span className="text-slate-500 font-medium">
              Cliquez sur une ligne pour afficher son dossier complet.
            </span>
          </div>

          {/* Tabular Roster */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Matricule</th>
                  <th className="py-3 px-4">Élève</th>
                  <th className="py-3 px-4">Classe</th>
                  <th className="py-3 px-4">Tuteur Légal</th>
                  <th className="py-3 px-4 text-right">Solde Dû</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEleves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                      Aucun élève ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredEleves.map((eleve) => {
                    const isSelected = eleve.id === selectedEleve?.id;
                    return (
                      <tr
                        key={eleve.id}
                        onClick={() => setSelectedEleveId(eleve.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/90 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Matricule */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {eleve.matricule}
                        </td>

                        {/* Élève */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <StudentInitials nom={eleve.nom} prenom={eleve.prenom} size="sm" />
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {eleve.prenom} {eleve.nom}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Né le {eleve.date_naissance} • {eleve.sexe}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Classe */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {eleve.classe}
                          </span>
                        </td>

                        {/* Tuteur */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{eleve.nom_tuteur}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {eleve.telephone_tuteur}
                          </div>
                        </td>

                        {/* Solde Dû */}
                        <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                          {eleve.remaining > 0 ? (
                            <span className="text-red-700">{formatMRU(eleve.remaining)}</span>
                          ) : (
                            <span className="text-emerald-700">0 MRU</span>
                          )}
                        </td>

                        {/* Statut Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <StatusBadge statut={eleve.statut} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Wing: Dossier de l'élève sélectionné (35% -> 4 cols on XL) */}
        <div className="xl:col-span-4">
          <StudentDetailPanel
            eleve={selectedEleve}
            onPaymentTrigger={(el) => setPaymentModalEleve(el)}
            onRelanceTrigger={(el) =>
              showToast(`Rappel SMS/WhatsApp envoyé au tuteur de ${el.prenom} ${el.nom}`)
            }
          />
        </div>
      </div>

      {/* Modale d'Inscription Élève */}
      <StudentEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollStudent}
        classesList={classesList}
      />

      {/* Modale d'Encaissement Fictif */}
      {paymentModalEleve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
                Encaisser un paiement
              </h3>
              <button
                onClick={() => setPaymentModalEleve(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-900">
                Élève: {paymentModalEleve.prenom} {paymentModalEleve.nom}
              </p>
              <p className="text-slate-500 font-mono">
                Reste à payer actuel: {formatMRU(paymentModalEleve.remaining)}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant encaisse (MRU)
                </label>
                <input
                  type="number"
                  defaultValue={Math.min(15000, paymentModalEleve.remaining || 15000)}
                  id="payAmountInput"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mode de règlement
                </label>
                <select
                  id="payMethodInput"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="bankily">Bankily (Mobile Money)</option>
                  <option value="especes">Espèces (Guichet)</option>
                  <option value="masrvi">Masrvi</option>
                  <option value="sedad">Sedad</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalEleve(null)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const inputAmt = (
                    document.getElementById('payAmountInput') as HTMLInputElement
                  )?.value;
                  const inputMeth = (
                    document.getElementById('payMethodInput') as HTMLSelectElement
                  )?.value;
                  handleConfirmPayment(Number(inputAmt) || 15000, inputMeth || 'bankily');
                }}
              >
                Confirmer l'Encaissement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
