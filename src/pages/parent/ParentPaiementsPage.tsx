import React, { useState, useEffect } from 'react';
import {
  MOCK_PARENT_ENFANTS_DETAILS,
  CURRENT_PARENT,
  MethodePaiement,
  ParentEnfantDetail,
} from '../../lib/mockData';
import { generateReceiptPdf } from '../../lib/pdf/generateReceiptPdf';
import { useEcoleStore } from '../../store/useEcoleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentChildren } from '../../hooks/useParentChildren';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { KpiCard } from '../../components/ui/KpiCard';
import { formatMRU } from '../../lib/utils';
import {
  CheckCircle2,
  Smartphone,
  ArrowDownToLine,
  Receipt,
  X,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ParentPaiementsPageProps {
  selectedChildId: string;
}

export const ParentPaiementsPage: React.FC<ParentPaiementsPageProps> = ({
  selectedChildId,
}) => {
  const authEcole = useAuthStore((s) => s.ecole);
  const authProfile = useAuthStore((s) => s.profile);
  const storeEcole = useEcoleStore((s) => s.ecole);
  const ecoleNom = authEcole?.nom || storeEcole.nom;

  const { activeChild, errorMessage: childrenError, refresh: refreshChildren, isLoading: isChildrenLoading } = useParentChildren(selectedChildId, () => {});

  const [realEcheances, setRealEcheances] = useState<any[]>([]);
  const [realPaiements, setRealPaiements] = useState<any[]>([]);
  const [isLoadingFinances, setIsLoadingFinances] = useState(false);

  // Charger les échéances et paiements réels depuis Supabase
  useEffect(() => {
    if (!activeChild?.id) return;
    const fetchFinances = async () => {
      setIsLoadingFinances(true);
      try {
        const [echRes, payRes] = await Promise.all([
          supabase
            .from('echeances')
            .select('*')
            .eq('eleve_id', activeChild.id)
            .order('date_echeance', { ascending: true }),
          supabase
            .from('paiements')
            .select('*')
            .eq('eleve_id', activeChild.id)
            .order('date_paiement', { ascending: false }),
        ]);

        if (echRes.data) setRealEcheances(echRes.data);
        if (payRes.data) setRealPaiements(payRes.data);
      } catch (err) {
        console.warn('[ParentPaiementsPage] Erreur chargement finances:', err);
      } finally {
        setIsLoadingFinances(false);
      }
    };

    fetchFinances();
  }, [activeChild?.id]);

  const mockEnfant = activeChild ? MOCK_PARENT_ENFANTS_DETAILS[activeChild.id] : null;

  // Calculer les données financières dynamiquement d'après les échéances réelles
  const totalScolarite = activeChild ? activeChild.total_due : 0;
  const totalRegle = activeChild ? activeChild.total_paid : 0;
  const resteAPayer = activeChild ? activeChild.remaining : 0;
  const nextEcheance = realEcheances.find((e) => e.statut !== 'paye');

  const [enfantData, setEnfantData] = useState<ParentEnfantDetail | null>(null);

  useEffect(() => {
    if (!activeChild) {
      setEnfantData(null);
      return;
    }

    if (mockEnfant) {
      setEnfantData(mockEnfant);
    } else {
      setEnfantData({
        id: activeChild.id,
        nom: activeChild.nom,
        prenom: activeChild.prenom,
        classe: activeChild.classe,
        matricule: activeChild.matricule,
        photo_initiales: activeChild.photo_initiales,
        date_naissance: '',
        professeur_principal: '',
        total_scolarite: totalScolarite,
        total_regle: totalRegle,
        reste_a_payer: resteAPayer,
        statut_paiement: (resteAPayer === 0 ? 'paye' : (totalRegle > 0 ? 'partiel' : 'en_retard')) as any,
        prochaine_echeance_date: nextEcheance?.date_echeance || 'Aucune échéance en attente',
        prochaine_echeance_montant: nextEcheance ? Number(nextEcheance.montant || 0) : 0,
        bulletin: [],
        emploi_du_temps_aujourdhui: [],
        nb_absences_total: 0,
        nb_retards_total: 0,
        rang: '-',
        moyenne_generale: 0,
      });
    }
  }, [activeChild, mockEnfant, totalScolarite, totalRegle, resteAPayer, realEcheances, realPaiements]);

  // Formulaire de paiement mobile
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(() => (resteAPayer > 0 ? Math.min(resteAPayer, 25000) : 0));
  const [selectedMethod, setSelectedMethod] = useState<MethodePaiement>('bankily');
  const [phoneNumber, setPhoneNumber] = useState<string>(authProfile?.telephone || CURRENT_PARENT.telephone);
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
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enfantData) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const now = new Date();
      const ref = `REC-WEB-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPaid = (enfantData.total_regle || 0) + paymentAmount;
      const newRemaining = Math.max(0, (enfantData.reste_a_payer || 0) - paymentAmount);

      setEnfantData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          total_regle: newPaid,
          reste_a_payer: newRemaining,
          statut_paiement: newRemaining === 0 ? 'paye' : 'partiel',
        };
      });

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

      setActiveToast({
        message: `Paiement de ${formatMRU(paymentAmount)} validé avec succès via ${selectedMethod.toUpperCase()}. Quittance ${ref} émise.`,
        type: 'success',
      });
    }, 1000);
  };

  if (childrenError) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Impossible de charger les données de paiement
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {childrenError}
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChildren}
              disabled={isChildrenLoading}
              className="gap-2 border-slate-300 dark:border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isChildrenLoading ? 'animate-spin' : ''}`} />
              <span>Réessayer</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeChild || !enfantData) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
            <CreditCard className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Aucun élève rattaché pour le moment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Votre espace famille est actif. Le relevé des frais de scolarité et les options de règlement en ligne (Bankily, Masrvi) apparaîtront automatiquement dès que l'établissement aura validé le rattachement de votre enfant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative" aria-busy={isLoadingFinances || isChildrenLoading}>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              Espace Scolarité
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Frais & Règlements Sécurisés</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frais de Scolarité — {enfantData.prenom} {enfantData.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consultez le solde de la scolarité et réglez directement par Bankily ou Masrvi avec quittance instantanée.
          </p>
        </div>

        {enfantData.reste_a_payer > 0 && (
          <Button
            onClick={() => {
              setPaymentAmount(Math.min(enfantData.reste_a_payer, 25000));
              setIsPaymentModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0"
          >
            <Smartphone className="h-4 w-4" />
            Payer par Mobile Money
          </Button>
        )}
      </div>

      {/* 3 Cartes de Synthèse Financière (Pastel Nexoov Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Montant Annuel Total"
          amount={enfantData.total_scolarite}
          unit="MRU"
          subtitle={`Classe : ${enfantData.classe}`}
          icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant="purple"
        />

        <KpiCard
          title="Total Déjà Réglé"
          amount={enfantData.total_regle}
          unit="MRU"
          subtitle={`${Math.round((enfantData.total_regle / enfantData.total_scolarite) * 100)}% de la scolarité acquittée`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />

        <KpiCard
          title="Reste à Régler"
          amount={enfantData.reste_a_payer}
          unit="MRU"
          subtitle={
            enfantData.reste_a_payer > 0
              ? `Échéance limite : ${enfantData.prochaine_echeance_date}`
              : 'Aucun impayé • Bravo !'
          }
          icon={<Receipt className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant={enfantData.reste_a_payer > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Historique des Règlements & Quittances */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Historique des Paiements Effectués
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Quittances certifiées par l'établissement
          </span>
        </div>

        <div className="space-y-3">
          {/* Lignes d'historique */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Règlement Trimestre 1 (Inscription & Frais de rentrée)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Payé le 15 Octobre 2025 • Via Bankily • Réf: <span className="font-mono text-purple-700 dark:text-purple-400 font-semibold">REC-NKTT-7102</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-black text-slate-900 dark:text-white text-base font-mono">
                {formatMRU(40000)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  generateReceiptPdf({
                    recuRef: 'REC-NKTT-7102',
                    datePaiement: '15/10/2025 à 10:30',
                    eleveNom: enfantData.nom,
                    elevePrenom: enfantData.prenom,
                    matricule: enfantData.matricule,
                    classe: enfantData.classe,
                    libelleEcheance: 'Règlement Trimestre 1 (Inscription & Frais de rentrée)',
                    montant: 40000,
                    methodePaiement: 'bankily',
                    caissierNom: 'Caisse Centrale',
                    ecoleNom,
                  });
                  setActiveToast({
                    message: `Quittance REC-NKTT-7102 téléchargée en PDF pour ${enfantData.prenom} ${enfantData.nom}.`,
                    type: 'success',
                  });
                }}
                className="text-xs font-semibold gap-1.5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Quittance
              </Button>
            </div>
          </div>

          {confirmedReceipt && (
            <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    Paiement Récent Validé en Ligne
                  </div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Payé le {confirmedReceipt.date} à {confirmedReceipt.heure} • Via {confirmedReceipt.methode.toUpperCase()} • Réf: {confirmedReceipt.recu_ref}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-black text-emerald-900 dark:text-emerald-200 text-base font-mono">
                  {formatMRU(confirmedReceipt.montant)}
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    generateReceiptPdf({
                      recuRef: confirmedReceipt.recu_ref,
                      datePaiement: `${confirmedReceipt.date} à ${confirmedReceipt.heure}`,
                      eleveNom: enfantData.nom,
                      elevePrenom: enfantData.prenom,
                      matricule: enfantData.matricule,
                      classe: enfantData.classe,
                      libelleEcheance: 'Paiement en ligne Mobile Money',
                      montant: confirmedReceipt.montant,
                      methodePaiement: confirmedReceipt.methode,
                      caissierNom: 'Guichet Électronique',
                      ecoleNom,
                    });
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1.5"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Télécharger Quittance PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Paiement Direct Mobile Money */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-purple-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-300" />
                  Règlement Sécurisé Mobile Money
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Pour {enfantData.prenom} ({enfantData.classe})
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              {/* Choix du mode de paiement */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  1. Choisissez votre portefeuille mobile
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'bankily', name: 'Bankily (BPM)', logo: '🟠' },
                    { id: 'masrvi', name: 'Masrvi (BMCI)', logo: '🔵' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedMethod(item.id as MethodePaiement)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                        selectedMethod === item.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200 shadow-xs ring-1 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                    MRU
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.min(enfantData.reste_a_payer, 25000))}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Tranche courante (25 000 MRU)
                  </button>
                  <span className="text-slate-400">•</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(enfantData.reste_a_payer)}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Totalité ({formatMRU(enfantData.reste_a_payer)})
                  </button>
                </div>
              </div>

              {/* Numéro de téléphone */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  3. Numéro de compte mobile
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="+222 46 12 34 56"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Code secret ou validation OTP */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  4. Code de confirmation / PIN
                </label>
                <input
                  type="password"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  placeholder="••••"
                  maxLength={4}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center tracking-widest text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isProcessing}
                  loadingText="Validation auprès de la banque..."
                  className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Confirmer le paiement de {formatMRU(paymentAmount)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
