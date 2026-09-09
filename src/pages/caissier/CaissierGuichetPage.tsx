import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CURRENT_CAISSIER,
  MOCK_ELEVES,
  EleveWithStats,
  MethodePaiement,
  CaisseTransaction,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { formatMRU } from '../../lib/utils';
import {
  CreditCard,
  Search,
  Printer,
  Receipt,
  Building,
  Check,
  User,
  X,
  Zap,
} from 'lucide-react';

interface CaissierGuichetPageProps {
  preselectedEleveId?: string;
}

export const CaissierGuichetPage: React.FC<CaissierGuichetPageProps> = ({
  preselectedEleveId,
}) => {
  const [elevesList, setElevesList] = useState<EleveWithStats[]>(MOCK_ELEVES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEleveId, setSelectedEleveId] = useState<string>(
    preselectedEleveId || ''
  );

  // Formulaire d'encaissement
  const [montant, setMontant] = useState<number>(15000);
  const [methode, setMethode] = useState<MethodePaiement>('especes');
  const [libelle, setLibelle] = useState<string>('Mensualité Mars 2026');
  const [referenceOperateur, setReferenceOperateur] = useState<string>('');

  // Reçu émis et modal
  const [printedReceipt, setPrintedReceipt] = useState<CaisseTransaction | null>(null);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Élève sélectionné
  const selectedEleve = useMemo(() => {
    return elevesList.find((e) => e.id === selectedEleveId) || null;
  }, [elevesList, selectedEleveId]);

  // Quand un élève est sélectionné, préremplir le montant avec son reste dû (ou tranche standard)
  React.useEffect(() => {
    if (selectedEleve) {
      const suggestedAmount =
        selectedEleve.remaining > 0
          ? Math.min(selectedEleve.remaining, selectedEleve.prochaine_echeance_montant || 15000)
          : 15000;
      setMontant(suggestedAmount);
    }
  }, [selectedEleve]);

  // Filtrage des élèves pour la recherche
  const searchedEleves = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return elevesList.filter((e) => {
      const q = searchQuery.toLowerCase();
      return (
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.nom_tuteur.toLowerCase().includes(q)
      );
    });
  }, [elevesList, searchQuery]);

  // Célébration discrète par confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.72 },
        colors: ['#10b981', '#f59e0b', '#3b82f6'],
        disableForReducedMotion: true,
        ticks: 120,
      });
    } catch {
      // Ignorer
    }
  };

  // Traiter l'encaissement au guichet
  const handleProcessPayment = () => {
    if (!selectedEleve) {
      setActiveToast({ message: 'Veuillez rechercher et sélectionner un élève.', type: 'warning' });
      return;
    }
    if (montant <= 0) {
      setActiveToast({ message: 'Veuillez saisir un montant supérieur à 0 MRU.', type: 'warning' });
      return;
    }

    const recuRef = `REC-NKTT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx: CaisseTransaction = {
      id: `cais-tx-${Date.now()}`,
      eleve_id: selectedEleve.id,
      eleve_nom: selectedEleve.nom,
      eleve_prenom: selectedEleve.prenom,
      matricule: selectedEleve.matricule,
      classe: selectedEleve.classe,
      echeance_libelle: libelle,
      montant,
      date: dateStr,
      heure: heureStr,
      methode,
      recu_ref: recuRef,
      encaisse_par: `${CURRENT_CAISSIER.prenom} ${CURRENT_CAISSIER.nom}`,
      statut: 'confirme',
    };

    // Mettre à jour l'élève localement
    setElevesList((prev) =>
      prev.map((e) => {
        if (e.id === selectedEleve.id) {
          const newPaid = e.total_paid + montant;
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
                libelle,
                montant,
                date: now.toLocaleDateString('fr-FR'),
                methode,
                statut: 'regle',
                recu_ref: recuRef,
              },
              ...e.timeline_paiements,
            ],
          };
        }
        return e;
      })
    );

    triggerConfetti();
    setPrintedReceipt(newTx);
    setActiveToast({
      message: `Encaissement de ${formatMRU(montant)} validé pour ${selectedEleve.prenom} ${selectedEleve.nom} ! Reçu #${recuRef}`,
      type: 'success',
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-stagger-rise relative">
      {/* Toast Notification */}
      {activeToast && (
        <ToastNotification
          message={activeToast.message}
          type={activeToast.type}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Guichet d'Encaissement & Paiements
            </h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
              {CURRENT_CAISSIER.guichet}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Enregistrez les versements des parents d'élèves en espèces ou mobile banking et délivrez instantanément un reçu numéroté.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Opérateur :</span>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-amber-600" />
            {CURRENT_CAISSIER.prenom} {CURRENT_CAISSIER.nom}
          </span>
        </div>
      </div>

      {/* Main Grid: Search & Selection (Left) vs Payment Terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (5 cols): Student Search & Identification */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-600" />
              1. Identifier l'Élève au Guichet
            </h2>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, matricule ou tuteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Quick search results dropdown */}
            {searchQuery.trim() && (
              <div className="space-y-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-1.5">
                {searchedEleves.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 font-medium">
                    Aucun élève trouvé pour cette recherche.
                  </div>
                ) : (
                  searchedEleves.map((el) => (
                    <div
                      key={el.id}
                      onClick={() => {
                        setSelectedEleveId(el.id);
                        setSearchQuery('');
                      }}
                      className="p-2.5 rounded-lg hover:bg-white hover:shadow-2xs cursor-pointer transition-all flex items-center justify-between border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {el.prenom} {el.nom}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {el.matricule} • {el.classe}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 block">Reste dû</span>
                        <span className="text-xs font-extrabold font-mono text-red-600">
                          {formatMRU(el.remaining)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Student Card */}
            {selectedEleve ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3 animate-scale-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StudentInitials
                      nom={selectedEleve.nom}
                      prenom={selectedEleve.prenom}
                      size="md"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {selectedEleve.prenom} {selectedEleve.nom}
                      </h3>
                      <p className="text-xs text-amber-800 font-mono font-bold">
                        {selectedEleve.matricule} • Classe : {selectedEleve.classe}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedEleveId('')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white"
                    title="Changer d'élève"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Tuteur Légal :</span>
                    <span className="font-semibold text-slate-800">{selectedEleve.nom_tuteur}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Téléphone :</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedEleve.telephone_tuteur}
                    </span>
                  </div>
                </div>

                {/* Financial Summary Bento */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-center">
                  <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Total Déjà Payé
                    </span>
                    <span className="text-sm font-extrabold font-mono text-emerald-700">
                      {formatMRU(selectedEleve.total_paid)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Reste à Recouvrer
                    </span>
                    <span className="text-sm font-extrabold font-mono text-red-600">
                      {formatMRU(selectedEleve.remaining)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
                <User className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Aucun élève sélectionné</p>
                <p className="text-[11px] text-slate-500">
                  Recherchez un élève par nom ou matricule ci-dessus pour charger son dossier comptable.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col (7 cols): Payment Terminal Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="h-4 w-4 text-amber-600" />
              2. Enregistrement du Règlement au Comptoir
            </h2>

            <div className="space-y-4 text-xs">
              {/* Montant à encaisser */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Montant à Encaisser (MRU) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={montant}
                    onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 pl-4 pr-16 text-xl font-extrabold font-mono text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  />
                  <span className="absolute right-4 top-3 text-sm font-bold font-mono text-slate-400">
                    MRU
                  </span>
                </div>
              </div>

              {/* Libellé / Échéance */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Motif / Échéance concernée *
                </label>
                <input
                  type="text"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="Ex: Mensualité Février 2026, Inscription, Acompte..."
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Mode de règlement */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">
                  Mode de Règlement *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'especes', label: 'Espèces (Comptant)' },
                    { id: 'bankily', label: 'Bankily (BP)' },
                    { id: 'masrvi', label: 'Masrvi (BPM)' },
                    { id: 'sedad', label: 'Sedad (BMCI)' },
                    { id: 'virement', label: 'Virement Bancaire' },
                    { id: 'cheque', label: 'Chèque' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethode(m.id as MethodePaiement)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                        methode === m.id
                          ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{m.label}</span>
                      {methode === m.id && <Check className="h-4 w-4 text-amber-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Référence de transaction pour mobile money ou chèque */}
              {methode !== 'especes' && (
                <div className="animate-scale-in">
                  <label className="font-bold text-slate-700 block mb-1">
                    Référence de Transaction / N° Chèque (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={referenceOperateur}
                    onChange={(e) => setReferenceOperateur(e.target.value)}
                    placeholder="Ex: TX-992144, N° Chèque 004812..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              )}
            </div>

            {/* Process Button */}
            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center gap-2 bg-amber-600 hover:bg-amber-700 font-bold text-sm shadow-sm py-3"
                disabled={!selectedEleve}
                onClick={handleProcessPayment}
              >
                <Zap className="h-4 w-4 fill-white" />
                Valider l'Encaissement ({formatMRU(montant)}) & Générer Reçu
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Reçu de Caisse Officiel Imprimable */}
      {printedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-6 animate-scale-in">
            {/* Header Reçu */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-extrabold text-slate-900">
                    Reçu Officiel d'Encaissement
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Réf. {printedReceipt.recu_ref}
                </p>
              </div>

              <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 text-xs">
                Payé & Confirmé
              </span>
            </div>

            {/* Corps du Reçu */}
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Élève :</span>
                  <span className="font-bold text-slate-900">
                    {printedReceipt.eleve_prenom} {printedReceipt.eleve_nom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Matricule & Classe :</span>
                  <span className="font-mono font-bold text-slate-800">
                    {printedReceipt.matricule} • {printedReceipt.classe}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Motif :</span>
                  <span className="font-semibold text-slate-900">
                    {printedReceipt.echeance_libelle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode de règlement :</span>
                  <span className="font-bold uppercase text-amber-800">
                    {printedReceipt.methode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Heure :</span>
                  <span className="font-mono text-slate-700">
                    {printedReceipt.date} à {printedReceipt.heure}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Caissier :</span>
                  <span className="font-semibold text-slate-800">
                    {printedReceipt.encaisse_par}
                  </span>
                </div>
              </div>

              {/* Montant Mis en Avant */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Montant Encaissé
                </span>
                <span className="text-3xl font-extrabold font-mono text-emerald-700 mt-1 block">
                  {formatMRU(printedReceipt.montant)}
                </span>
              </div>
            </div>

            {/* Actions Reçu */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setPrintedReceipt(null)}
              >
                Fermer
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="gap-2 bg-amber-600 hover:bg-amber-700"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="h-4 w-4" />
                Imprimer le Reçu (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
