import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  CURRENT_PARENT,
  CURRENT_ECOLE,
  MethodePaiement,
} from '../../lib/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { formatMRU } from '../../lib/utils';
import { formatCompactMRU } from '../../lib/formatCompactMRU';
import {
  CheckCircle2,
  Smartphone,
  Download,
  Receipt,
  ShieldCheck,
  Building,
  X,
  Printer,
} from 'lucide-react';

interface ParentPaiementsPageProps {
  selectedChildId: string;
}

export const ParentPaiementsPage: React.FC<ParentPaiementsPageProps> = ({
  selectedChildId,
}) => {
  const [enfantData, setEnfantData] = useState(
    MOCK_PARENT_ENFANTS_DETAILS[selectedChildId] || MOCK_PARENT_ENFANTS_DETAILS['el-003']
  );

  // Mise à jour si l'enfant sélectionné change dans la sidebar
  React.useEffect(() => {
    if (MOCK_PARENT_ENFANTS_DETAILS[selectedChildId]) {
      setEnfantData(MOCK_PARENT_ENFANTS_DETAILS[selectedChildId]);
    }
  }, [selectedChildId]);

  // Formulaire de paiement mobile
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(
    enfantData.reste_a_payer > 0 ? Math.min(enfantData.reste_a_payer, 25000) : 0
  );
  const [selectedMethod, setSelectedMethod] = useState<MethodePaiement>('bankily');
  const [phoneNumber, setPhoneNumber] = useState<string>(CURRENT_PARENT.telephone);
  const [otpCode, setOtpCode] = useState<string>('1234');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState<{
    recu_ref: string;
    montant: number;
    date: string;
    heure: string;
    methode: string;
    enfant_nom: string;
  } | null>(null);

  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Déclenchement de confettis discrets
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#10b981', '#f59e0b'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignorer
    }
  };

  // Soumission du paiement
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const now = new Date();
      const ref = `REC-WEB-${Math.floor(1000 + Math.random() * 9000)}`;

      // Mise à jour de l'état local
      const newPaid = enfantData.total_regle + paymentAmount;
      const newRemaining = Math.max(0, enfantData.reste_a_payer - paymentAmount);

      setEnfantData((prev) => ({
        ...prev,
        total_regle: newPaid,
        reste_a_payer: newRemaining,
        statut_paiement: newRemaining === 0 ? 'paye' : 'partiel',
      }));

      const receipt = {
        recu_ref: ref,
        montant: paymentAmount,
        date: now.toLocaleDateString('fr-FR'),
        heure: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        methode: selectedMethod,
        enfant_nom: `${enfantData.prenom} ${enfantData.nom}`,
      };

      setConfirmedReceipt(receipt);
      setIsPaymentModalOpen(false);
      triggerConfetti();

      setActiveToast({
        message: `Paiement de ${formatMRU(paymentAmount)} validé avec succès via ${selectedMethod.toUpperCase()}. Quittance ${ref} émise.`,
        type: 'success',
      });
    }, 1200);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-fade-in">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Espace Scolarité
            </span>
            <span className="text-xs text-slate-500">• Frais & Règlements Sécurisés</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Frais de Scolarité — {enfantData.prenom} {enfantData.nom}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consultez le solde de la scolarité et réglez directement par Bankily, Masrvi ou Sedad avec quittance instantanée.
          </p>
        </div>

        {enfantData.reste_a_payer > 0 && (
          <Button
            onClick={() => {
              setPaymentAmount(Math.min(enfantData.reste_a_payer, 25000));
              setIsPaymentModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0"
          >
            <Smartphone className="h-4 w-4" />
            Payer par Mobile Money
          </Button>
        )}
      </div>

      {/* 3 Cartes de Synthèse Financière */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-white min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
            Montant Annuel Total
          </div>
          <div
            title={formatMRU(enfantData.total_scolarite)}
            className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-1 truncate cursor-help"
          >
            {formatCompactMRU(enfantData.total_scolarite)}
          </div>
          <div className="text-xs text-slate-500 mt-2 truncate">
            Classe : {enfantData.classe}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-white min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
            Total Déjà Réglé
          </div>
          <div
            title={formatMRU(enfantData.total_regle)}
            className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono mt-1 truncate cursor-help"
          >
            {formatCompactMRU(enfantData.total_regle)}
          </div>
          <div className="text-xs text-slate-500 mt-2 truncate">
            {Math.round((enfantData.total_regle / enfantData.total_scolarite) * 100)}% de la scolarité acquittée
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-slate-200 shadow-sm bg-white min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
            Reste à Régler
          </div>
          <div
            title={formatMRU(enfantData.reste_a_payer)}
            className={`text-3xl sm:text-4xl font-black font-mono mt-1 truncate cursor-help ${
              enfantData.reste_a_payer > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatCompactMRU(enfantData.reste_a_payer)}
          </div>
          <div className="text-xs text-slate-500 mt-2 truncate">
            {enfantData.reste_a_payer > 0 ? (
              <span className="text-rose-600 font-semibold truncate block">
                Échéance limite : {enfantData.prochaine_echeance_date}
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold truncate block">
                Aucun impayé • Bravo !
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Historique des Règlements & Quittances */}
      <Card className="p-6 sm:p-7 rounded-2xl border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Receipt className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Historique des Paiements Effectués
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Quittances certifiées par l'établissement
          </span>
        </div>

        <div className="space-y-3">
          {/* Lignes d'historique */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  Règlement Trimestre 1 (Inscription & Frais de rentrée)
                </div>
                <div className="text-xs text-slate-500">
                  Payé le 15 Octobre 2025 • Via Bankily • Réf: REC-NKTT-7102
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-black text-slate-900 text-base">
                {formatMRU(40000)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveToast({
                    message: 'Téléchargement de la quittance REC-NKTT-7102...',
                    type: 'info',
                  });
                }}
                className="text-xs font-semibold gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Quittance
              </Button>
            </div>
          </div>

          {confirmedReceipt && (
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 text-sm">
                    Paiement Récent Validé en Ligne
                  </div>
                  <div className="text-xs text-emerald-800">
                    Payé le {confirmedReceipt.date} à {confirmedReceipt.heure} • Via {confirmedReceipt.methode.toUpperCase()} • Réf: {confirmedReceipt.recu_ref}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-black text-emerald-900 text-base">
                  {formatMRU(confirmedReceipt.montant)}
                </span>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimer
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Paiement Direct Mobile Money */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-indigo-300" />
                  Règlement Sécurisé Mobile Money
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Pour {enfantData.prenom} ({enfantData.classe})
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-indigo-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {/* Choix du mode de paiement */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  1. Choisissez votre portefeuille mobile
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bankily', name: 'Bankily', logo: '🟠' },
                    { id: 'masrvi', name: 'Masrvi', logo: '🔵' },
                    { id: 'sedad', name: 'Sedad', logo: '🟣' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedMethod(item.id as MethodePaiement)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                        selectedMethod === item.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{item.logo}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  2. Montant à payer (MRU)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1000}
                    max={enfantData.reste_a_payer}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 font-extrabold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    MRU
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.min(enfantData.reste_a_payer, 25000))}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Tranche courante (25 000 MRU)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(enfantData.reste_a_payer)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Totalité ({formatMRU(enfantData.reste_a_payer)})
                  </button>
                </div>
              </div>

              {/* Numéro de téléphone */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  3. N° de téléphone associé au compte
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+222 XX XX XX XX"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Simulation OTP */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  4. Code PIN de validation (Démo: 1234)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Sécurité */}
              <div className="rounded-lg bg-indigo-50 p-2.5 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Validation instantanée sans frais supplémentaires. La quittance est envoyée par SMS et enregistrée sur votre compte.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                >
                  {isProcessing ? 'Validation en cours...' : `Confirmer ${formatMRU(paymentAmount)}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reçu de Paiement Récent */}
      {confirmedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span className="font-bold text-sm">Paiement Confirmé avec Succès</span>
              </div>
              <button
                onClick={() => setConfirmedReceipt(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="flex items-center justify-center gap-1 text-slate-900 font-extrabold text-base">
                  <Building className="h-4 w-4 text-indigo-600" />
                  {CURRENT_ECOLE.nom}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Reçu Officiel de Paiement Numérique
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-50 text-emerald-800 font-mono font-bold text-xs rounded border border-emerald-200">
                  {confirmedReceipt.recu_ref}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">ÉLÈVE</span>
                  <span className="font-bold text-slate-800">{confirmedReceipt.enfant_nom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TUTEUR</span>
                  <span className="font-semibold text-slate-800">{CURRENT_PARENT.prenom} {CURRENT_PARENT.nom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CANAL</span>
                  <span className="font-semibold text-slate-800 uppercase">{confirmedReceipt.methode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DATE & HEURE</span>
                  <span className="font-semibold text-slate-800">{confirmedReceipt.date} • {confirmedReceipt.heure}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">MONTANT RÉGLÉ :</span>
                <span className="font-extrabold text-base text-emerald-600 font-mono">
                  {formatMRU(confirmedReceipt.montant)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmedReceipt(null)}
              >
                Fermer
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                  setConfirmedReceipt(null);
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
