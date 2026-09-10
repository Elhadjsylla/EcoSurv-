import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { EleveWithStats, LienParente } from '../../lib/mockData';
import { X, UserPlus, ShieldAlert, CheckCircle } from 'lucide-react';

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
  classesList: string[];
}

export const StudentEnrollmentModal: React.FC<StudentEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  classesList,
}) => {
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

    // Génération du nouvel élève mocké
    const newId = `el-${Date.now().toString().slice(-4)}`;
    const randomMatricule = `DEMO-2025-${Math.floor(100 + Math.random() * 900)}`;

    const newEleve: EleveWithStats = {
      id: newId,
      ecole_id: 'ecole-demo-001',
      matricule: randomMatricule,
      nom: validData.nom.toUpperCase(),
      prenom: validData.prenom,
      date_naissance: validData.date_naissance,
      lieu_naissance: validData.lieu_naissance,
      sexe: validData.sexe,
      classe: validData.classe,
      nom_tuteur: validData.nom_tuteur,
      telephone_tuteur: validData.telephone_tuteur,
      email_tuteur: validData.email_tuteur,
      adresse_tuteur: validData.adresse_tuteur,
      lien_parente: validData.lien_parente as LienParente,
      actif: true,
      total_due: 35000,
      total_paid: 0,
      remaining: 35000,
      statut: 'a_jour',
      derniere_echeance_date: '2026-03-01',
      prochaine_echeance_date: '2026-03-01',
      prochaine_echeance_montant: 15000,
      nb_absences: 0,
      timeline_paiements: [],
    };

    setIsSuccess(true);
    setTimeout(() => {
      onEnroll(newEleve);
      setIsSuccess(false);
      onClose();
    }, 1200);
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
                Inscrire un nouvel élève
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enregistrement dans l'annuaire académique de l'établissement
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
          <div className="py-12 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Inscription validée avec succès !
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              L'élève a été ajouté au registre académique et à l'échéancier.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Classe d'affectation <span className="text-red-500">*</span>
                </label>
                <Select<string>
                  value={formData.classe || (classesList[0] || '')}
                  onChange={(val) => setFormData({ ...formData, classe: val })}
                  options={classesList.map((c) => ({ value: c, label: c }))}
                  placeholder="Sélectionner une classe..."
                  size="sm"
                  triggerClassName="w-full h-9 rounded-lg font-semibold"
                />
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
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Valider l'Inscription
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
