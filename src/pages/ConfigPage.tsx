import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { KpiCard } from '../components/ui/KpiCard';
import { Tooltip } from '../components/ui/Tooltip';
import { useEcoleStore } from '../store/useEcoleStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { parseEdgeFunctionError } from '../lib/functionsHelper';
import {
  MOCK_STAFF,
  StaffMember,
  RoleUtilisateur,
} from '../lib/mockData';
import { DEFAULT_CLASSES_MAURITANIE } from '../lib/constants/classes';
import {
  Save,
  Building2,
  Users,
  UserPlus,
  CheckCircle,
  X,
  GraduationCap,
  ShieldCheck,
  MoreHorizontal,
  KeyRound,
  UserCog,
  UserMinus,
  UserCheck,
  School,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const ConfigPage: React.FC = () => {
  const { ecole, updateEcole } = useEcoleStore();
  const authProfile = useAuthStore((s) => s.profile);
  const [formData, setFormData] = useState(ecole);
  const [isSaving, setIsSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    if (authProfile?.ecole_id) return [];
    return MOCK_STAFF;
  });

  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchStaff = async () => {
    if (!authProfile?.ecole_id) return;
    try {
      const { data: profilsData, error: profilsErr } = await supabase
        .from('profils')
        .select('*')
        .eq('ecole_id', authProfile.ecole_id)
        .order('created_at', { ascending: false });

      if (!profilsErr && profilsData) {
        // Récupérer les classes assignées pour les enseignants
        const { data: affectations } = await supabase
          .from('affectations_enseignants')
          .select('enseignant_id, classe')
          .eq('ecole_id', authProfile.ecole_id);

        const affectationMap = new Map<string, string>();
        if (affectations) {
          for (const a of affectations) {
            affectationMap.set(a.enseignant_id, a.classe);
          }
        }

        const mapped: StaffMember[] = profilsData.map((p: any) => ({
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          email: p.email || '',
          telephone: p.telephone || '',
          role: p.role as RoleUtilisateur,
          classe_assignee: affectationMap.get(p.id),
          actif: Boolean(p.actif),
          date_ajout: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '2026-09-22',
        }));
        setStaffList(mapped);
      }
    } catch (e) {
      console.warn('[ConfigPage] Erreur chargement staff:', e);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [authProfile?.ecole_id]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(staffList.length / itemsPerPage) || 1;
  const paginatedStaff = staffList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Synchronise le formulaire si le store change
  useEffect(() => {
    setFormData(ecole);
  }, [ecole]);

  // Fermer le menu contextuel si clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.staff-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setIsSaving(true);
    setTimeout(() => {
      updateEcole(formData);
      setIsSaving(false);
      showToast("✓ Coordonnées et paramètres de l'établissement mis à jour et synchronisés en direct !");
    }, 600);
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim() || !newPrenom.trim() || !newEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const { data, error } = await supabase.functions.invoke('invite-staff-member', {
        body: {
          nom: newNom.trim(),
          prenom: newPrenom.trim(),
          email: newEmail.trim(),
          telephone: newTelephone.trim(),
          role: newRole,
          classe_assignee: newRole === 'enseignant' ? newClasse : undefined,
          redirect_to: window.location.origin,
        },
      });

      if (error) {
        const errorMsg = await parseEdgeFunctionError(error, "Erreur lors de l'envoi de l'invitation.");
        setInviteError(errorMsg);
        setIsInviting(false);
        return;
      }

      if (data?.error && !data?.success) {
        setInviteError(data.error);
        setIsInviting(false);
        return;
      }

      showToast(`✓ Invitation expédiée avec succès à ${newPrenom} ${newNom} (${newEmail}) !`);
      setIsInviteModalOpen(false);
      setNewNom('');
      setNewPrenom('');
      setNewEmail('');
      setNewTelephone('+222 ');
      setIsInviting(false);

      if (authProfile?.ecole_id) {
        await fetchStaff();
      }
    } catch (err: any) {
      console.error('[ConfigPage] Erreur invitation personnel:', err);
      setInviteError(err?.message || "Erreur inattendue lors de l'envoi de l'invitation.");
      setIsInviting(false);
    }
  };

  // State pour modification d'un membre existant
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editRole, setEditRole] = useState<RoleUtilisateur>('enseignant');
  const [editClasse, setEditClasse] = useState('Terminales C');
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [updateMemberError, setUpdateMemberError] = useState<string | null>(null);

  // État de chargement pour les actions individuelles
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const handleOpenEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setEditNom(member.nom);
    setEditPrenom(member.prenom);
    setEditTelephone(member.telephone || '+222 ');
    setEditRole(member.role);
    setEditClasse(member.classe_assignee || 'Terminales C');
    setUpdateMemberError(null);
    setActiveMenuId(null);
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editNom.trim() || !editPrenom.trim()) return;

    setIsUpdatingMember(true);
    setUpdateMemberError(null);

    try {
      const { data, error } = await supabase.functions.invoke('manage-staff-member', {
        body: {
          action: 'update_member',
          member_id: editingMember.id,
          nom: editNom.trim(),
          prenom: editPrenom.trim(),
          telephone: editTelephone.trim(),
          role: editRole,
          classe_assignee: editRole === 'enseignant' ? editClasse : undefined,
        },
      });

      if (error || (data && !data.success)) {
        const errorMsg = error ? await parseEdgeFunctionError(error, 'Erreur lors de la mise à jour.') : (data?.error || 'Erreur lors de la mise à jour.');
        setUpdateMemberError(errorMsg);
        setIsUpdatingMember(false);
        return;
      }

      showToast(`✓ Profil de ${editPrenom} ${editNom} mis à jour avec succès.`);
      setEditingMember(null);
      setIsUpdatingMember(false);
      await fetchStaff();
    } catch (err: any) {
      console.error('[ConfigPage] Erreur modification profil:', err);
      const errorMsg = await parseEdgeFunctionError(err, 'Erreur inattendue.');
      setUpdateMemberError(errorMsg);
      setIsUpdatingMember(false);
    }
  };

  const handleResetPassword = async (member: StaffMember) => {
    setActiveMenuId(null);
    setActionInProgressId(member.id);

    try {
      const { data, error } = await supabase.functions.invoke('manage-staff-member', {
        body: {
          action: 'reset_password',
          member_id: member.id,
          redirect_to: window.location.origin,
        },
      });

      if (error || (data && !data.success)) {
        const errorMsg = error ? await parseEdgeFunctionError(error, "Échec de l'envoi du lien.") : (data?.error || "Échec de l'envoi du lien.");
        showToast(`Erreur: ${errorMsg}`);
      } else {
        showToast(`✓ Email de réinitialisation envoyé à ${member.email}.`);
      }
    } catch (err: any) {
      console.error('[ConfigPage] Erreur reset password:', err);
      const errorMsg = await parseEdgeFunctionError(err, 'Erreur lors de la requête.');
      showToast(`Erreur: ${errorMsg}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    setActiveMenuId(null);

    if (member.id === authProfile?.id) {
      showToast('Action refusée : vous ne pouvez pas désactiver votre propre compte administrateur.');
      return;
    }

    setActionInProgressId(member.id);

    try {
      const { data, error } = await supabase.functions.invoke('manage-staff-member', {
        body: {
          action: 'toggle_active',
          member_id: member.id,
          actif: !member.actif,
        },
      });

      if (error || (data && !data.success)) {
        const errorMsg = error ? await parseEdgeFunctionError(error, 'Échec du changement de statut.') : (data?.error || 'Échec du changement de statut.');
        showToast(`Erreur: ${errorMsg}`);
      } else {
        const actionLabel = member.actif ? 'désactivé (sessions coupées immédiatement)' : 'réactivé';
        showToast(`✓ Compte de ${member.prenom} ${member.nom} ${actionLabel}.`);
        await fetchStaff();
      }
    } catch (err: any) {
      console.error('[ConfigPage] Erreur statut actif:', err);
      const errorMsg = await parseEdgeFunctionError(err, 'Erreur lors du changement de statut.');
      showToast(`Erreur: ${errorMsg}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const roleLabels: Record<RoleUtilisateur, { label: string; badge: string }> = {
    super_admin: {
      label: 'Super Admin',
      badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
    },
    directeur: {
      label: 'Directeur',
      badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    },
    caissier: {
      label: 'Caissier',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    },
    enseignant: {
      label: 'Enseignant',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
    },
    parent: {
      label: 'Parent',
      badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
  };

  const teacherCount = staffList.filter((s) => s.role === 'enseignant').length;
  const adminCount = staffList.filter((s) => s.role === 'directeur' || s.role === 'caissier' || s.role === 'super_admin').length;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Configuration Établissement & Personnel
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Abonnement SaaS Actif
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Gestion du profil de l'école, choix de l'année scolaire active et administration des accès du personnel.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-2 shrink-0 shadow-xs"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          + Inviter un Membre
        </Button>
      </div>

      {/* 4 Pastel Stat Cards (Nexoov Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Effectif Personnel"
          customValue={`${staffList.length} membres`}
          subtitle="Comptes utilisateurs habilités"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          variant="primary"
        />

        <KpiCard
          title="Corps Enseignant"
          customValue={`${teacherCount} professeurs`}
          subtitle="Professeurs assignés aux classes"
          icon={<GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          variant="default"
        />

        <KpiCard
          title="Administration & Caisse"
          customValue={`${adminCount} gestionnaires`}
          subtitle="Directeur, caissiers & admins"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />

        <KpiCard
          title="Année & Licence"
          customValue={formData.annee_scolaire}
          subtitle={`Tenant: ${formData.code_ecole}`}
          icon={<School className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />
      </div>

      {/* School Information Form */}
      <Card className="p-6 sm:p-8 space-y-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Profil de l'Établissement Client
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Code Tenant:{' '}
            <span className="font-bold text-blue-700 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
              {formData.code_ecole}
            </span>
          </span>
        </div>

        <form onSubmit={handleSaveEcoleInfo} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom officiel de l'école <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Année Scolaire Active <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.annee_scolaire}
                onChange={(val) => setFormData({ ...formData, annee_scolaire: val })}
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
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ville / Commune
              </label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Téléphone Officiel
              </label>
              <input
                type="text"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email de Contact
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Adresse Physique
            </label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="gap-2"
              loading={isSaving}
              loadingText="Enregistrement..."
            >
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff Directory Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="py-4 px-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Annuaire du Personnel & Rôles Habilités ({staffList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Strictement contrôlé par Row Level Security (RLS)
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6">Membre du Personnel</th>
                <th className="py-4 px-6">Rôle Attribué</th>
                <th className="py-4 px-6">Classe Assignée</th>
                <th className="py-4 px-6">Coordonnées</th>
                <th className="py-4 px-6 text-center">Date Ajout</th>
                <th className="py-4 px-6 text-center">Statut Compte</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStaff.map((member) => {
                const roleInfo = roleLabels[member.role] || roleLabels.enseignant;
                const initials = `${member.prenom.charAt(0)}${member.nom.charAt(0)}`.toUpperCase();

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 2-line member display + avatar */}
                    <td className="py-4 px-6 min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Tooltip content={`${member.prenom} ${member.nom}`} as="div" className="block min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {member.prenom} {member.nom}
                            </div>
                          </Tooltip>
                          <Tooltip content={member.email} as="div" className="block min-w-0">
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-normal">
                              {member.email}
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${roleInfo.badge}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    {/* Classe assignée */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {member.classe_assignee ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {member.classe_assignee}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                          Établissement entier
                        </span>
                      )}
                    </td>

                    {/* Coordonnées */}
                    <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                      {member.telephone}
                    </td>

                    {/* Date Ajout */}
                    <td className="py-4 px-6 text-center font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {member.date_ajout}
                    </td>

                    {/* Statut Compte: Pill with dot */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      {member.actif ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full font-bold text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-full font-bold text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          En attente
                        </span>
                      )}
                    </td>

                    {/* Context menu "..." */}
                    <td className="py-4 px-6 text-right whitespace-nowrap relative staff-menu-container">
                      <Tooltip content="Options">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === member.id ? null : member.id)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          aria-label="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </Tooltip>

                      {activeMenuId === member.id && (
                        <div className="absolute right-6 top-12 z-30 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-left animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                          >
                            <UserCog className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>Modifier les accès & rôle</span>
                          </button>
                          <button
                            onClick={() => handleResetPassword(member)}
                            disabled={actionInProgressId === member.id}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionInProgressId === member.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )}
                            <span>Réinitialiser mot de passe</span>
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          {member.id === authProfile?.id ? (
                            <div className="px-4 py-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
                              Compte connecté (non désactivable)
                            </div>
                          ) : member.actif ? (
                            <button
                              onClick={() => handleToggleActive(member)}
                              disabled={actionInProgressId === member.id}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 disabled:opacity-50"
                            >
                              {actionInProgressId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin shrink-0" />
                              ) : (
                                <UserMinus className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              )}
                              <span>Désactiver le compte</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(member)}
                              disabled={actionInProgressId === member.id}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 disabled:opacity-50"
                            >
                              {actionInProgressId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                              <span>Réactiver le compte</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Affichage de{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {staffList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            à{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, staffList.length)}
            </span>{' '}
            sur{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {staffList.length}
            </span>{' '}
            membres
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Précédent
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Suivant
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Inviter un membre */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Inviter un membre du personnel
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isInviting}
                    placeholder="Ex: Fatimata"
                    value={newPrenom}
                    onChange={(e) => setNewPrenom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isInviting}
                    placeholder="Ex: MINT SIDI"
                    value={newNom}
                    onChange={(e) => setNewNom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email de connexion <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={isInviting}
                  placeholder="nom@ecosurv.test"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    disabled={isInviting}
                    value={newTelephone}
                    onChange={(e) => setNewTelephone(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rôle Attribué <span className="text-red-500">*</span>
                  </label>
                  <Select<RoleUtilisateur>
                    value={newRole}
                    onChange={setNewRole}
                    disabled={isInviting}
                    options={[
                      { value: 'enseignant', label: 'Enseignant' },
                      { value: 'caissier', label: 'Caissier' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                  />
                </div>
              </div>

              {newRole === 'enseignant' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classe Assignée
                  </label>
                  <Select
                    value={newClasse}
                    onChange={setNewClasse}
                    disabled={isInviting}
                    options={DEFAULT_CLASSES_MAURITANIE.map((c) => ({ value: c, label: c }))}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isInviting}
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5" disabled={isInviting}>
                  {isInviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Expédition en cours...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Envoyer Invitation</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modification Membre & Rôle */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Modifier les accès & rôle
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingMember.prenom} {editingMember.nom} ({editingMember.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {updateMemberError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{updateMemberError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateMemberSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isUpdatingMember}
                    value={editPrenom}
                    onChange={(e) => setEditPrenom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isUpdatingMember}
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    disabled={isUpdatingMember}
                    value={editTelephone}
                    onChange={(e) => setEditTelephone(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rôle Attribué <span className="text-red-500">*</span>
                  </label>
                  <Select<RoleUtilisateur>
                    value={editRole}
                    onChange={setEditRole}
                    disabled={isUpdatingMember}
                    options={[
                      { value: 'enseignant', label: 'Enseignant' },
                      { value: 'caissier', label: 'Caissier' },
                    ]}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                  />
                </div>
              </div>

              {editRole === 'enseignant' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classe Assignée
                  </label>
                  <Select
                    value={editClasse}
                    onChange={setEditClasse}
                    disabled={isUpdatingMember}
                    options={DEFAULT_CLASSES_MAURITANIE.map((c) => ({ value: c, label: c }))}
                    size="sm"
                    triggerClassName="w-full h-9 rounded-lg font-semibold"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingMember}
                  onClick={() => setEditingMember(null)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5" disabled={isUpdatingMember}>
                  {isUpdatingMember ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mise à jour...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
