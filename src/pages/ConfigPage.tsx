import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { Tooltip } from '../components/ui/Tooltip';
import { ToastNotification } from '../components/ui/ToastNotification';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { formatDate } from '../lib/format';
import { useEcole, useModifierEcole, type EcoleModifiable } from '../data/ecole';
import { useMembresPersonnel } from '../data/personnel';
import { messageErreurDonnees } from '../data/errors';
import type { RoleUtilisateur, StatutAbonnement } from '../types/database';
import {
  Save,
  Building2,
  Users,
  UserPlus,
  GraduationCap,
  ShieldCheck,
  School,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const roleLabels: Record<RoleUtilisateur, { label: string; badge: string }> = {
  super_admin: { label: 'Super Admin', badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60' },
  directeur: { label: 'Directeur', badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60' },
  caissier: { label: 'Caissier', badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60' },
  enseignant: { label: 'Enseignant', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60' },
  parent: { label: 'Parent', badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

const abonnementLabels: Record<StatutAbonnement, { label: string; badge: string }> = {
  actif: { label: 'Abonnement actif', badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' },
  essai: { label: "Période d'essai", badge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' },
  suspendu: { label: 'Abonnement suspendu', badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
  expire: { label: 'Abonnement expiré', badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
  annule: { label: 'Abonnement annulé', badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
};

type FormEcole = { [K in keyof EcoleModifiable]: string };

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none';

export const ConfigPage: React.FC = () => {
  const ecole = useEcole();
  const modifier = useModifierEcole();
  const personnel = useMembresPersonnel();

  const [form, setForm] = useState<FormEcole | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!ecole.data) return;
    setForm({
      nom: ecole.data.nom,
      ville: ecole.data.ville ?? '',
      adresse: ecole.data.adresse ?? '',
      telephone: ecole.data.telephone ?? '',
      email: ecole.data.email ?? '',
      annee_scolaire: ecole.data.annee_scolaire ?? '',
    });
  }, [ecole.data]);

  const membres = personnel.data ?? [];
  const totalPages = Math.max(1, Math.ceil(membres.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const membresPage = membres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const nbEnseignants = membres.filter((m) => m.role === 'enseignant').length;
  const nbGestion = membres.filter((m) => m.role === 'directeur' || m.role === 'caissier').length;

  if (ecole.isLoading) return <LoadingState />;
  if (ecole.error || !ecole.data) return <ErrorState error={ecole.error} onRetry={() => void ecole.refetch()} />;

  const abonnement = abonnementLabels[ecole.data.statut_abonnement];
  const update = (key: keyof FormEcole, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      await modifier.mutateAsync(form);
      setToast("Coordonnées de l'établissement enregistrées.");
    } catch {
      // Message affiché sous le formulaire.
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {toast && <ToastNotification message={toast} type="success" onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Configuration Établissement & Personnel
            </h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${abonnement.badge}`}>
              {abonnement.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Coordonnées de l'école, année scolaire active et personnel habilité.
          </p>
        </div>

        <ComingSoon detail="création des comptes par une fonction serveur">
          <Button variant="primary" size="sm" className="gap-2 shrink-0 shadow-xs" disabled>
            <UserPlus className="h-4 w-4" />
            Inviter un membre
          </Button>
        </ComingSoon>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Personnel habilité"
          amount={membres.length}
          unit="count"
          subtitle="Comptes de l'établissement (hors parents)"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />
        <KpiCard
          title="Corps enseignant"
          amount={nbEnseignants}
          unit="count"
          subtitle="Enseignants avec leurs classes"
          icon={<GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Direction & caisse"
          amount={nbGestion}
          unit="count"
          subtitle="Directeurs et caissiers"
          icon={<ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />
        <KpiCard
          title="Année scolaire"
          customValue={ecole.data.annee_scolaire ?? '—'}
          subtitle={ecole.data.ville ?? 'Ville non renseignée'}
          icon={<School className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          variant="default"
        />
      </div>

      {form && (
        <Card className="p-6 sm:p-8 space-y-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profil de l'établissement</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="ecole-nom" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom officiel de l'école <span className="text-red-500">*</span>
                </label>
                <input id="ecole-nom" type="text" required value={form.nom} onChange={(e) => update('nom', e.target.value)} className={`${inputClass} font-bold`} />
              </div>
              <div>
                <label htmlFor="ecole-annee" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Année scolaire active
                </label>
                <input
                  id="ecole-annee"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}-\d{4}"
                  placeholder="2025-2026"
                  value={form.annee_scolaire}
                  onChange={(e) => update('annee_scolaire', e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="ecole-ville" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ville / Commune
                </label>
                <input id="ecole-ville" type="text" value={form.ville} onChange={(e) => update('ville', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="ecole-tel" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Téléphone officiel
                </label>
                <input id="ecole-tel" type="tel" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label htmlFor="ecole-email" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email de contact
                </label>
                <input id="ecole-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="ecole-adresse" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse physique
              </label>
              <input id="ecole-adresse" type="text" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} className={inputClass} />
            </div>

            {modifier.error && (
              <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {messageErreurDonnees(modifier.error)}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" className="gap-2" loading={modifier.isPending} loadingText="Enregistrement...">
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Annuaire du personnel ({membres.length})</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Modification des accès disponible prochainement
          </span>
        </div>

        {personnel.isLoading ? (
          <LoadingState label="Chargement du personnel…" />
        ) : personnel.error ? (
          <ErrorState error={personnel.error} onRetry={() => void personnel.refetch()} />
        ) : membres.length === 0 ? (
          <EmptyState title="Aucun membre du personnel" className="m-6" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-6">Membre du personnel</th>
                    <th className="py-4 px-6">Rôle</th>
                    <th className="py-4 px-6">Classes</th>
                    <th className="py-4 px-6">Téléphone</th>
                    <th className="py-4 px-6 text-center">Ajouté le</th>
                    <th className="py-4 px-6 text-center">Compte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {membresPage.map((member) => {
                    const roleInfo = roleLabels[member.role];
                    const initials = `${(member.prenom ?? '').charAt(0)}${member.nom.charAt(0)}`.toUpperCase();
                    const nom = [member.prenom, member.nom].filter(Boolean).join(' ');
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 min-w-[240px]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <Tooltip content={nom} as="div" className="block min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{nom}</div>
                              </Tooltip>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.email ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${roleInfo.badge}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {member.role === 'enseignant' ? (
                            member.classes.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {member.classes.map((c) => (
                                  <span key={c} className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Aucune classe affectée</span>
                            )
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">Établissement entier</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">{member.telephone ?? '—'}</td>
                        <td className="py-4 px-6 text-center font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {member.actif ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full font-bold">
                              Désactivé
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * itemsPerPage, membres.length)}</span> sur{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{membres.length}</span> membres
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
