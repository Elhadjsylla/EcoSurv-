import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  CURRENT_ECOLE,
  MOCK_STAFF,
  StaffMember,
  RoleUtilisateur,
} from '../lib/mockData';
import {
  Save,
  Building2,
  Users,
  UserPlus,
  CheckCircle,
  X,
} from 'lucide-react';

export const ConfigPage: React.FC = () => {
  const [ecole, setEcole] = useState(CURRENT_ECOLE);
  const [staffList, setStaffList] = useState<StaffMember[]>(MOCK_STAFF);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state pour invitation membre
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelephone, setNewTelephone] = useState('+222 ');
  const [newRole, setNewRole] = useState<RoleUtilisateur>('enseignant');
  const [newClasse, setNewClasse] = useState('Terminales C');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveEcoleInfo = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Coordonnées et paramètres de l\'établissement enregistrés avec succès !');
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim() || !newPrenom.trim() || !newEmail.trim()) return;

    const newMember: StaffMember = {
      id: `st-${Date.now()}`,
      nom: newNom.toUpperCase(),
      prenom: newPrenom,
      email: newEmail,
      telephone: newTelephone,
      role: newRole,
      classe_assignee: newRole === 'enseignant' ? newClasse : undefined,
      actif: true,
      date_ajout: new Date().toISOString().split('T')[0],
    };

    setStaffList([...staffList, newMember]);
    showToast(`Invitation transmise à ${newPrenom} ${newNom} (${newRole})`);
    setIsInviteModalOpen(false);
    setNewNom('');
    setNewPrenom('');
    setNewEmail('');
  };

  const roleLabels: Record<RoleUtilisateur, { label: string; badge: string }> = {
    super_admin: { label: 'Super Admin', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    directeur: { label: 'Directeur', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    caissier: { label: 'Caissier', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    enseignant: { label: 'Enseignant', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    parent: { label: 'Parent', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 relative">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Configuration Établissement & Personnel
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Abonnement SaaS Actif
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestion du profil de l'école, choix de l'année scolaire active et administration des accès du personnel.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-2"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          + Inviter un Membre
        </Button>
      </div>

      {/* School Information Form */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Profil de l'Établissement Client
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Code Tenant: <span className="font-bold text-blue-700 font-mono">{ecole.code_ecole}</span>
          </span>
        </div>

        <form onSubmit={handleSaveEcoleInfo} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nom officiel de l'école <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ecole.nom}
                onChange={(e) => setEcole({ ...ecole, nom: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Année Scolaire Active <span className="text-red-500">*</span>
              </label>
              <select
                value={ecole.annee_scolaire}
                onChange={(e) => setEcole({ ...ecole, annee_scolaire: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="2025-2026">2025–2026 (Active)</option>
                <option value="2024-2025">2024–2025 (Archivée)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ville / Commune
              </label>
              <input
                type="text"
                value={ecole.ville}
                onChange={(e) => setEcole({ ...ecole, ville: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Téléphone Officiel
              </label>
              <input
                type="text"
                value={ecole.telephone}
                onChange={(e) => setEcole({ ...ecole, telephone: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email de Contact
              </label>
              <input
                type="email"
                value={ecole.email}
                onChange={(e) => setEcole({ ...ecole, email: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse Physique
            </label>
            <input
              type="text"
              value={ecole.adresse}
              onChange={(e) => setEcole({ ...ecole, adresse: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" className="gap-1.5">
              <Save className="h-4 w-4" />
              Enregistrer les Modifs
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff Directory Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Annuaire du Personnel & Rôles Habilités ({staffList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Strictement contrôlé par Row Level Security (RLS)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Membre du Personnel</th>
                <th className="py-3.5 px-4">Rôle Attribué</th>
                <th className="py-3.5 px-4">Classe Assignée</th>
                <th className="py-3.5 px-4">Coordonnées</th>
                <th className="py-3.5 px-4 text-center">Date Ajout</th>
                <th className="py-3.5 px-4 text-center">Statut Compte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((member) => {
                const roleInfo = roleLabels[member.role] || roleLabels.enseignant;
                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {member.prenom} {member.nom}
                      </div>
                      <div className="text-[11px] text-slate-500">{member.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${roleInfo.badge}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {member.classe_assignee ? (
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {member.classe_assignee}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Établissement entier</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {member.telephone}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {member.date_ajout}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        Actif
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inviter un membre */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Inviter un membre du personnel
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fatimata"
                    value={newPrenom}
                    onChange={(e) => setNewPrenom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MINT SIDI"
                    value={newNom}
                    onChange={(e) => setNewNom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email de connexion <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@ecosurv.test"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={newTelephone}
                    onChange={(e) => setNewTelephone(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rôle Attribué <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as RoleUtilisateur)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="enseignant">Enseignant</option>
                    <option value="caissier">Caissier</option>
                    <option value="directeur">Directeur</option>
                  </select>
                </div>
              </div>

              {newRole === 'enseignant' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Classe Assignée
                  </label>
                  <select
                    value={newClasse}
                    onChange={(e) => setNewClasse(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Terminales C">Terminales C</option>
                    <option value="6ème A">6ème A</option>
                    <option value="CM2 A">CM2 A</option>
                    <option value="3ème B">3ème B</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Envoyer Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
