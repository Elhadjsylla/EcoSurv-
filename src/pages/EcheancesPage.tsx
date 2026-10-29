import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { KpiCard } from '../components/ui/KpiCard';
import { Tooltip } from '../components/ui/Tooltip';
import {
  EcheancierConfig,
  FrequenceEcheance,
} from '../types';
import { formatMRU } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useAnneeScolaire } from '../hooks/useAnneeScolaire';
import { useClasses } from '../hooks/useClasses';
import {
  fetchBaremes,
  createBaremeAndGenerateEcheances,
  deleteBareme,
  genererEcheancesManquantes,
  ClasseSansBaremeInfo,
} from '../lib/echeancesHelper';
import { supabase } from '../lib/supabase';
import {
  CreditCard,
  Plus,
  Users,
  CheckCircle2,
  X,
  PlusCircle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  FileText,
  Settings2,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const EcheancesPage: React.FC = () => {
  const authProfile = useAuthStore((s) => s.profile);
  const anneeScolaire = useAnneeScolaire();
  const navigate = useNavigationStore((s) => s.navigate);
  const [echeanciers, setEcheanciers] = useState<EcheancierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const { nomsClasses: availableClasses, isLoading: isLoadingClasses } = useClasses();
  const hasNoClasses = !isLoadingClasses && availableClasses.length === 0;
  const [isGeneratingManquantes, setIsGeneratingManquantes] = useState(false);
  const [isConfirmManquantesOpen, setIsConfirmManquantesOpen] = useState(false);
  const [classesSansBaremeNotice, setClassesSansBaremeNotice] = useState<ClasseSansBaremeInfo[]>([]);

  // Données réelles issues de la base
  const [elevesCouvertsCount, setElevesCouvertsCount] = useState<number>(0);
  const [prochaineEcheance, setProchaineEcheance] = useState<{ date: string; libelle: string } | null>(null);

  const canManage = authProfile?.role === 'directeur' || authProfile?.role === 'super_admin';

  const formatProchaineDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = [
        'Jan.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
      ];
      const day = parseInt(parts[2], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${months[mIdx] || ''}`;
    }
    return dateStr;
  };

  // Form state : champs vides sans valeurs inventées par défaut
  const [newLibelle, setNewLibelle] = useState('');
  const [newClasse, setNewClasse] = useState('');
  const [newMontantTotal, setNewMontantTotal] = useState<number | ''>('');
  const [newFrequence, setNewFrequence] = useState<FrequenceEcheance>('mensuel');
  const [newNombreTranches, setNewNombreTranches] = useState<number>(3);
  const [newDateLimite, setNewDateLimite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation : le bouton est désactivé tant que les champs obligatoires ne sont pas remplis
  const isFormValid = Boolean(
    newLibelle.trim() &&
    newClasse.trim() &&
    typeof newMontantTotal === 'number' &&
    newMontantTotal > 0 &&
    newDateLimite.trim() &&
    newNombreTranches >= 1
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleGenererManquantes = async () => {
    if (isGeneratingManquantes) return;
    if (!anneeScolaire) {
      setErrorMessage("Définissez l'année scolaire dans Configuration avant de continuer");
      return;
    }
    setIsGeneratingManquantes(true);
    setErrorMessage(null);
    setIsConfirmManquantesOpen(false);

    try {
      const res = await genererEcheancesManquantes({ anneeScolaire });

      if (res.echeancesCreees > 0) {
        showToast(`${res.echeancesCreees} échéances créées pour ${res.elevesConcernes} élèves`);
        await loadData();
      } else {
        showToast('Aucune échéance manquante.');
      }

      if (res.classesSansBareme && res.classesSansBareme.length > 0) {
        setClassesSansBaremeNotice(res.classesSansBareme);
      } else {
        setClassesSansBaremeNotice([]);
      }
    } catch (err: any) {
      console.error('[EcheancesPage] Erreur genererEcheancesManquantes:', err);
      const msg = err.message || 'Erreur lors de la génération des échéances manquantes';
      setErrorMessage(msg);
      showToast(`Erreur : ${msg}`);
    } finally {
      setIsGeneratingManquantes(false);
    }
  };

  const loadData = React.useCallback(async () => {
    if (!authProfile?.ecole_id) return;
    const ecoleId = authProfile.ecole_id;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await fetchBaremes(ecoleId);
      setEcheanciers(list);

      // 1. Décompte réel des élèves ayant au moins une échéance enregistrée en base
      const { data: echRows } = await supabase
        .from('echeances')
        .select('eleve_id')
        .eq('ecole_id', ecoleId);

      if (echRows) {
        const uniqueCount = new Set(echRows.map((r: any) => r.eleve_id).filter(Boolean)).size;
        setElevesCouvertsCount(uniqueCount);
      }

      // 2. Prochaine échéance réelle (première date_echeance >= aujourd'hui parmi les échéances non soldées)
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: nextEch } = await supabase
        .from('echeances')
        .select('libelle, date_echeance')
        .eq('ecole_id', ecoleId)
        .neq('statut', 'paye')
        .gte('date_echeance', todayStr)
        .order('date_echeance', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextEch && nextEch.date_echeance) {
        setProchaineEcheance({
          date: nextEch.date_echeance,
          libelle: nextEch.libelle || 'Échéance à venir',
        });
      } else {
        setProchaineEcheance(null);
      }
    } catch (err: any) {
      console.error('[EcheancesPage] Erreur chargement barèmes:', err);
      setErrorMessage(err.message || 'Erreur lors du chargement des barèmes');
    } finally {
      setIsLoading(false);
    }
  }, [authProfile?.ecole_id]);

  // Chargement persistant au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEcheancier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anneeScolaire) {
      setErrorMessage("Définissez l'année scolaire dans Configuration avant de continuer");
      return;
    }
    if (!isFormValid || typeof newMontantTotal !== 'number') return;

    if (!authProfile?.ecole_id) {
      setErrorMessage("Aucun établissement rattaché à votre profil.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { bareme, generatedEcheancesCount } = await createBaremeAndGenerateEcheances(
        authProfile.ecole_id,
        {
          libelle: newLibelle.trim(),
          classe: newClasse,
          montant_total: Number(newMontantTotal),
          frequence: newFrequence,
          nombre_tranches: Number(newNombreTranches),
          date_limite_prochaine: newDateLimite,
        },
        anneeScolaire
      );

      setEcheanciers((prev) => [bareme, ...prev.filter((b) => b.id !== bareme.id)]);

      if (generatedEcheancesCount > 0) {
        showToast(
          `Échéancier "${bareme.libelle}" créé : ${generatedEcheancesCount} échéances individuelles générées pour les élèves de ${bareme.classe}.`
        );
      } else {
        showToast(
          `Échéancier "${bareme.libelle}" créé pour la classe ${bareme.classe} (sera rattaché automatiquement à chaque nouvel élève).`
        );
      }

      setIsModalOpen(false);
      setNewLibelle('');
      setNewClasse('');
      setNewMontantTotal('');
      setNewDateLimite('');
    } catch (err: any) {
      console.error('[EcheancesPage] Erreur création barème:', err);
      const msg = err.message || 'Erreur inconnue';
      setErrorMessage(msg);
      showToast(`Erreur : ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBareme = async (ech: EcheancierConfig) => {
    setOpenMenuRowId(null);
    if (!window.confirm(`Confirmez-vous la suppression du barème "${ech.libelle}" ?`)) {
      return;
    }

    try {
      if (authProfile?.ecole_id) {
        await deleteBareme(authProfile.ecole_id, ech.id);
        setEcheanciers((prev) => prev.filter((item) => item.id !== ech.id));
        showToast(`Barème "${ech.libelle}" supprimé.`);
      } else {
        setEcheanciers((prev) => prev.filter((item) => item.id !== ech.id));
        showToast(`Barème "${ech.libelle}" supprimé.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur suppression barème');
      showToast(`Erreur : ${err.message}`);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative" aria-busy={isLoading}>
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

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Échéances & Tarifs de Scolarité
            </h1>
            {anneeScolaire && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/60">
                Année {anneeScolaire}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Configuration des frais de scolarité, des mensualités et des calendriers d'échéances par classe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-10 px-4 font-semibold text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isGeneratingManquantes || !anneeScolaire}
              title={!anneeScolaire ? "Définissez l'année scolaire dans Configuration avant de continuer" : undefined}
              onClick={() => {
                if (!anneeScolaire) return;
                setIsConfirmManquantesOpen(true);
              }}
            >
              {isGeneratingManquantes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Générer les échéances manquantes</span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            className="gap-2 h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!anneeScolaire || hasNoClasses}
            title={
              !anneeScolaire
                ? "Définissez l'année scolaire dans Configuration avant de continuer"
                : hasNoClasses
                ? "Aucune classe définie. Ajoutez vos classes dans Configuration > Classes."
                : undefined
            }
            onClick={() => {
              if (!anneeScolaire || hasNoClasses) return;
              setErrorMessage(null);
              setNewLibelle('');
              setNewClasse('');
              setNewMontantTotal('');
              setNewDateLimite('');
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            + Nouvelle Échéance
          </Button>
        </div>
      </div>

      {/* Garde année scolaire vide */}
      {!anneeScolaire && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Définissez l'année scolaire dans Configuration avant de continuer</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('config')}
            className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-white shrink-0 cursor-pointer"
          >
            Aller dans Configuration
          </button>
        </div>
      )}

      {/* Garde aucune classe définie */}
      {hasNoClasses && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Aucune classe définie. Ajoutez vos classes dans Configuration &gt; Classes.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('config')}
            className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-white shrink-0 cursor-pointer"
          >
            Aller dans Configuration
          </button>
        </div>
      )}

      {/* Classes Sans Barème Notice */}
      {classesSansBaremeNotice.length > 0 && (
        <div className="flex items-start justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold block">Classes sans barème :</span>
              <ul className="list-disc list-inside space-y-0.5">
                {classesSansBaremeNotice.map((c, i) => (
                  <li key={i}>
                    Classes sans barème : <span className="font-semibold">{c.classe}</span> ({c.eleves} élève{c.eleves > 1 ? 's' : ''}). Créez un barème pour ces classes.
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => setClassesSansBaremeNotice([])}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 ml-2"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 p-4 rounded-xl border border-red-200 dark:border-red-800/60 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Erreur base de données : </span>
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metric Tiles (100% données réelles Supabase) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          staggerIndex={0}
          title="Échéanciers Actifs"
          amount={echeanciers.length}
          unit="count"
          subtitle="Configurations par niveau"
          icon={<CreditCard className="h-5 w-5" />}
          variant="primary"
        />

        <KpiCard
          staggerIndex={1}
          title="Élèves Couverts"
          amount={elevesCouvertsCount}
          unit="count"
          subtitle="Élèves avec au moins une échéance"
          icon={<Users className="h-5 w-5" />}
          variant="success"
        />

        <Card className="p-5 sm:p-6 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/75 dark:bg-amber-950/35 flex flex-col justify-between shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-snug">
                Prochaine Échéance
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/60 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                <Clock className="h-5 w-5 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono truncate">
              {prochaineEcheance ? formatProchaineDate(prochaineEcheance.date) : '—'}
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block truncate">
              {prochaineEcheance ? prochaineEcheance.libelle : 'Aucune échéance à venir'}
            </span>
          </div>
        </Card>
      </div>

      {/* Table of Configured Schedules */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Plans d'Échéances & Tarifs Configurés ({echeanciers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Calendrier officiel des paiements par classe
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-5">Libellé du Plan</th>
                <th className="py-4 px-5">Classe Cible</th>
                <th className="py-4 px-5 text-right">Montant Total</th>
                <th className="py-4 px-5 text-center">Fréquence</th>
                <th className="py-4 px-5 text-center">Tranches</th>
                <th className="py-4 px-5 text-right">Montant / Tranche</th>
                <th className="py-4 px-5 text-center">Prochaine Limite</th>
                <th className="py-4 px-5 text-center">Élèves Concernés</th>
                <th className="py-4 px-4 text-center w-14">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {echeanciers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="py-8 px-4 text-center space-y-3 max-w-md mx-auto">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Aucun barème d'échéances configuré
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Définissez vos tarifs annuels et les mensualités par classe pour activer la facturation automatique de votre école.
                      </p>
                      <Button
                        variant="primary"
                        disabled={!anneeScolaire || hasNoClasses}
                        title={
                          !anneeScolaire
                            ? "Définissez l'année scolaire dans Configuration avant de continuer"
                            : hasNoClasses
                            ? "Aucune classe définie. Ajoutez vos classes dans Configuration > Classes."
                            : undefined
                        }
                        onClick={() => {
                          if (!anneeScolaire || hasNoClasses) return;
                          setIsModalOpen(true);
                        }}
                        className="gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                        Créer un premier barème
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                echeanciers.map((ech) => {
                const isMenuOpen = openMenuRowId === ech.id;
                return (
                  <tr key={ech.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Libellé sur 2 lignes */}
                    <td className="py-4.5 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {ech.libelle}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        Concerne la classe {ech.classe}
                      </div>
                    </td>

                    {/* Classe Cible Badge */}
                    <td className="py-4.5 px-5">
                      <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                        {ech.classe}
                      </span>
                    </td>

                    {/* Montant Total */}
                    <td className="py-4.5 px-5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap text-xs">
                      {formatMRU(ech.montant_total)}
                    </td>

                    {/* Fréquence */}
                    <td className="py-4.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          ech.frequence === 'mensuel'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : ech.frequence === 'trimestriel'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {ech.frequence}
                      </span>
                    </td>

                    {/* Tranches */}
                    <td className="py-4.5 px-5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      {ech.nombre_tranches} tranche(s)
                    </td>

                    {/* Montant / Tranche */}
                    <td className="py-4.5 px-5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-xs">
                      {formatMRU(ech.montant_par_tranche)}
                    </td>

                    {/* Prochaine Limite */}
                    <td className="py-4.5 px-5 text-center font-mono text-slate-600 dark:text-slate-400 text-xs">
                      {ech.date_limite_prochaine}
                    </td>

                    {/* Élèves Concernés */}
                    <td className="py-4.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs">
                        <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        {ech.nb_eleves_concernes}
                      </span>
                    </td>

                    {/* Actions Context Menu "..." */}
                    <td className="py-4.5 px-4 text-center relative">
                      <Tooltip content="Options">
                        <button
                          type="button"
                          onClick={() => setOpenMenuRowId(isMenuOpen ? null : ech.id)}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors mx-auto"
                          aria-label="Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </Tooltip>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-xs text-left animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              showToast(`Paramètres de l'échéance "${ech.libelle}" ouverts.`);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold"
                          >
                            <Settings2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Modifier le plan</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              showToast(`Appels de fonds générés pour ${ech.nb_eleves_concernes} élèves (${ech.classe}).`);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Émettre appels de fonds</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuRowId(null);
                              window.print();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-t border-slate-100 dark:border-slate-700"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Imprimer l'échéancier</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBareme(ech)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-t border-slate-100 dark:border-slate-700"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Supprimer le barème</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Échéance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Nouvelle Échéance de Scolarité
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!anneeScolaire && (
              <div className="flex flex-col gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs">
                <span className="font-semibold">
                  Définissez l'année scolaire dans Configuration avant de continuer
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('config');
                  }}
                  className="text-left font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 cursor-pointer"
                >
                  Aller dans Configuration
                </button>
              </div>
            )}

            {hasNoClasses && (
              <div className="flex flex-col gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs">
                <span className="font-semibold">
                  Aucune classe définie. Ajoutez vos classes dans Configuration &gt; Classes.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('config');
                  }}
                  className="text-left font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 cursor-pointer"
                >
                  Aller dans Configuration
                </button>
              </div>
            )}

            <form onSubmit={handleCreateEcheancier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Libellé du Plan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frais Année Scolaire Terminales"
                  value={newLibelle}
                  onChange={(e) => setNewLibelle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classe Cible <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newClasse}
                  onChange={setNewClasse}
                  options={availableClasses.map((cls) => ({ value: cls, label: cls }))}
                  placeholder="Sélectionner une classe..."
                  size="sm"
                  disabled={hasNoClasses}
                  emptyMessage="Aucune classe définie. Ajoutez vos classes dans Configuration > Classes."
                  triggerClassName="w-full h-9 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant Total (MRU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Ex: 30000"
                    value={newMontantTotal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewMontantTotal(val === '' ? '' : Number(val));
                    }}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fréquence <span className="text-red-500">*</span>
                  </label>
                  <Select<FrequenceEcheance>
                    value={newFrequence}
                    onChange={setNewFrequence}
                    options={[
                      { value: 'mensuel', label: 'Mensuel' },
                      { value: 'trimestriel', label: 'Trimestriel' },
                      { value: 'annuel', label: 'Annuel' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de Tranches
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newNombreTranches}
                    onChange={(e) => setNewNombreTranches(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    1ère Échéance / Limite <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDateLimite}
                    onChange={(e) => setNewDateLimite(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !isFormValid || !anneeScolaire || hasNoClasses}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Créer l'Échéancier
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Génération des échéances manquantes */}
      {isConfirmManquantesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Générer les échéances manquantes
              </h3>
              <button
                onClick={() => setIsConfirmManquantesOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                disabled={isGeneratingManquantes}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Crée les tranches manquantes pour les élèves qui n'en ont pas, selon les barèmes existants. Les échéances et paiements déjà enregistrés ne sont jamais modifiés.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmManquantesOpen(false)}
                disabled={isGeneratingManquantes}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="gap-1.5"
                disabled={isGeneratingManquantes || !anneeScolaire}
                onClick={handleGenererManquantes}
              >
                {isGeneratingManquantes ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmer la génération</span>
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
