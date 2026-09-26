import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { EleveWithStats, LienParente } from '../../lib/mockData';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { generateEcheancesForNewStudent } from '../../lib/echeancesHelper';
import { parseEdgeFunctionError } from '../../lib/functionsHelper';
import { X, UserPlus, ShieldAlert, CheckCircle, Copy, Check, Loader2, Mail, HeartHandshake } from 'lucide-react';

// Schéma Zod de validation stricte pour l'inscription d'un élève
export const studentEnrollmentSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  date_naissance: z.string().min(1, 'La date de naissance est obligatoire'),
  lieu_naissance: z.string().min(2, 'Le lieu de naissance est obligatoire'),
  sexe: z.enum(['M', 'F'], { required_error: 'Le sexe est obligatoire' }),
  classe: z.string().min(1, 'Veuillez sélectionner une classe'),
  nom_tuteur: z.string().min(3, 'Le nom du tuteur doit contenir au moins 3 caractères'),
  telephone_tuteur: z
    .string()
    .min(8, 'Numéro de téléphone invalide (min 8 chiffres)'),
  email_tuteur: z
    .string()
    .email('Adresse email invalide')
    .or(z.literal(''))
    .optional(),
  adresse_tuteur: z.string().min(3, "L'adresse du tuteur est obligatoire"),
  lien_parente: z.enum(['pere', 'mere', 'tuteur', 'autre'] as const),
});

export type StudentEnrollmentFormData = z.infer<typeof studentEnrollmentSchema>;

interface StudentEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (newEleve: EleveWithStats) => void;
  onUpdate?: (updatedEleve: EleveWithStats) => void;
  classesList: string[];
  eleveToEdit?: EleveWithStats | null;
}

export const StudentEnrollmentModal: React.FC<StudentEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  onUpdate,
  classesList,
  eleveToEdit,
}) => {
  const isEditing = Boolean(eleveToEdit);

  const [formData, setFormData] = useState<Partial<StudentEnrollmentFormData>>({
    nom: '',
    prenom: '',
    date_naissance: '',
    lieu_naissance: 'Nouakchott',
    sexe: 'M',
    classe: classesList[0] || 'Terminales C',
    nom_tuteur: '',
    telephone_tuteur: '+222 ',
    email_tuteur: '',
    adresse_tuteur: 'Tevragh-Zeina, Nouakchott',
    lien_parente: 'pere',
  });

  const [isCustomClasse, setIsCustomClasse] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [createdParentLink, setCreatedParentLink] = useState<string | null>(null);
  const [parentInviteNotice, setParentInviteNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [enrolledEleve, setEnrolledEleve] = useState<EleveWithStats | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    if (eleveToEdit) {
      const isCustom = Boolean(eleveToEdit.classe && !classesList.includes(eleveToEdit.classe));
      setIsCustomClasse(isCustom);
      setFormData({
        nom: eleveToEdit.nom || '',
        prenom: eleveToEdit.prenom || '',
        date_naissance: eleveToEdit.date_naissance || '',
        lieu_naissance: eleveToEdit.lieu_naissance || 'Nouakchott',
        sexe: eleveToEdit.sexe || 'M',
        classe: eleveToEdit.classe || classesList[0] || '1AF (CI / CP1)',
        nom_tuteur: eleveToEdit.nom_tuteur || '',
        telephone_tuteur: eleveToEdit.telephone_tuteur || '+222 ',
        email_tuteur: eleveToEdit.email_tuteur || '',
        adresse_tuteur: eleveToEdit.adresse_tuteur || 'Tevragh-Zeina, Nouakchott',
        lien_parente: (eleveToEdit.lien_parente as any) || 'pere',
      });
    } else {
      setIsCustomClasse(false);
      setFormData({
        nom: '',
        prenom: '',
        date_naissance: '',
        lieu_naissance: 'Nouakchott',
        sexe: 'M',
        classe: classesList[0] || '1AF (CI / CP1)',
        nom_tuteur: '',
        telephone_tuteur: '+222 ',
        email_tuteur: '',
        adresse_tuteur: 'Tevragh-Zeina, Nouakchott',
        lien_parente: 'pere',
      });
    }
    setIsSuccess(false);
    setCreatedParentLink(null);
    setParentInviteNotice(null);
    setErrors({});
  }, [isOpen, eleveToEdit, classesList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = studentEnrollmentSchema.safeParse(formData);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    const validData = result.data;
    const authProfile = useAuthStore.getState().profile;
    const authEcole = useAuthStore.getState().ecole;

    const newId = eleveToEdit?.id || `el-${Date.now().toString().slice(-6)}`;
    const code = authEcole?.nom ? authEcole.nom.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'ECO';
    const realMatricule = eleveToEdit?.matricule || `${code}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let finalEleveId = newId;
    let inviteNotice = '';
    let testActionLink: string | null = null;

    setIsEnrolling(true);

    if (authProfile?.ecole_id) {
      try {
        if (isEditing && eleveToEdit) {
          // =========================================================================
          // CAS MODIFICATION D'UN ÉLÈVE EXISTANT
          // =========================================================================
          const coreUpdate = {
            nom: validData.nom.toUpperCase(),
            prenom: validData.prenom,
            date_naissance: validData.date_naissance,
            lieu_naissance: validData.lieu_naissance,
            sexe: validData.sexe,
            classe: validData.classe,
          };
          const fullUpdate = {
            ...coreUpdate,
            nom_tuteur: validData.nom_tuteur,
            telephone_tuteur: validData.telephone_tuteur,
            email_tuteur: validData.email_tuteur?.trim() || null,
            adresse_tuteur: validData.adresse_tuteur,
          };

          let updateRes = await supabase
            .from('eleves')
            .update(fullUpdate)
            .eq('id', eleveToEdit.id);

          if (updateRes.error && (updateRes.error.code === '42703' || updateRes.error.message?.includes('nom_tuteur'))) {
            updateRes = await supabase
              .from('eleves')
              .update(coreUpdate)
              .eq('id', eleveToEdit.id);
          }

          if (updateRes.error) {
            console.error('[StudentEnrollmentModal] Erreur modification élève:', updateRes.error);
            setErrors({ submit: `Erreur base de données (${updateRes.error.code || '400'}) : ${updateRes.error.message || "Erreur lors de la mise à jour de l'élève."}` });
            setIsEnrolling(false);
            return;
          }

          finalEleveId = eleveToEdit.id;

          // RÈGLE STRICTE : l'invitation ne part que si l'email passe de VIDE à REMPLI
          const emailWasEmpty = !eleveToEdit.email_tuteur || eleveToEdit.email_tuteur.trim() === '';
          const emailTuteur = validData.email_tuteur?.trim() ?? '';
          const emailIsNowFilled = emailTuteur.length > 0;

          if (emailWasEmpty && emailIsNowFilled) {
            try {
              const { data: inviteRes, error: inviteErr } = await supabase.functions.invoke('invite-parent', {
                body: {
                  eleve_id: eleveToEdit.id,
                  nom_tuteur: validData.nom_tuteur.trim(),
                  email_tuteur: emailTuteur,
                  telephone_tuteur: validData.telephone_tuteur?.trim(),
                  lien_parente: validData.lien_parente,
                  redirect_to: window.location.origin,
                },
              });

              if (inviteRes?.actionLink) {
                testActionLink = inviteRes.actionLink;
              }
              if (inviteRes?.message) {
                inviteNotice = inviteRes.message;
              } else if (inviteErr) {
                const realErrorMsg = await parseEdgeFunctionError(inviteErr, "Le service d'invitation parent n'a pas pu traiter la demande.");
                inviteNotice = `Fiche mise à jour. Note invitation parent : ${realErrorMsg}`;
              }
            } catch (funcErr: any) {
              console.warn('[StudentEnrollmentModal] Exception invite-parent lors de la modification:', funcErr);
              const realErrorMsg = await parseEdgeFunctionError(funcErr, "Erreur inattendue lors de l'invitation parent.");
              inviteNotice = `Fiche mise à jour. Note invitation parent : ${realErrorMsg}`;
            }
          } else if (validData.email_tuteur?.trim()) {
            inviteNotice = "Fiche élève mise à jour. Aucune invitation renvoyée (compte tuteur déjà configuré).";
          } else {
            inviteNotice = "Fiche élève mise à jour. Accès Famille non activé : en attente d'un email tuteur.";
          }
        } else {
          // =========================================================================
          // CAS NOUVELLE INSCRIPTION
          // =========================================================================
          const corePayload = {
            ecole_id: authProfile.ecole_id,
            matricule: realMatricule,
            nom: validData.nom.toUpperCase(),
            prenom: validData.prenom,
            date_naissance: validData.date_naissance,
            lieu_naissance: validData.lieu_naissance,
            sexe: validData.sexe,
            classe: validData.classe,
            actif: true,
          };
          const fullPayload = {
            ...corePayload,
            nom_tuteur: validData.nom_tuteur,
            telephone_tuteur: validData.telephone_tuteur,
            email_tuteur: validData.email_tuteur?.trim() || null,
            adresse_tuteur: validData.adresse_tuteur,
          };

          let insertResult = await supabase
            .from('eleves')
            .insert(fullPayload)
            .select('id')
            .single();

          if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('nom_tuteur'))) {
            console.warn('[StudentEnrollmentModal] Colonnes tuteur absentes de public.eleves, insertion avec colonnes standard.');
            insertResult = await supabase
              .from('eleves')
              .insert(corePayload)
              .select('id')
              .single();
          }

          if (insertResult.error) {
            console.error('[StudentEnrollmentModal] Erreur insertion élève:', insertResult.error);
            setErrors({ submit: `Erreur base de données (${insertResult.error.code || '400'}) : ${insertResult.error.message || "Erreur lors de l'enregistrement de l'élève."}` });
            setIsEnrolling(false);
            return;
          }

          if (insertResult.data?.id) {
            finalEleveId = insertResult.data.id;
          }

          // RÈGLE : auto-génération des échéances si un barème existe pour cette classe
          try {
            const nbGen = await generateEcheancesForNewStudent(
              authProfile.ecole_id,
              finalEleveId,
              validData.classe
            );
            if (nbGen > 0) {
              console.log(`[StudentEnrollmentModal] ${nbGen} échéance(s) générée(s) selon le barème de ${validData.classe}`);
            }
          } catch (echGenErr) {
            console.warn('[StudentEnrollmentModal] Erreur auto-génération échéances nouvel élève:', echGenErr);
          }

          // Si le tuteur a un email, déclencher l'invitation / rattachement parent
          if (validData.email_tuteur?.trim()) {
            try {
              const { data: inviteRes, error: inviteErr } = await supabase.functions.invoke('invite-parent', {
                body: {
                  eleve_id: finalEleveId,
                  nom_tuteur: validData.nom_tuteur.trim(),
                  email_tuteur: validData.email_tuteur.trim(),
                  telephone_tuteur: validData.telephone_tuteur?.trim(),
                  lien_parente: validData.lien_parente,
                  redirect_to: window.location.origin,
                },
              });

              if (inviteRes?.actionLink) {
                testActionLink = inviteRes.actionLink;
              }
              if (inviteRes?.message) {
                inviteNotice = inviteRes.message;
              } else if (inviteErr) {
                const realErrorMsg = await parseEdgeFunctionError(inviteErr, "Le service d'invitation parent n'a pas pu traiter la demande.");
                inviteNotice = `Élève inscrit. Note invitation parent : ${realErrorMsg}`;
              }
            } catch (funcErr: any) {
              console.warn('[StudentEnrollmentModal] Exception invite-parent:', funcErr);
              const realErrorMsg = await parseEdgeFunctionError(funcErr, "Erreur inattendue lors de l'invitation parent.");
              inviteNotice = `Élève inscrit. Note invitation parent : ${realErrorMsg}`;
            }
          } else {
            inviteNotice = "Accès Famille non activé : aucun email tuteur renseigné (en attente d'un email).";
          }
        }
      } catch (err: any) {
        console.error('[StudentEnrollmentModal] Erreur globale:', err);
        setErrors({ submit: err?.message || 'Erreur inattendue.' });
        setIsEnrolling(false);
        return;
      }
    }

    const savedEleve: EleveWithStats = {
      id: finalEleveId,
      ecole_id: authProfile?.ecole_id || 'ecole-active',
      matricule: realMatricule,
      nom: validData.nom.toUpperCase(),
      prenom: validData.prenom,
      date_naissance: validData.date_naissance,
      lieu_naissance: validData.lieu_naissance,
      sexe: validData.sexe,
      classe: validData.classe,
      nom_tuteur: validData.nom_tuteur,
      telephone_tuteur: validData.telephone_tuteur,
      email_tuteur: validData.email_tuteur || '',
      adresse_tuteur: validData.adresse_tuteur,
      lien_parente: validData.lien_parente as LienParente,
      actif: true,
      total_due: eleveToEdit?.total_due ?? 35000,
      total_paid: eleveToEdit?.total_paid ?? 0,
      remaining: eleveToEdit?.remaining ?? 35000,
      statut: eleveToEdit?.statut ?? 'a_jour',
      derniere_echeance_date: eleveToEdit?.derniere_echeance_date || '2026-03-01',
      prochaine_echeance_date: eleveToEdit?.prochaine_echeance_date || '2026-03-01',
      prochaine_echeance_montant: eleveToEdit?.prochaine_echeance_montant ?? 15000,
      nb_absences: eleveToEdit?.nb_absences ?? 0,
      timeline_paiements: eleveToEdit?.timeline_paiements ?? [],
    };

    setEnrolledEleve(savedEleve);
    setCreatedParentLink(testActionLink);
    setParentInviteNotice(inviteNotice);
    setIsEnrolling(false);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? "Modifier la fiche de l'élève" : "Inscrire un nouvel élève"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? "Mise à jour des coordonnées académiques et du tuteur"
                  : "Enregistrement dans l'annuaire académique de l'établissement"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message de Succès */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {isEditing ? "Fiche élève mise à jour avec succès !" : "Inscription enregistrée avec succès !"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {enrolledEleve?.prenom} {enrolledEleve?.nom} (#{enrolledEleve?.matricule}) • {enrolledEleve?.classe}
              </p>
            </div>

            {parentInviteNotice && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 max-w-lg mx-auto text-left flex items-start gap-2.5">
                <HeartHandshake className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">Statut Espace Famille :</div>
                  <div>{parentInviteNotice}</div>
                </div>
              </div>
            )}

            {createdParentLink && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left space-y-2 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Lien d'activation Espace Famille (mode test) :
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdParentLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedLink ? 'Copié !' : 'Copier le lien'}
                  </button>
                </div>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                  En mode bac à sable Resend, vous pouvez ouvrir ce lien directement pour tester la première connexion du parent.
                </p>
              </div>
            )}

            <div className="pt-3 flex justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  if (enrolledEleve) {
                    if (isEditing && onUpdate) {
                      onUpdate(enrolledEleve);
                    } else {
                      onEnroll(enrolledEleve);
                    }
                  }
                  setIsSuccess(false);
                  setCreatedParentLink(null);
                  setParentInviteNotice(null);
                  onClose();
                }}
                className="px-8 shadow-sm"
              >
                Terminer & Retour au Registre
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bannière d'erreur générale d'enregistrement */}
            {errors.submit && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-start gap-2.5 animate-in fade-in">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold text-sm">Erreur lors de l'enregistrement :</div>
                  <div className="font-mono text-xs">{errors.submit}</div>
                </div>
              </div>
            )}

            {/* Section 1: Informations Élève */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Identité de l'Élève
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Ex: Mamadou Oury"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  {errors.prenom && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {errors.prenom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom de famille <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: DIALLO"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  {errors.nom && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {errors.nom}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de naissance <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.date_naissance || ''}
                    onChange={(val) =>
                      setFormData({ ...formData, date_naissance: val })
                    }
                    size="sm"
                    className="w-full"
                    triggerClassName="w-full h-9 rounded-lg text-xs"
                    placeholder="JJ/MM/AAAA"
                  />
                  {errors.date_naissance && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {errors.date_naissance}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    value={formData.lieu_naissance || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, lieu_naissance: e.target.value })
                    }
                    placeholder="Ex: Nouakchott"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <Select<'M' | 'F'>
                    value={(formData.sexe as 'M' | 'F') || 'M'}
                    onChange={(val) => setFormData({ ...formData, sexe: val })}
                    options={[
                      { value: 'M', label: 'Masculin (M)' },
                      { value: 'F', label: 'Féminin (F)' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Classe d'affectation <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCustomClasse;
                      setIsCustomClasse(next);
                      if (next) {
                        setFormData({ ...formData, classe: '' });
                      } else {
                        setFormData({ ...formData, classe: classesList[0] || '1AF (CI / CP1)' });
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isCustomClasse ? "Choisir dans la liste" : "+ Saisir une autre classe"}
                  </button>
                </div>

                {isCustomClasse ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={formData.classe || ''}
                      onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                      placeholder="Ex: 6ème Bilingue, Terminale C1, Nation CP..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Saisie libre : cette classe sera automatiquement conservée et proposée pour les prochains élèves.
                    </p>
                  </div>
                ) : (
                  <Select<string>
                    value={formData.classe || (classesList[0] || '')}
                    onChange={(val) => setFormData({ ...formData, classe: val })}
                    options={classesList.map((c) => ({ value: c, label: c }))}
                    placeholder="Sélectionner une classe..."
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                    emptyMessage="Aucune classe configurée. Utilisez le lien ci-dessus pour la saisir manuellement."
                  />
                )}
                {errors.classe && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> {errors.classe}
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Tuteur Légal */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Tuteur Légal & Responsables
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom complet du tuteur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nom_tuteur || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, nom_tuteur: e.target.value })
                    }
                    placeholder="Ex: Amadou Diallo"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  {errors.nom_tuteur && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {errors.nom_tuteur}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lien de parenté <span className="text-red-500">*</span>
                  </label>
                  <Select<LienParente>
                    value={(formData.lien_parente as LienParente) || 'pere'}
                    onChange={(val) => setFormData({ ...formData, lien_parente: val })}
                    options={[
                      { value: 'pere', label: 'Père' },
                      { value: 'mere', label: 'Mère' },
                      { value: 'tuteur', label: 'Tuteur Légal' },
                      { value: 'autre', label: 'Autre' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.telephone_tuteur || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone_tuteur: e.target.value })
                    }
                    placeholder="+222 22 11 33 44"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                  {errors.telephone_tuteur && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {errors.telephone_tuteur}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email tuteur (Optionnel)
                  </label>
                  <input
                    type="email"
                    value={formData.email_tuteur || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, email_tuteur: e.target.value })
                    }
                    placeholder="tuteur@domaine.mr"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  {errors.email_tuteur && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {errors.email_tuteur}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse de résidence <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.adresse_tuteur || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse_tuteur: e.target.value })
                  }
                  placeholder="Quartier, Rue / Repère..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isEnrolling}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="sm" className="gap-2" disabled={isEnrolling}>
                {isEnrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isEditing ? "Mise à jour..." : "Enregistrement & envoi..."}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{isEditing ? "Enregistrer les modifications" : "Valider l'Inscription"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
