import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
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
    <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 sm:space-y-10 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Configuration Établissement & Personnel
            </h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Abonnement SaaS Actif
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
            Gestion du profil de l'école, choix de l'année scolaire active et administration des accès du personnel.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          + Inviter un Membre
        </Button>
      </div>

      {/* School Information Form */}
      <Card className="p-6 sm:p-8 space-y-6 rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Profil de l'Établissement Client
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Code Tenant: <span className="font-bold text-blue-700 font-mono">{ecole.code_ecole}</span>
          </span>
        </div>

        <form onSubmit={handleSaveEcoleInfo} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Nom officiel de l'école <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ecole.nom}
                onChange={(e) => setEcole({ ...ecole, nom: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Année Scolaire Active <span className="text-red-500">*</span>
              </label>
              <Select
                value={ecole.annee_scolaire}
                onChange={(val) => setEcole({ ...ecole, annee_scolaire: val })}
                options={[
                  { value: '2025-2026', label: '2025–2026 (Active)' },
                  { value: '2024-2025', label: '2024–2025 (Archivée)' },
                ]}
                triggerClassName="w-full h-11 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Ville / Commune
              </label>
              <input
                type="text"
                value={ecole.ville}
                onChange={(e) => setEcole({ ...ecole, ville: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Téléphone Officiel
              </label>
              <input
                type="text"
                value={ecole.telephone}
                onChange={(e) => setEcole({ ...ecole, telephone: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Email de Contact
              </label>
              <input
                type="email"
                value={ecole.email}
                onChange={(e) => setEcole({ ...ecole, email: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Adresse Physique
            </label>
            <input
              type="text"
              value={ecole.adresse}
              onChange={(e) => setEcole({ ...ecole, adresse: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Enregistrer les Modifs
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff Directory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Annuaire du Personnel & Rôles Habilités ({staffList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Strictement contrôlé par Row Level Security (RLS)
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Membre du Personnel</th>
                <th className="py-4 px-6">Rôle Attribué</th>
                <th className="py-4 px-6">Classe Assignée</th>
                <th className="py-4 px-6">Coordonnées</th>
                <th className="py-4 px-6 text-center">Date Ajout</th>
                <th className="py-4 px-6 text-center">Statut Compte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((member) => {
                const roleInfo = roleLabels[member.role] || roleLabels.enseignant;
                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4.5 px-6 min-w-0 max-w-[220px]">
                      <div
                        title={`${member.prenom} ${member.nom}`}
                        className="font-bold text-slate-900 text-sm truncate"
                      >
                        {member.prenom} {member.nom}
                      </div>
                      <div title={member.email} className="text-xs text-slate-500 mt-0.5 truncate">
                        {member.email}
                      </div>
                    </td>

                    <td className="py-4.5 px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${roleInfo.badge}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    <td className="py-4.5 px-6">
                      {member.classe_assignee ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {member.classe_assignee}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Établissement entier</span>
                      )}
                    </td>

                    <td className="py-4.5 px-6 font-mono text-slate-700 text-xs">
                      {member.telephone}
                    </td>

                    <td className="py-4.5 px-6 text-center font-mono text-slate-500 text-xs">
                      {member.date_ajout}
                    </td>

                    <td className="py-4.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
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
                  <Select<RoleUtilisateur>
                    value={newRole}
                    onChange={setNewRole}
                    options={[
                      { value: 'enseignant', label: 'Enseignant' },
                      { value: 'caissier', label: 'Caissier' },
                      { value: 'directeur', label: 'Directeur' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                  />
                </div>
              </div>

              {newRole === 'enseignant' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Classe Assignée
                  </label>
                  <Select
                    value={newClasse}
                    onChange={setNewClasse}
                    options={[
                      { value: 'Terminales C', label: 'Terminales C' },
                      { value: '6ème A', label: '6ème A' },
                      { value: 'CM2 A', label: 'CM2 A' },
                      { value: '3ème B', label: '3ème B' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                  />
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
