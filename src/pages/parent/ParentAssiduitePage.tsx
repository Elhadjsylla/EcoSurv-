import React, { useState } from 'react';
import { AbsenceRecord } from '../../types';
import { useAnneeScolaire } from '../../hooks/useAnneeScolaire';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { KpiCard } from '../../components/ui/KpiCard';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  FileCheck,
  Calendar,
} from 'lucide-react';

import { useParentChildren } from '../../hooks/useParentChildren';
import { DeclarationAbsenceModal } from '../../components/parent/DeclarationAbsenceModal';
import { MesDeclarations } from '../../components/parent/MesDeclarations';

interface ParentAssiduitePageProps {
  selectedChildId: string;
  onSelectChild?: (id: string) => void;
}

export const ParentAssiduitePage: React.FC<ParentAssiduitePageProps> = ({
  selectedChildId,
  onSelectChild,
}) => {
  const anneeScolaire = useAnneeScolaire();
  const { activeChild, children: enfantsLies, errorMessage: childrenError } = useParentChildren(selectedChildId, onSelectChild || (() => {}));

  // Récupération des absences de l'enfant depuis Supabase (tous les hooks appelés inconditionnellement)
  const [absencesList, setAbsencesList] = useState<AbsenceRecord[]>([]);

  React.useEffect(() => {
    if (!activeChild?.id) return;
    const fetchAbsences = async () => {
      try {
        const { data, error } = await supabase
          .from('absences')
          .select('*')
          .eq('eleve_id', activeChild.id)
          .order('date_absence', { ascending: false });

        if (!error && data) {
          setAbsencesList(
            data.map((a: any) => ({
              id: a.id,
              eleve_id: a.eleve_id,
              eleve_nom: activeChild.nom,
              eleve_prenom: activeChild.prenom,
              classe: activeChild.classe,
              date_absence: a.date_absence,
              creneau: (a.creneau === 'matin' || a.creneau === 'apres_midi' ? a.creneau : 'matin') as 'matin' | 'apres_midi',
              type: a.type || 'absence',
              justifiee: Boolean(a.justifiee),
              motif: a.motif || (a.justifiee ? 'Justifiée' : 'Non justifié'),
            }))
          );
        }
      } catch (err) {
        console.warn('[ParentAssiduitePage] Erreur lecture absences:', err);
      }
    };
    fetchAbsences();
  }, [activeChild?.id, activeChild?.nom, activeChild?.prenom, activeChild?.classe]);

  // Modal de déclaration
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Incrémenté après chaque envoi réussi : « Mes déclarations » se recharge alors depuis la base.
  const [rechargement, setRechargement] = useState(0);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  if (childrenError) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Impossible de charger les données d'assiduité
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {childrenError}
          </p>
        </div>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-stagger-rise">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-primary-text dark:text-primary-text flex items-center justify-center mx-auto shadow-sm">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Aucun élève rattaché pour le moment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Votre espace famille est actif. Le relevé d'assiduité, les absences et les déclarations de justificatifs d'absence de vos enfants apparaîtront ici.
          </p>
          <div className="flex flex-col items-center gap-2 pt-2">
            <Button disabled>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Déclarer une absence
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disponible dès qu’un élève est rattaché à votre compte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const enfant = {
    id: activeChild.id,
    nom: activeChild.nom,
    prenom: activeChild.prenom,
    classe: activeChild.classe,
    matricule: activeChild.matricule,
    photo_initiales: activeChild.photo_initiales,
    rang: '-',
    moyenne_generale: 0,
    reste_a_payer: activeChild.remaining,
    statut_paiement: activeChild.remaining === 0 ? 'paye' : 'partiel',
    total_regle: activeChild.total_paid,
    bulletin: [],
    emploi_du_temps_aujourdhui: [],
    nb_absences_total: 0,
    nb_retards_total: 0,
  };

  const totalAbsences = absencesList.filter((a) => a.type === 'absence').length;
  const justifiees = absencesList.filter((a) => a.justifiee).length;
  const nonJustifiees = totalAbsences - justifiees;

  // Appelée uniquement quand la base a confirmé l'insertion (ligne retournée par l'insert).
  const handleDeclarationEnvoyee = (eleveId: string) => {
    setIsModalOpen(false);
    if (eleveId !== activeChild.id) onSelectChild?.(eleveId);
    setRechargement((n) => n + 1);
    setActiveToast({ message: 'Déclaration envoyée', type: 'success' });
  };

  const enfantsDeclarables = enfantsLies.map((c) => ({
    id: c.id,
    prenom: c.prenom,
    nom: c.nom,
    classe: c.classe,
  }));

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed inset-x-4 bottom-4 z-[60] sm:inset-x-auto sm:bottom-6 sm:right-6">
          <ToastNotification
            message={activeToast.message}
            type={activeToast.type}
            onClose={() => setActiveToast(null)}
          />
        </div>
      )}

      {/* Header Banner - Nexoov DA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-primary-text dark:bg-blue-950/60 dark:text-primary-text border border-blue-200 dark:border-blue-800">
              Vie Scolaire
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Registre d'assiduité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Assiduité & Absences — {enfant.prenom} {enfant.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Suivi des présences en temps réel. Justifiez une absence ou déclarez un empêchement directement à l'établissement.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs gap-2 shadow-sm py-2.5 px-4 rounded-xl shrink-0 transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Déclarer une Absence
        </Button>
      </div>

      {/* 3 Cartes KPI Pastel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Absences"
          customValue={`${totalAbsences} séance(s)`}
          subtitle="Depuis la rentrée scolaire"
          icon={<CalendarCheck className="w-5 h-5" />}
          variant="purple"
        />

        <KpiCard
          title="Absences Justifiées"
          customValue={justifiees}
          subtitle="Validées par l'administration"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />

        <KpiCard
          title="À Justifier"
          customValue={nonJustifiees}
          subtitle={
            nonJustifiees > 0
              ? 'Justificatif requis rapidement'
              : "Dossier d'assiduité en règle"
          }
          icon={<AlertCircle className="w-5 h-5" />}
          variant={nonJustifiees > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Historique des Absences */}
      <Card className="p-6 sm:p-8 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-primary-text dark:text-primary-text border border-blue-100 dark:border-blue-900/40">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Registre des Absences et Retards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historique chronologique des événements scolaires
              </p>
            </div>
          </div>
          {anneeScolaire && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Année {anneeScolaire}
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          {absencesList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.justifiee
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                      : 'bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60'
                  }`}
                >
                  {item.justifiee ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>{item.type === 'absence' ? 'Absence' : 'Retard'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Date constatée : <strong className="font-semibold text-slate-700 dark:text-slate-300">{item.date_absence}</strong></span>
                  </div>
                  {item.motif && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic bg-slate-50 dark:bg-slate-800/60 py-1 px-2.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                      Motif : « {item.motif} »
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {item.justifiee ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <FileCheck className="h-3.5 w-3.5" /> Justifiée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <AlertCircle className="h-3.5 w-3.5" /> Non justifiée
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mes déclarations (lues depuis la base) */}
      <MesDeclarations
        eleveId={activeChild.id}
        eleveNom={`${enfant.prenom} ${enfant.nom}`}
        rechargement={rechargement}
        onDeclarer={() => setIsModalOpen(true)}
        onNotice={(message, type) => setActiveToast({ message, type })}
      />

      {/* Déclaration d'absence : enregistrée en base, jamais simulée */}
      <DeclarationAbsenceModal
        open={isModalOpen}
        enfants={enfantsDeclarables}
        eleveIdInitial={activeChild.id}
        onClose={() => setIsModalOpen(false)}
        onSent={handleDeclarationEnvoyee}
      />
    </div>
  );
};
