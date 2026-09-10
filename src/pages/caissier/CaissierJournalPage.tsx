import React, { useState, useMemo, useEffect } from 'react';
import {
  CaisseTransaction,
  MOCK_CAISSE_TRANSACTIONS_INITIAL,
  CURRENT_CAISSIER,
  MethodePaiement,
} from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { Select } from '../../components/ui/Select';
import { KpiCard } from '../../components/ui/KpiCard';
import { StudentInitials } from '../../components/ui/StudentInitials';
import { formatMRU } from '../../lib/utils';
import {
  Search,
  Printer,
  Receipt,
  ArrowDownToLine,
  Filter,
  Banknote,
  Smartphone,
  CheckCircle2,
  X,
  Lock,
  Building,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
} from 'lucide-react';

export const CaissierJournalPage: React.FC = () => {
  const [transactions] = useState<CaisseTransaction[]>(MOCK_CAISSE_TRANSACTIONS_INITIAL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<CaisseTransaction | null>(null);
  const [clotureDone, setClotureDone] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fermer le menu contextuel si clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.journal-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      .filter((tx) => ['bankily', 'masrvi'].includes(tx.methode))
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

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Espèces
          </span>
        );
      case 'bankily':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Bankily (BPM)
          </span>
        );
      case 'masrvi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Masrvi (BMCI)
          </span>
        );
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Chèque
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Autre
          </span>
        );
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Audit & Traçabilité
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Journal des Encaissements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Journal de Caisse
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historique complet des quittances émises au {CURRENT_CAISSIER.guichet} par{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {CURRENT_CAISSIER.prenom} {CURRENT_CAISSIER.nom}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveToast({
                message: 'Export CSV du journal de caisse généré avec succès.',
                type: 'info',
              });
            }}
            className="flex items-center gap-2"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Exporter CSV
          </Button>

          <Button
            size="sm"
            disabled={clotureDone}
            onClick={handleCloture}
            className={`flex items-center gap-2 font-semibold ${
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
                <Lock className="h-4 w-4" /> Clôturer la Caisse du Jour
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 4 Pastel Stat Cards (Nexoov Style with Amber Accent) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Encaissé Aujourd'hui"
          amount={totalGeneral}
          subtitle={`${transactions.length} versements enregistrés`}
          icon={<Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />

        <KpiCard
          title="Espèces en Tiroir"
          amount={totalEspeces}
          subtitle="Comptage physique requis"
          icon={<Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />

        <KpiCard
          title="Paiements Mobiles"
          amount={totalMobile}
          subtitle="Bankily & Masrvi"
          icon={<Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />

        <KpiCard
          title="Quittances Émises"
          amount={transactions.length}
          subtitle="Journal certifié conforme"
          icon={<FileCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          variant="default"
        />
      </div>

      {/* Table & Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {/* Barre de recherche et filtres */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par reçu (REC-...), élève, matricule..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>

          <Select
            value={selectedMethod}
            onChange={(v) => {
              setSelectedMethod(v);
              setCurrentPage(1);
            }}
            prefix="Mode :"
            icon={<Filter className="h-4 w-4" />}
            options={[
              { value: 'all', label: 'Tous les modes' },
              { value: 'especes', label: 'Espèces uniquement' },
              { value: 'bankily', label: 'Bankily (BPM)' },
              { value: 'masrvi', label: 'Masrvi (BMCI)' },
              { value: 'cheque', label: 'Chèque' },
            ]}
            size="sm"
            triggerClassName="h-10 rounded-xl text-xs font-semibold"
          />
        </div>

        {/* Tableau des transactions */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Heure / Date</th>
                <th className="py-4 px-6">N° Quittance</th>
                <th className="py-4 px-6">Élève</th>
                <th className="py-4 px-6">Échéance Réglée</th>
                <th className="py-4 px-6">Mode Règlement</th>
                <th className="py-4 px-6 text-right">Montant</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Aucune transaction ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{tx.heure}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{tx.date}</div>
                    </td>

                    <td className="py-4.5 px-6 font-mono font-bold text-amber-700 dark:text-amber-400 text-xs whitespace-nowrap">
                      {tx.recu_ref}
                    </td>

                    {/* 2-line student display + avatar */}
                    <td className="py-4.5 px-6 min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        <StudentInitials nom={tx.eleve_nom} prenom={tx.eleve_prenom} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {tx.eleve_nom} {tx.eleve_prenom}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                            #{tx.matricule} • {tx.classe}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap">
                      {tx.echeance_libelle}
                    </td>

                    <td className="py-4.5 px-6 whitespace-nowrap">{getMethodBadge(tx.methode)}</td>

                    <td className="py-4.5 px-6 text-right font-extrabold font-mono text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      {formatMRU(tx.montant)}
                    </td>

                    {/* Context menu "..." */}
                    <td className="py-4.5 px-6 text-right whitespace-nowrap relative journal-menu-container">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === tx.id ? null : tx.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {activeMenuId === tx.id && (
                        <div className="absolute right-6 top-12 z-30 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-left animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              setSelectedReceipt(tx);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Voir le reçu officiel
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReceipt(tx);
                              setActiveMenuId(null);
                              setTimeout(() => window.print(), 200);
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Imprimer le duplicata
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Affichage de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            à{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
            </span>{' '}
            sur{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredTransactions.length}
            </span>{' '}
            quittances
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Précédent
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Suivant
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Réimpression Reçu */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
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
              <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-base">
                  <Building className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  COMPLEXE SCOLAIRE EL MAARIFA
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Tevragh-Zeina • Nouakchott, Mauritanie
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs rounded-lg border border-amber-200 dark:border-amber-800/60">
                  {selectedReceipt.recu_ref}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">ÉLÈVE</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedReceipt.eleve_nom} {selectedReceipt.eleve_prenom}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">MATRICULE</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    #{selectedReceipt.matricule}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">CLASSE</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedReceipt.classe}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">DATE & HEURE</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedReceipt.date} à {selectedReceipt.heure}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Objet :</span>
                  <span className="font-semibold">{selectedReceipt.echeance_libelle}</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Mode de versement :</span>
                  <span className="font-bold uppercase text-amber-700 dark:text-amber-400">
                    {selectedReceipt.methode}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">TOTAL ENCAISSÉ :</span>
                  <span className="font-extrabold text-base text-amber-700 dark:text-amber-400 font-mono">
                    {formatMRU(selectedReceipt.montant)}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center border-t border-slate-100 dark:border-slate-800 pt-2">
                Encaissé par {selectedReceipt.encaisse_par} • Guichet Central N°1
                <br />
                Ce document certifie la libération de l'échéance susmentionnée.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
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
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
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
