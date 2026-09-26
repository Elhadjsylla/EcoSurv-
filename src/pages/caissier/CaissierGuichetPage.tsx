import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { Tooltip } from '../../components/ui/Tooltip';
import { formatMRU } from '../../lib/utils';
import { generateReceiptPdf } from '../../lib/pdf/generateReceiptPdf';
import { useCaisseStore } from '../../store/useCaisseStore';
import { supabase } from '../../lib/supabase';
import {
  CreditCard,
  Search,
  Printer,
  Receipt,
  Building,
  Check,
  User,
  X,
  CheckCheck,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface CaissierGuichetPageProps {
  preselectedEleveId?: string;
}

export const CaissierGuichetPage: React.FC<CaissierGuichetPageProps> = ({
  preselectedEleveId,
}) => {
  const authProfile = useAuthStore((s) => s.profile);
  const [elevesList, setElevesList] = useState<EleveWithStats[]>(() => {
    if (authProfile?.ecole_id) return [];
    return MOCK_ELEVES;
  });

  React.useEffect(() => {
    if (authProfile?.ecole_id) {
      const fetchReal = async () => {
        try {
          const [elevesRes, echeancesRes] = await Promise.all([
            supabase
              .from('eleves')
              .select('*')
              .eq('ecole_id', authProfile.ecole_id)
              .order('nom', { ascending: true }),
            supabase
              .from('echeances')
              .select('*')
              .eq('ecole_id', authProfile.ecole_id),
          ]);

          if (!elevesRes.error && elevesRes.data) {
            const allEch = echeancesRes.data || [];
            const mapped: EleveWithStats[] = elevesRes.data.map((d: any) => {
              const studentEch = allEch.filter((ech: any) => ech.eleve_id === d.id);
              const totalDue = studentEch.reduce((sum: number, ech: any) => sum + Number(ech.montant || 0), 0);
              const totalPaid = studentEch.reduce((sum: number, ech: any) => sum + Number(ech.montant_paye || 0), 0);
              const remaining = Math.max(0, totalDue - totalPaid);
              const pendingEch = studentEch.find((ech: any) => ech.statut !== 'paye');
              const nextDueAmount = pendingEch ? Math.max(0, Number(pendingEch.montant) - Number(pendingEch.montant_paye || 0)) : 15000;
              const hasOverdue = studentEch.some((ech: any) => ech.statut === 'en_retard');
              const derniereEcheanceDate = studentEch
                .map((ech: any) => String(ech.date_echeance || ''))
                .filter(Boolean)
                .sort()
                .pop() || '';
              const computedStatut = hasOverdue
                ? 'en_retard'
                : (totalDue > 0 && remaining === 0
                  ? 'paye'
                  : (totalPaid > 0 ? 'partiel' : 'a_jour'));

              return {
                id: d.id,
                ecole_id: d.ecole_id,
                matricule: d.matricule || `ECO-${d.id.slice(0, 4).toUpperCase()}`,
                nom: d.nom,
                prenom: d.prenom,
                date_naissance: d.date_naissance || '',
                lieu_naissance: d.lieu_naissance || '',
                sexe: (d.sexe === 'F' ? 'F' : 'M'),
                classe: d.classe || 'Non assigné',
                nom_tuteur: d.nom_tuteur || 'Tuteur',
                telephone_tuteur: d.telephone_tuteur || '',
                email_tuteur: d.email_tuteur || '',
                adresse_tuteur: d.adresse_tuteur || '',
                lien_parente: d.lien_parente || 'pere',
                actif: d.actif ?? true,
                total_due: totalDue,
                total_paid: totalPaid,
                remaining: remaining,
                derniere_echeance_date: derniereEcheanceDate,
                prochaine_echeance_montant: nextDueAmount,
                statut: computedStatut,
                nb_absences: 0,
                timeline_paiements: [],
                created_at: d.created_at,
              };
            });
            setElevesList(mapped);
          }
        } catch (e) {
          console.warn('[CaissierGuichetPage] fetch error:', e);
        }
      };
      fetchReal();
    }
  }, [authProfile?.ecole_id]);

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
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // État de clôture de caisse du jour
  const isDateCloturee = useCaisseStore((s) => s.isDateCloturee);
  const clotureInfo = useCaisseStore((s) => s.getClotureForDate());
  const isCaisseCloturee = isDateCloturee();

  // Élève sélectionné
  const selectedEleve = useMemo(() => {
    return elevesList.find((e) => e.id === selectedEleveId) || null;
  }, [elevesList, selectedEleveId]);

  React.useEffect(() => {
    if (selectedEleve) {
      const suggestedAmount =
        selectedEleve.remaining > 0
          ? Math.min(selectedEleve.remaining, selectedEleve.prochaine_echeance_montant || 15000)
          : 15000;
      setMontant(suggestedAmount);
    }
  }, [selectedEleve]);

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

  useEffect(() => {
    if (printedReceipt) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPrintedReceipt(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [printedReceipt]);

  const handleProcessPayment = async () => {
    if (isCaisseCloturee) {
      setActiveToast({
        message: 'La caisse du jour est déjà clôturée. Tout nouvel encaissement est verrouillé.',
        type: 'warning',
      });
      return;
    }
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
    const studentName = `${selectedEleve.prenom} ${selectedEleve.nom}`;
    const studentMatricule = selectedEleve.matricule;
    const studentClasse = selectedEleve.classe;

    // 1. Écriture réelle dans les tables `echeances` et `paiements`
    if (authProfile?.ecole_id) {
      try {
        let { data: echs } = await supabase
          .from('echeances')
          .select('id, libelle, montant, montant_paye')
          .eq('eleve_id', selectedEleve.id)
          .neq('statut', 'paye')
          .order('date_echeance', { ascending: true })
          .limit(1);

        let targetEcheanceId = echs && echs.length > 0 ? echs[0].id : null;

        if (!targetEcheanceId) {
          const { data: newEch, error: newEchErr } = await supabase
            .from('echeances')
            .insert({
              ecole_id: authProfile.ecole_id,
              eleve_id: selectedEleve.id,
              libelle: libelle || 'Mensualité de scolarité',
              montant: montant,
              montant_paye: montant,
              date_echeance: dateStr,
              statut: 'paye',
            })
            .select('id')
            .single();

          if (!newEchErr && newEch) {
            targetEcheanceId = newEch.id;
          }
        } else if (echs && echs.length > 0) {
          const currentEch = echs[0];
          const updatedPaid = Number(currentEch.montant_paye || 0) + montant;
          const updatedStatut = updatedPaid >= Number(currentEch.montant) ? 'paye' : 'partiel';
          await supabase
            .from('echeances')
            .update({
              montant_paye: updatedPaid,
              statut: updatedStatut,
              date_paiement: now.toISOString(),
            })
            .eq('id', targetEcheanceId);
        }

        if (targetEcheanceId) {
          const { error: insertError } = await supabase.from('paiements').insert([
            {
              ecole_id: authProfile.ecole_id,
              echeance_id: targetEcheanceId,
              montant: montant,
              methode: methode,
              statut: 'confirme',
              reference_transaction: referenceOperateur || recuRef,
              encaisse_par: authProfile.id,
              note: `${libelle} - Quittance #${recuRef} (${studentName})`,
              paye_le: now.toISOString(),
            },
          ]);
          if (insertError) {
            console.error('[CaissierGuichet] Erreur insert paiement:', insertError.message);
          }
        }
      } catch (err) {
        console.warn('[CaissierGuichet] Erreur Supabase:', err);
      }
    }

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
      encaisse_par: authProfile ? `${authProfile.prenom} ${authProfile.nom}` : `${CURRENT_CAISSIER.prenom} ${CURRENT_CAISSIER.nom}`,
      statut: 'confirme',
    };

    // Propager immédiatement à l'ensemble des écrans Caissier
    useCaisseStore.getState().addTransaction(newTx);
    useCaisseStore.getState().deductEleveBalance(selectedEleve.id, montant);
    useCaisseStore.getState().triggerRefresh();

    // 2. Mise à jour de l'échéance et du statut de l'élève
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

    // 3. Déclenchement automatique du téléchargement du reçu PDF ticket de caisse
    generateReceiptPdf(
      {
        recuRef,
        datePaiement: `${dateStr} à ${heureStr}`,
        eleveNom: selectedEleve.nom,
        elevePrenom: selectedEleve.prenom,
        matricule: studentMatricule,
        classe: studentClasse,
        libelleEcheance: libelle,
        montant,
        methodePaiement: methode,
        caissierNom: authProfile ? `${authProfile.prenom} ${authProfile.nom}` : `${CURRENT_CAISSIER.prenom} ${CURRENT_CAISSIER.nom}`,
        ecoleNom: useAuthStore.getState().ecole?.nom,
      },
      'download'
    );

    setPrintedReceipt(newTx);
    setActiveToast({
      message: `Paiement enregistré dans paiements & Reçu ticket #${recuRef} téléchargé en PDF pour ${studentName}.`,
      type: 'success',
    });

    // 4. Réinitialisation du formulaire pour le prochain encaissement
    setSelectedEleveId('');
    setSearchQuery('');
    setReferenceOperateur('');
    setLibelle('Mensualité Mars 2026');
    setMontant(15000);
    setMethode('especes');
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 animate-stagger-rise relative">
      {/* Toast Notification */}
      {activeToast && (
        <ToastNotification
          message={activeToast.message}
          type={activeToast.type}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Guichet d'Encaissement & Paiements
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              {CURRENT_CAISSIER.guichet}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Enregistrez les versements des parents d'élèves en espèces ou mobile banking et délivrez instantanément un reçu numéroté.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Opérateur :</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Building className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {authProfile ? `${authProfile.prenom} ${authProfile.nom}` : `${CURRENT_CAISSIER.prenom} ${CURRENT_CAISSIER.nom}`}
          </span>
        </div>
      </div>

      {/* Bannière d'avertissement de caisse clôturée */}
      {isCaisseCloturee && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center gap-4 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
          <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold uppercase tracking-wide">
                Guichet de Caisse Clôturé pour Aujourd'hui
              </h4>
              <span className="text-[10px] uppercase font-bold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-700">
                Saisie Verrouillée
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              La caisse journalière a été certifiée et enregistrée dans <span className="font-mono font-bold">clotures_caisse</span>
              {clotureInfo ? ` (${clotureInfo.nb_transactions} opérations • Total ${formatMRU(clotureInfo.montant_total)})` : ''}.
              Toute nouvelle opération d'encaissement est bloquée.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Search & Selection (Left) vs Payment Terminal (Right) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${isCaisseCloturee ? 'opacity-70 pointer-events-none select-none' : ''}`}>
        {/* Left Col (5 cols): Student Search & Identification */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 sm:p-7 rounded-2xl space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              1. Identifier l'Élève au Guichet
            </h2>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher par nom, matricule ou tuteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Quick search results dropdown */}
            {searchQuery.trim() && (
              <div className="space-y-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 p-1.5 scrollbar-thin">
                {searchedEleves.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                      className="p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs cursor-pointer transition-all flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-2.5">
                        <StudentInitials nom={el.nom} prenom={el.prenom} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {el.prenom} {el.nom}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {el.matricule} • {el.classe}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Reste dû</span>
                        <span className="text-xs font-extrabold font-mono text-rose-600 dark:text-rose-400">
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
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/25 p-4 space-y-3 animate-scale-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StudentInitials
                      nom={selectedEleve.nom}
                      prenom={selectedEleve.prenom}
                      size="md"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedEleve.prenom} {selectedEleve.nom}
                      </h3>
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-mono font-bold">
                        {selectedEleve.matricule} • Classe : {selectedEleve.classe}
                      </p>
                    </div>
                  </div>

                  <Tooltip content="Changer d'élève">
                    <button
                      onClick={() => setSelectedEleveId('')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-white dark:hover:bg-slate-800"
                      aria-label="Changer d'élève"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tuteur Légal :</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEleve.nom_tuteur}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Téléphone :</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEleve.telephone_tuteur}
                    </span>
                  </div>
                </div>

                {/* Financial Summary Bento */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Total Déjà Payé
                    </span>
                    <span className="text-sm font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                      {formatMRU(selectedEleve.total_paid)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Reste à Recouvrer
                    </span>
                    <span className="text-sm font-extrabold font-mono text-rose-600 dark:text-rose-400">
                      {formatMRU(selectedEleve.remaining)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <User className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Aucun élève sélectionné</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recherchez un élève par nom ou matricule ci-dessus pour charger son dossier comptable.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col (7 cols): Payment Terminal Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              2. Enregistrement du Règlement au Comptoir
            </h2>

            <div className="space-y-4 text-xs">
              {/* Montant à encaisser */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Montant à Encaisser (MRU) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={montant}
                    onChange={(e) => setMontant(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 pl-4 pr-16 text-xl font-extrabold font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  />
                  <span className="absolute right-4 top-3 text-sm font-bold font-mono text-slate-400 dark:text-slate-500">
                    MRU
                  </span>
                </div>
              </div>

              {/* Libellé / Échéance */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Motif / Échéance concernée *
                </label>
                <input
                  type="text"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="Ex: Mensualité Février 2026, Inscription, Acompte..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Mode de règlement */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Mode de Règlement *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'especes', label: 'Espèces (Comptant)' },
                    { id: 'bankily', label: 'Bankily (BPM)' },
                    { id: 'masrvi', label: 'Masrvi (BMCI)' },
                    { id: 'cheque', label: 'Chèque' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethode(m.id as MethodePaiement)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                        methode === m.id
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span>{m.label}</span>
                      {methode === m.id && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Référence de transaction pour mobile money ou chèque */}
              {methode !== 'especes' && (
                <div className="animate-scale-in">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Référence de Transaction / N° Chèque (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={referenceOperateur}
                    onChange={(e) => setReferenceOperateur(e.target.value)}
                    placeholder="Ex: TX-992144, N° Chèque 004812..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              )}
            </div>

            {/* Process Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="primary"
                size="lg"
                className={`w-full justify-center gap-2 font-bold text-sm shadow-sm py-3 ${
                  isCaisseCloturee
                    ? 'bg-slate-400 dark:bg-slate-700 text-slate-200 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                disabled={isCaisseCloturee || !selectedEleve}
                onClick={handleProcessPayment}
              >
                {isCaisseCloturee ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Caisse Clôturée - Saisie Verrouillée
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4 text-white" />
                    Valider l'Encaissement ({formatMRU(montant)}) & Générer Reçu
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Reçu de Caisse Officiel Imprimable (Portail centré) */}
      {printedReceipt &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-scale-in">
              {/* Header Reçu */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Reçu Officiel d'Encaissement
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Réf. {printedReceipt.recu_ref}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold px-3 py-1 text-xs">
                  Payé & Confirmé
                </span>
              </div>

              {/* Corps du Reçu */}
              <div className="space-y-4 text-xs">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Élève :</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {printedReceipt.eleve_prenom} {printedReceipt.eleve_nom}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Matricule & Classe :</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      #{printedReceipt.matricule} • {printedReceipt.classe}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Motif :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {printedReceipt.echeance_libelle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Mode de règlement :</span>
                    <span className="font-bold uppercase text-amber-700 dark:text-amber-400">
                      {printedReceipt.methode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Date & Heure :</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {printedReceipt.date} à {printedReceipt.heure}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Caissier :</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {printedReceipt.encaisse_par}
                    </span>
                  </div>
                </div>

                {/* Montant Mis en Avant */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Montant Encaissé
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {formatMRU(printedReceipt.montant)}
                  </span>
                </div>
              </div>

              {/* Actions Reçu */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
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
                  className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    generateReceiptPdf(
                      {
                        recuRef: printedReceipt.recu_ref,
                        datePaiement: `${printedReceipt.date} à ${printedReceipt.heure}`,
                        eleveNom: printedReceipt.eleve_nom,
                        elevePrenom: printedReceipt.eleve_prenom,
                        matricule: printedReceipt.matricule,
                        classe: printedReceipt.classe,
                        libelleEcheance: printedReceipt.echeance_libelle,
                        montant: printedReceipt.montant,
                        methodePaiement: printedReceipt.methode,
                        caissierNom: printedReceipt.encaisse_par,
                        ecoleNom: useAuthStore.getState().ecole?.nom,
                      },
                      'download'
                    );
                    setActiveToast({
                      message: `Reçu ticket #${printedReceipt.recu_ref} téléchargé en PDF.`,
                      type: 'success',
                    });
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Télécharger le Reçu (PDF)
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
