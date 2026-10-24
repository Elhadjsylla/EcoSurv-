import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ToastNotification } from '../components/ui/ToastNotification';
import { StudentInitials } from '../components/ui/StudentInitials';
import { formatMRU } from '../lib/utils';
import {
  PaiementEnAttente,
  listerPaiementsEnAttente,
  confirmerPaiement,
  rejeterPaiement,
} from '../lib/paiements';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

export const PaiementsAttentePage: React.FC = () => {
  const [paiements, setPaiements] = useState<PaiementEnAttente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // État de soumission par ligne (ID du paiement en cours de confirmation ou de rejet)
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Modales
  const [confirmModalItem, setConfirmModalItem] = useState<PaiementEnAttente | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<PaiementEnAttente | null>(null);
  const [rejectMotif, setRejectMotif] = useState<string>('');
  const [rejectStatutFinal, setRejectStatutFinal] = useState<'echoue' | 'annule'>('echoue');
  const [rejectMotifTouched, setRejectMotifTouched] = useState<boolean>(false);

  // Notification Toast
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const fetchPaiements = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await listerPaiementsEnAttente();
      setPaiements(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Impossible de charger les paiements en attente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaiements();
  }, [fetchPaiements]);

  // Déclencher confirmation
  const handleConfirm = async () => {
    if (!confirmModalItem || submittingId) return;
    const targetId = confirmModalItem.id;
    setSubmittingId(targetId);

    try {
      const result = await confirmerPaiement(targetId);
      const eleveNom = confirmModalItem.eleve
        ? `${confirmModalItem.eleve.prenom} ${confirmModalItem.eleve.nom}`
        : 'l’élève';

      setActiveToast({
        message: `Paiement de ${formatMRU(result.montant)} confirmé avec succès pour ${eleveNom}. Nouveau solde restant : ${formatMRU(result.nouveauSoldeRestant)}.`,
        type: 'success',
      });

      setConfirmModalItem(null);
      await fetchPaiements();

      // Notifier la sidebar et le tableau de bord directeur
      window.dispatchEvent(new CustomEvent('ecosurv:pending-payments-changed'));
      window.dispatchEvent(new CustomEvent('ecosurv:finances-updated'));
    } catch (err: any) {
      setActiveToast({
        message: err?.message || 'Erreur lors de la confirmation du paiement.',
        type: 'error',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  // Déclencher rejet
  const handleReject = async () => {
    if (!rejectModalItem || submittingId) return;
    const trimmedMotif = rejectMotif.trim();
    if (trimmedMotif.length < 3) {
      setRejectMotifTouched(true);
      return;
    }

    const targetId = rejectModalItem.id;
    setSubmittingId(targetId);

    try {
      const result = await rejeterPaiement(targetId, trimmedMotif, rejectStatutFinal);
      const statutLabel = result.statut === 'annule' ? 'annulé' : 'rejeté (échoué)';

      setActiveToast({
        message: `Paiement ${statutLabel} avec succès. Solde disponible rétabli : ${formatMRU(result.soldeDisponibleApres)}.`,
        type: 'success',
      });

      setRejectModalItem(null);
      setRejectMotif('');
      setRejectMotifTouched(false);
      await fetchPaiements();

      // Notifier la sidebar et le tableau de bord directeur
      window.dispatchEvent(new CustomEvent('ecosurv:pending-payments-changed'));
      window.dispatchEvent(new CustomEvent('ecosurv:finances-updated'));
    } catch (err: any) {
      setActiveToast({
        message: err?.message || 'Erreur lors du rejet du paiement.',
        type: 'error',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const formatMethode = (methode: string) => {
    switch (methode?.toLowerCase()) {
      case 'especes':
        return 'Espèces';
      case 'bankily':
        return 'Bankily';
      case 'masrvi':
        return 'Masrvi';
      case 'sedad':
        return 'Sedad';
      case 'virement':
        return 'Virement';
      case 'cheque':
        return 'Chèque';
      default:
        return methode || 'Autre';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {activeToast && (
        <ToastNotification
          message={activeToast.message}
          type={activeToast.type}
          duration={5000}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Paiements en attente
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Validation et rapprochement des paiements en attente de confirmation pour votre établissement.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPaiements}
            disabled={isLoading || !!submittingId}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Message d'erreur global si RLS ou réseau */}
      {errorMessage && (
        <div className="p-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900/60 text-red-800 dark:text-red-300 flex items-start gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-semibold">Erreur de chargement</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPaiements}
            className="text-xs border-red-300 text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* État de chargement */}
      {isLoading && (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Chargement des paiements en attente...</p>
          </div>
        </Card>
      )}

      {/* État vide */}
      {!isLoading && !errorMessage && paiements.length === 0 && (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
            <CheckCircle2 className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-1" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Aucun paiement en attente.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tous les paiements enregistrés ont déjà été traités ou aucun versement n’est en attente de confirmation.
            </p>
          </div>
        </Card>
      )}

      {/* Affichage mobile / tablette (< 1024px) en cartes */}
      {!isLoading && paiements.length > 0 && (
        <div className="lg:hidden space-y-4">
          {paiements.map((p) => {
            const isCurrentSubmitting = submittingId === p.id;
            const hasEleve = !!p.eleve;
            return (
              <Card key={p.id} className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                {/* En-tête de la carte : élève et montant */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {hasEleve ? (
                      <>
                        <StudentInitials
                          nom={p.eleve!.nom}
                          prenom={p.eleve!.prenom}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {p.eleve!.prenom} {p.eleve!.nom}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="font-mono">{p.eleve!.matricule}</span>
                            <span>•</span>
                            <span>{p.eleve!.classe || 'Classe non assignée'}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-400 italic text-sm">Élève non résolu</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {formatMRU(p.montant)}
                    </div>
                    {p.numero_recu && (
                      <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        #{p.numero_recu}
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails en grille 2 colonnes */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Échéance</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {p.echeance?.libelle || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Méthode &amp; Réf.</span>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px] border border-slate-200 dark:border-slate-700">
                        {formatMethode(p.methode as string)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-full">
                        {p.reference_transaction || 'Aucune référence'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Date de saisie</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatDate(p.paye_le || p.created_at)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Encaissé par</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block">
                      {p.encaisseur_nom || '—'}
                    </span>
                  </div>
                </div>

                {/* Boutons toujours visibles en bas de la carte */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isCurrentSubmitting || !!submittingId}
                    onClick={() => setConfirmModalItem(p)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs py-2 h-auto justify-center"
                  >
                    {isCurrentSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Confirmer
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isCurrentSubmitting || !!submittingId}
                    onClick={() => {
                      setRejectModalItem(p);
                      setRejectMotif('');
                      setRejectStatutFinal('echoue');
                      setRejectMotifTouched(false);
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-700 gap-1.5 text-xs py-2 h-auto justify-center"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rejeter
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tableau des paiements (>= 1024px) */}
      {!isLoading && paiements.length > 0 && (
        <Card className="hidden lg:block overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Élève</th>
                  <th className="py-3 px-3">Classe</th>
                  <th className="py-3 px-3">Échéance</th>
                  <th className="py-3 px-3">Montant</th>
                  <th className="py-3 px-3">Méthode</th>
                  <th className="py-3 px-3">Date de saisie</th>
                  <th className="py-3 px-3">N° Reçu</th>
                  <th className="py-3 px-3">Encaissé par</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paiements.map((p) => {
                  const isCurrentSubmitting = submittingId === p.id;
                  const hasEleve = !!p.eleve;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Élève */}
                      <td className="py-3 px-3">
                        {hasEleve ? (
                          <div className="flex items-center gap-2">
                            <StudentInitials
                              nom={p.eleve!.nom}
                              prenom={p.eleve!.prenom}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {p.eleve!.prenom} {p.eleve!.nom}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {p.eleve!.matricule}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Élève non résolu</span>
                        )}
                      </td>

                      {/* Classe */}
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {p.eleve?.classe || '—'}
                      </td>

                      {/* Échéance */}
                      <td className="py-3 px-3">
                        {p.echeance ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {p.echeance.libelle}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Total : {formatMRU(p.echeance.montant)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Échéance introuvable</span>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatMRU(p.montant)}
                      </td>

                      {/* Méthode & Réf. Transaction fusionnée */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700">
                            {formatMethode(p.methode as string)}
                          </span>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[130px]" title={p.reference_transaction || undefined}>
                            {p.reference_transaction ? (
                              <span className="text-slate-700 dark:text-slate-300 select-all font-semibold">{p.reference_transaction}</span>
                            ) : (
                              <span className="text-slate-400 italic">Aucune référence</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date de saisie */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(p.paye_le || p.created_at)}
                      </td>

                      {/* N° Reçu (une seule ligne, police monospace petite) */}
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {p.numero_recu ? (
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">
                            #{p.numero_recu}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Encaissé par */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap truncate max-w-[120px]">
                        {p.encaisseur_nom ? (
                          <span>{p.encaisseur_nom}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isCurrentSubmitting || !!submittingId}
                            onClick={() => setConfirmModalItem(p)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs py-1 px-2.5 h-auto"
                          >
                            {isCurrentSubmitting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Confirmer
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCurrentSubmitting || !!submittingId}
                            onClick={() => {
                              setRejectModalItem(p);
                              setRejectMotif('');
                              setRejectStatutFinal('echoue');
                              setRejectMotifTouched(false);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-700 gap-1 text-xs py-1 px-2.5 h-auto"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rejeter
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Confirmation de Paiement */}
      {confirmModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingId) {
              setConfirmModalItem(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-5 w-5" />
                <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Confirmer le paiement
                </h2>
              </div>
              <button
                disabled={!!submittingId}
                onClick={() => setConfirmModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Récapitulatif */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-md p-3.5 space-y-2 text-xs border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Élève :</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {confirmModalItem.eleve
                    ? `${confirmModalItem.eleve.prenom} ${confirmModalItem.eleve.nom} (${confirmModalItem.eleve.matricule})`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Montant à encaisser :</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatMRU(confirmModalItem.montant)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Méthode :</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatMethode(confirmModalItem.methode as string)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Référence opérateur :</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {confirmModalItem.reference_transaction || 'Aucune'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Échéance ciblée :</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {confirmModalItem.echeance?.libelle || '—'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cette action validera définitivement le règlement, soldera le montant correspondant sur l'échéance et confirmera le reçu.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                disabled={!!submittingId}
                onClick={() => setConfirmModalItem(null)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!!submittingId}
                onClick={handleConfirm}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {submittingId === confirmModalItem.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirmation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmer le paiement
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet de Paiement */}
      {rejectModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingId) {
              setRejectModalItem(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-dialog-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <h2 id="reject-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Rejeter le paiement
                </h2>
              </div>
              <button
                disabled={!!submittingId}
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Récapitulatif succint */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-md p-3 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Élève :</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {rejectModalItem.eleve
                    ? `${rejectModalItem.eleve.prenom} ${rejectModalItem.eleve.nom}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant déclaré :</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatMRU(rejectModalItem.montant)}
                </span>
              </div>
            </div>

            {/* Choix du statut final */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Statut après traitement :
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  rejectStatutFinal === 'echoue'
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="statutFinal"
                    value="echoue"
                    checked={rejectStatutFinal === 'echoue'}
                    onChange={() => setRejectStatutFinal('echoue')}
                    disabled={!!submittingId}
                    className="accent-red-600"
                  />
                  <span>Non reçu / échoué</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  rejectStatutFinal === 'annule'
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="statutFinal"
                    value="annule"
                    checked={rejectStatutFinal === 'annule'}
                    onChange={() => setRejectStatutFinal('annule')}
                    disabled={!!submittingId}
                    className="accent-red-600"
                  />
                  <span>Annulé</span>
                </label>
              </div>
            </div>

            {/* Motif obligatoire */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Motif du rejet (obligatoire) :</span>
                <span className="text-[10px] text-slate-400">Min. 3 caractères</span>
              </label>
              <textarea
                value={rejectMotif}
                onChange={(e) => {
                  setRejectMotif(e.target.value);
                  if (!rejectMotifTouched) setRejectMotifTouched(true);
                }}
                disabled={!!submittingId}
                placeholder="Ex : Virement non reçu sur le compte bancaire, doublon de saisie..."
                rows={3}
                className={`w-full rounded-md border p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 ${
                  rejectMotifTouched && rejectMotif.trim().length < 3
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {rejectMotifTouched && rejectMotif.trim().length < 3 && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                  Le motif doit comporter au moins 3 caractères.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                disabled={!!submittingId}
                onClick={() => setRejectModalItem(null)}
              >
                Retour
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!!submittingId || rejectMotif.trim().length < 3}
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                {submittingId === rejectModalItem.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rejet en cours...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Confirmer le rejet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
