import React, { useState, useMemo } from 'react';
import {
  CaisseTransaction,
  MOCK_CAISSE_TRANSACTIONS_INITIAL,
  CURRENT_CAISSIER,
  MethodePaiement,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { formatMRU } from '../../lib/utils';
import {
  History,
  Search,
  Printer,
  Receipt,
  Download,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  X,
  Lock,
  Building,
} from 'lucide-react';

export const CaissierJournalPage: React.FC = () => {
  const [transactions] = useState<CaisseTransaction[]>(MOCK_CAISSE_TRANSACTIONS_INITIAL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<CaisseTransaction | null>(null);
  const [clotureDone, setClotureDone] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Totaux du journal
  const totalGeneral = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + tx.montant, 0);
  }, [transactions]);

  const totalEspeces = useMemo(() => {
    return transactions
      .filter((tx) => tx.methode === 'especes')
      .reduce((acc, tx) => acc + tx.montant, 0);
  }, [transactions]);

  const totalMobile = useMemo(() => {
    return transactions
      .filter((tx) => ['bankily', 'masrvi', 'sedad'].includes(tx.methode))
      .reduce((acc, tx) => acc + tx.montant, 0);
  }, [transactions]);

  // Filtrage
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.recu_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.eleve_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.eleve_prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.matricule.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod =
        selectedMethod === 'all' || tx.methode === selectedMethod;

      return matchesSearch && matchesMethod;
    });
  }, [transactions, searchQuery, selectedMethod]);

  const handleCloture = () => {
    setClotureDone(true);
    setActiveToast({
      message: `Clôture de caisse du ${new Date().toLocaleDateString('fr-FR')} effectuée avec succès (${formatMRU(totalGeneral)} certifiés).`,
      type: 'success',
    });
  };

  const getMethodBadge = (m: MethodePaiement) => {
    switch (m) {
      case 'especes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="h-3 w-3" /> Espèces
          </span>
        );
      case 'bankily':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Smartphone className="h-3 w-3" /> Bankily
          </span>
        );
      case 'masrvi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="h-3 w-3" /> Masrvi
          </span>
        );
      case 'sedad':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Smartphone className="h-3 w-3" /> Sedad
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <CreditCard className="h-3 w-3" /> Autre
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <ToastNotification
            message={activeToast.message}
            type={activeToast.type}
            onClose={() => setActiveToast(null)}
          />
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Audit & Traçabilité
            </span>
            <span className="text-xs text-slate-500">• Journal des Encaissements</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Journal de Caisse
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historique complet des quittances émises au {CURRENT_CAISSIER.guichet} par{' '}
            <span className="font-semibold text-slate-700">
              {CURRENT_CAISSIER.prenom} {CURRENT_CAISSIER.nom}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveToast({
                message: 'Export CSV du journal de caisse généré avec succès.',
                type: 'info',
              });
            }}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>

          <Button
            size="sm"
            disabled={clotureDone}
            onClick={handleCloture}
            className={`flex items-center gap-1.5 font-semibold ${
              clotureDone
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {clotureDone ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Caisse Clôturée
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Clôturer la Caisse
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Encaissé (Session)</span>
            <History className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatMRU(totalGeneral)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {transactions.length} quittances validées
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Espèces en Tiroir</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {formatMRU(totalEspeces)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            À vérifier lors du comptage physique
          </div>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Paiements Mobiles (Bankily / Masrvi)</span>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {formatMRU(totalMobile)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Confirmés via API bancaire & SMS
          </div>
        </Card>
      </div>

      {/* Table & Filters */}
      <Card className="p-5 border-slate-200 shadow-sm">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par reçu (REC-...), élève, matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Mode :</span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Tous les modes</option>
              <option value="especes">Espèces uniquement</option>
              <option value="bankily">Bankily</option>
              <option value="masrvi">Masrvi</option>
              <option value="sedad">Sedad</option>
            </select>
          </div>
        </div>

        {/* Tableau des transactions */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Heure / Date</th>
                <th className="py-3 px-4">N° Quittance</th>
                <th className="py-3 px-4">Élève & Classe</th>
                <th className="py-3 px-4">Échéance Réglée</th>
                <th className="py-3 px-4">Mode Règlement</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Aucune transaction ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs">{tx.heure}</div>
                      <div className="text-[11px] text-slate-400">{tx.date}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700 text-xs">
                      {tx.recu_ref}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {tx.eleve_nom} {tx.eleve_prenom}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {tx.matricule} • {tx.classe}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">
                      {tx.echeance_libelle}
                    </td>
                    <td className="py-3.5 px-4">{getMethodBadge(tx.methode)}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {formatMRU(tx.montant)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReceipt(tx)}
                        className="h-8 px-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 gap-1 text-xs"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Reçu
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Réimpression Reçu */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-sm">Duplicata Quittance Officielle</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="flex items-center justify-center gap-1 text-slate-900 font-extrabold text-base">
                  <Building className="h-4 w-4 text-amber-600" />
                  COMPLEXE SCOLAIRE EL MAARIFA
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Tevragh-Zeina • Nouakchott, Mauritanie
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-amber-50 text-amber-800 font-mono font-bold text-xs rounded border border-amber-200">
                  {selectedReceipt.recu_ref}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">ÉLÈVE</span>
                  <span className="font-bold text-slate-800">
                    {selectedReceipt.eleve_nom} {selectedReceipt.eleve_prenom}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MATRICULE</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedReceipt.matricule}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CLASSE</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.classe}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DATE & HEURE</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.date} à {selectedReceipt.heure}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Objet :</span>
                  <span className="font-semibold">{selectedReceipt.echeance_libelle}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Mode :</span>
                  <span className="font-semibold capitalize">
                    {selectedReceipt.methode}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">TOTAL ENCAISSÉ :</span>
                  <span className="font-extrabold text-base text-amber-700 font-mono">
                    {formatMRU(selectedReceipt.montant)}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2">
                Encaissé par {selectedReceipt.encaisse_par} • Guichet Central N°1
                <br />
                Ce document certifie la libération de l'échéance susmentionnée.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReceipt(null)}
              >
                Fermer
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                  setSelectedReceipt(null);
                }}
                className="bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
