import React, { useState, useEffect } from 'react';
import { CLAIMS_CONFIG } from '../../config/claims';
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
  CreditCard,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export type MethodePaiement = 'bankily' | 'masrvi';

interface ParentPaiementsPageProps {
  selectedChildId: string;
  onSelectChild?: (id: string) => void;
}

export const ParentPaiementsPage: React.FC<ParentPaiementsPageProps> = ({
  selectedChildId,
  onSelectChild,
}) => {
  const authEcole = useAuthStore((s) => s.ecole);
  const storeEcole = useEcoleStore((s) => s.ecole);
  const ecoleNom = authEcole?.nom || storeEcole.nom;

  const {
    activeChild,
    errorMessage: childrenError,
    refresh: refreshChildren,
    isLoading: isChildrenLoading,
  } = useParentChildren(selectedChildId, onSelectChild || (() => {}));

  const [realEcheances, setRealEcheances] = useState<any[]>([]);
  const [realPaiements, setRealPaiements] = useState<any[]>([]);
  const [isLoadingFinances, setIsLoadingFinances] = useState(false);

  // Charger les échéances et paiements réels depuis Supabase
  useEffect(() => {
    if (!activeChild?.id) {
      setRealEcheances([]);
      setRealPaiements([]);
      return;
    }

    let isCancelled = false;
    const fetchFinances = async () => {
      setIsLoadingFinances(true);
      try {
        const { data: echData, error: echErr } = await supabase
          .from('echeances')
          .select('*')
          .eq('eleve_id', activeChild.id)
          .order('date_echeance', { ascending: true });

        if (echErr) {
          console.error('[ParentPaiementsPage] Erreur lecture échéances:', echErr);
        }

        const echList = echData || [];
        if (!isCancelled) {
          setRealEcheances(echList);
        }

        if (echList.length > 0) {
          const echIds = echList.map((e) => e.id);
          const { data: payData, error: payErr } = await supabase
            .from('paiements')
            .select('*')
            .in('echeance_id', echIds)
            .order('created_at', { ascending: false });

          if (payErr) {
            console.error('[ParentPaiementsPage] Erreur lecture paiements:', payErr);
          }

          if (!isCancelled) {
            setRealPaiements(payData || []);
          }
        } else if (!isCancelled) {
          setRealPaiements([]);
        }
      } catch (err) {
        console.warn('[ParentPaiementsPage] Exception chargement finances:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingFinances(false);
        }
      }
    };

    fetchFinances();
    return () => {
      isCancelled = true;
    };
  }, [activeChild?.id]);

  // Calculs financiers dynamiques dérivés directement d'activeChild et realEcheances
  const totalScolarite = activeChild?.total_due || 0;
  const totalRegle = activeChild?.total_paid || 0;
  const resteAPayer = activeChild?.remaining || 0;
  const nextEcheance = realEcheances.find((e) => e.statut !== 'paye');
  const prochaineEcheanceDate = nextEcheance?.date_echeance || 'Aucune échéance en attente';

  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // 1. État de chargement initial des enfants
  if (isChildrenLoading && !activeChild) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chargement du dossier financier...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Récupération des informations de scolarité auprès de l'établissement.
          </p>
        </div>
      </div>
    );
  }

  // 2. Erreur réseau / Supabase
  if (childrenError) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Impossible de charger les données financières
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

  // 3. Aucun élève rattaché en base pour ce parent
  if (!activeChild) {
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
            Votre espace famille est actif. Le relevé des frais de scolarité apparaîtra automatiquement dès que l'établissement aura validé le rattachement de votre enfant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative"
      aria-busy={isLoadingFinances || isChildrenLoading}
    >
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
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              Espace Scolarité
            </span>
            {realEcheances.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Aucun frais
              </span>
            ) : resteAPayer === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                À jour
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                Solde à régler
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">• Frais & Règlements Sécurisés</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frais de Scolarité — {activeChild.prenom} {activeChild.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Classe de {activeChild.classe} • Solde de scolarité et règlement sécurisé par Bankily ou Masrvi.
          </p>
        </div>

        {resteAPayer > 0 && (
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <Button
              disabled
              className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed shadow-none flex items-center gap-2 px-4 py-2.5 rounded-xl opacity-80"
            >
              <Smartphone className="h-4 w-4" />
              Paiement en ligne bientôt disponible
            </Button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pour régler, présentez-vous à la caisse de l'école.
            </p>
          </div>
        )}
      </div>

      {/* 3 Cartes de Synthèse Financière (Pastel Nexoov Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Montant Annuel Total"
          amount={totalScolarite}
          unit="MRU"
          subtitle={`Classe : ${activeChild.classe}`}
          icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          variant="purple"
        />

        <KpiCard
          title="Total Déjà Réglé"
          amount={totalRegle}
          unit="MRU"
          subtitle={
            totalScolarite > 0
              ? `${Math.round((totalRegle / totalScolarite) * 100)}% de la scolarité acquittée`
              : 'Aucun frais planifié'
          }
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />

        <KpiCard
          title="Reste à Régler"
          amount={resteAPayer}
          unit="MRU"
          subtitle={
            realEcheances.length === 0
              ? 'Aucun frais enregistré'
              : resteAPayer > 0
              ? `Échéance limite : ${prochaineEcheanceDate}`
              : 'À jour • Toutes les échéances sont réglées'
          }
          icon={<Receipt className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant={resteAPayer > 0 ? 'danger' : realEcheances.length === 0 ? 'default' : 'success'}
        />
      </div>

      {/* Calendrier des Échéances de Scolarité */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Échéancier de Scolarité
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {realEcheances.length} tranche(s) prévue(s)
          </span>
        </div>

        {isLoadingFinances ? (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="h-6 w-6 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Chargement de l'échéancier...</p>
          </div>
        ) : realEcheances.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <CreditCard className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Aucun frais enregistré pour le moment
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
              L'établissement scolaire n'a pas encore configuré d'échéance de scolarité pour {activeChild.prenom}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {realEcheances.map((ech) => {
              const montantTotal = Number(ech.montant || 0);
              const montantPaye = Number(ech.montant_paye || 0);
              const soldeEch = Math.max(0, montantTotal - montantPaye);
              const isPaye = ech.statut === 'paye' || soldeEch === 0;
              const isEnRetard = ech.statut === 'en_retard';

              return (
                <div
                  key={ech.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isPaye
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : isEnRetard
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {isPaye ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isEnRetard ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {ech.libelle || 'Tranche de scolarité'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Échéance au {ech.date_echeance || 'Date non précisée'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-base font-mono">
                        {formatMRU(montantTotal)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {isPaye ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Acquitté</span>
                        ) : (
                          <span>Reste: <strong className="text-slate-700 dark:text-slate-300">{formatMRU(soldeEch)}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            {CLAIMS_CONFIG.quittancesCertifiees ? "Quittances certifiées par l'établissement" : "Quittances et justificatifs de paiement"}
          </span>
        </div>

        <div className="space-y-3">
          {realPaiements.length === 0 && (
            <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <Receipt className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Aucune quittance de paiement disponible
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                Vos quittances et justificatifs apparaîtront automatiquement dès enregistrement et validation de vos règlements par l'établissement.
              </p>
            </div>
          )}

          {realPaiements.map((p) => {
            const echeanceAssociee = realEcheances.find((e) => e.id === p.echeance_id);
            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Date non renseignée';
            const refPaiement = p.reference_transaction || `REC-${p.id.slice(0, 8).toUpperCase()}`;

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {echeanceAssociee?.libelle || 'Règlement de scolarité'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Payé le {dateStr} • Via {p.methode?.toUpperCase() || 'GUICHET'} • Réf:{' '}
                      <span className="font-mono text-purple-700 dark:text-purple-400 font-semibold">
                        {refPaiement}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-900 dark:text-white text-base font-mono">
                    {formatMRU(Number(p.montant || 0))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      generateReceiptPdf({
                        recuRef: refPaiement,
                        datePaiement: dateStr,
                        eleveNom: activeChild.nom,
                        elevePrenom: activeChild.prenom,
                        matricule: activeChild.matricule,
                        classe: activeChild.classe,
                        libelleEcheance: echeanceAssociee?.libelle || 'Règlement de scolarité',
                        montant: Number(p.montant || 0),
                        methodePaiement: p.methode || 'especes',
                        caissierNom: 'Caisse Établissement',
                        ecoleNom,
                      });
                      setActiveToast({
                        message: `Quittance ${refPaiement} téléchargée en PDF pour ${activeChild.prenom} ${activeChild.nom}.`,
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
            );
          })}

        </div>
      </div>
    </div>
  );
};
