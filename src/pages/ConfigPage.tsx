import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { KpiCard } from '../components/ui/KpiCard';
import { Tooltip } from '../components/ui/Tooltip';
import { AdaptiveTable } from '../components/ui/AdaptiveTable';
import { useEcoleStore } from '../store/useEcoleStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { parseEdgeFunctionError } from '../lib/functionsHelper';
import { TestActivationLinkBanner } from '../components/ui/TestActivationLinkBanner';
import {
  StaffMember,
  RoleUtilisateur,
} from '../types';
import {
  DEFAULT_CLASSES_MAURITANIE,
  NIVEAUX_SCOLAIRES_ORDRE,
  deduireNiveauModeleMauritanien,
} from '../lib/constants/classes';
import { useClasses, ClasseEcole, notifyClassesChanged } from '../hooks/useClasses';
import { anneeScolaireSuggeree, getAnneeScolaireOptions } from '../lib/constants/scolaire';
import { syncEcoleStores } from '../lib/ecole';
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
  Plus,
  Edit3,
  CheckSquare,
  Power,
  Layers,
} from 'lucide-react';

export const ConfigPage: React.FC = () => {
  const { ecole } = useEcoleStore();
  const authProfile = useAuthStore((s) => s.profile);
  const canEditSchool = authProfile?.role === 'directeur' || authProfile?.role === 'super_admin';
  const { nomsClasses: activeClasses, isLoading: isLoadingActiveClasses } = useClasses();
  const [formData, setFormData] = useState(() => ({
    ...ecole,
    annee_scolaire: ecole.annee_scolaire || anneeScolaireSuggeree(),
  }));
  const [isSaving, setIsSaving] = useState(false);

  // Gestion des classes de l'école (public.classes_ecole)
  const [schoolClasses, setSchoolClasses] = useState<ClasseEcole[]>([]);
  const [isLoadingSchoolClasses, setIsLoadingSchoolClasses] = useState(false);
  const [schoolClassesError, setSchoolClassesError] = useState<string | null>(null);
  const [classUsageMap, setClassUsageMap] = useState<
    Record<string, { eleves: number; baremes: number; affectations: number }>
  >({});

  // Ajout unitaire d'une classe
  const [newClassName, setNewClassName] = useState('');
  const [newClassNiveau, setNewClassNiveau] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [addClassError, setAddClassError] = useState<string | null>(null);

  // Renommage d'une classe
  const [renamingClass, setRenamingClass] = useState<ClasseEcole | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenamingClass, setIsRenamingClass] = useState(false);
  const [renameClassError, setRenameClassError] = useState<string | null>(null);

  // Activation / désactivation d'une classe
  const [togglingClassId, setTogglingClassId] = useState<string | null>(null);

  // Fenêtre modèle mauritanien
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [selectedModelClasses, setSelectedModelClasses] = useState<string[]>([]);
  const [isInsertingModel, setIsInsertingModel] = useState(false);
  const [modelModalError, setModelModalError] = useState<string | null>(null);

  const modeleMauritanienItems = React.useMemo(
    () =>
      DEFAULT_CLASSES_MAURITANIE.map((nom, index) => ({
        nom,
        niveau: deduireNiveauModeleMauritanien(nom),
        ordre: index + 1,
      })),
    []
  );

  const fetchSchoolClasses = React.useCallback(async () => {
    const ecoleId = authProfile?.ecole_id || ecole.id;
    if (!ecoleId) return;
    setIsLoadingSchoolClasses(true);
    setSchoolClassesError(null);
    try {
      const [classesRes, elevesRes, baremesRes, affectationsRes] = await Promise.all([
        supabase
          .from('classes_ecole')
          .select('id, ecole_id, nom, niveau, ordre, actif, created_at, updated_at')
          .eq('ecole_id', ecoleId)
          .order('ordre', { ascending: true })
          .order('nom', { ascending: true }),
        supabase.from('eleves').select('classe').eq('ecole_id', ecoleId),
        supabase.from('baremes_echeances').select('classe').eq('ecole_id', ecoleId),
        supabase.from('affectations_enseignants').select('classe').eq('ecole_id', ecoleId),
      ]);

      if (classesRes.error) {
        throw classesRes.error;
      }

      setSchoolClasses((classesRes.data as ClasseEcole[]) || []);

      const usage: Record<string, { eleves: number; baremes: number; affectations: number }> = {};
      const ensureEntry = (nom: string) => {
        if (!usage[nom]) {
          usage[nom] = { eleves: 0, baremes: 0, affectations: 0 };
        }
      };

      for (const row of elevesRes.data || []) {
        if (row.classe) {
          ensureEntry(row.classe);
          usage[row.classe].eleves += 1;
        }
      }
      for (const row of baremesRes.data || []) {
        if (row.classe) {
          ensureEntry(row.classe);
          usage[row.classe].baremes += 1;
        }
      }
      for (const row of affectationsRes.data || []) {
        if (row.classe) {
          ensureEntry(row.classe);
          usage[row.classe].affectations += 1;
        }
      }
      setClassUsageMap(usage);
    } catch (err: any) {
      console.error('[ConfigPage] Erreur chargement classes_ecole:', err);
      setSchoolClassesError(err?.message || "Impossible de charger les classes de l'école.");
    } finally {
      setIsLoadingSchoolClasses(false);
    }
  }, [authProfile?.ecole_id, ecole.id]);

  useEffect(() => {
    fetchSchoolClasses();
  }, [fetchSchoolClasses]);

  useEffect(() => {
    try {
      const targetId = window.sessionStorage.getItem('ecosurv:config-scroll-target');
      if (targetId) {
        window.sessionStorage.removeItem('ecosurv:config-scroll-target');
        window.requestAnimationFrame(() => {
          document.getElementById(targetId)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      }
    } catch {
      // Ignorer si sessionStorage est indisponible
    }
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSchool || isAddingClass) return;
    setAddClassError(null);

    const ecoleId = authProfile?.ecole_id || ecole.id;
    if (!ecoleId) {
      setAddClassError("Identifiant de l'école introuvable.");
      return;
    }

    const cleanNom = newClassName.trim();
    if (cleanNom.length < 1 || cleanNom.length > 80) {
      setAddClassError('Le nom de la classe doit contenir entre 1 et 80 caractères.');
      return;
    }

    setIsAddingClass(true);
    try {
      const maxOrdre =
        schoolClasses.length > 0 ? Math.max(...schoolClasses.map((c) => Number(c.ordre) || 0)) : 0;

      const { error } = await supabase.from('classes_ecole').insert({
        ecole_id: ecoleId,
        nom: cleanNom,
        niveau: newClassNiveau.trim() || null,
        ordre: maxOrdre + 1,
        actif: true,
      });

      if (error) {
        if (error.code === '23505') {
          setAddClassError(
            `Une classe portant le nom « ${cleanNom} » existe déjà dans votre école (erreur 23505 : doublon).`
          );
        } else {
          setAddClassError(`Erreur (${error.code || 'BDD'}) : ${error.message}`);
        }
        return;
      }

      setNewClassName('');
      setNewClassNiveau('');
      await fetchSchoolClasses();
      notifyClassesChanged();
      showToast(`✓ Classe « ${cleanNom} » ajoutée avec succès.`);
    } catch (err: any) {
      setAddClassError(err?.message || "Erreur inattendue lors de l'ajout de la classe.");
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleOpenRenameModal = (cls: ClasseEcole) => {
    setRenamingClass(cls);
    setRenameValue(cls.nom);
    setRenameClassError(null);
  };

  const handleConfirmRenameClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSchool || !renamingClass || isRenamingClass) return;
    setRenameClassError(null);

    const ecoleId = authProfile?.ecole_id || ecole.id;
    if (!ecoleId) return;

    const cleanNom = renameValue.trim();
    if (cleanNom.length < 1 || cleanNom.length > 80) {
      setRenameClassError('Le nom de la classe doit contenir entre 1 et 80 caractères.');
      return;
    }

    if (cleanNom === renamingClass.nom) {
      setRenamingClass(null);
      return;
    }

    setIsRenamingClass(true);
    try {
      // Vérification stricte avant renommage : aucun élève, aucun barème, aucune affectation d'enseignant
      const [elevesCheck, baremesCheck, affectationsCheck] = await Promise.all([
        supabase
          .from('eleves')
          .select('id', { count: 'exact', head: true })
          .eq('ecole_id', ecoleId)
          .eq('classe', renamingClass.nom),
        supabase
          .from('baremes_echeances')
          .select('id', { count: 'exact', head: true })
          .eq('ecole_id', ecoleId)
          .eq('classe', renamingClass.nom),
        supabase
          .from('affectations_enseignants')
          .select('enseignant_id', { count: 'exact', head: true })
          .eq('ecole_id', ecoleId)
          .eq('classe', renamingClass.nom),
      ]);

      const nbEleves = elevesCheck.count || 0;
      const nbBaremes = baremesCheck.count || 0;
      const nbAffectations = affectationsCheck.count || 0;

      if (nbEleves > 0 || nbBaremes > 0 || nbAffectations > 0) {
        setRenameClassError(
          `Renommage bloqué : cette classe est utilisée (${nbEleves} élève(s), ${nbBaremes} barème(s), ${nbAffectations} affectation(s)).`
        );
        await fetchSchoolClasses();
        return;
      }

      const { error } = await supabase
        .from('classes_ecole')
        .update({ nom: cleanNom })
        .eq('id', renamingClass.id)
        .eq('ecole_id', ecoleId);

      if (error) {
        if (error.code === '23505') {
          setRenameClassError(
            `Une classe portant le nom « ${cleanNom} » existe déjà dans votre école (erreur 23505 : doublon).`
          );
        } else {
          setRenameClassError(`Erreur (${error.code || 'BDD'}) : ${error.message}`);
        }
        return;
      }

      setRenamingClass(null);
      await fetchSchoolClasses();
      notifyClassesChanged();
      showToast(`✓ Classe renommée en « ${cleanNom} ».`);
    } catch (err: any) {
      setRenameClassError(err?.message || 'Erreur inattendue lors du renommage.');
    } finally {
      setIsRenamingClass(false);
    }
  };

  const handleToggleClassActive = async (cls: ClasseEcole) => {
    if (!canEditSchool || togglingClassId) return;
    const ecoleId = authProfile?.ecole_id || ecole.id;
    if (!ecoleId) return;

    setTogglingClassId(cls.id);
    try {
      const nextActif = !cls.actif;
      const { error } = await supabase
        .from('classes_ecole')
        .update({ actif: nextActif })
        .eq('id', cls.id)
        .eq('ecole_id', ecoleId);

      if (error) {
        showToast(`Erreur (${error.code || 'BDD'}) : ${error.message}`);
        return;
      }

      await fetchSchoolClasses();
      notifyClassesChanged();
      showToast(
        nextActif
          ? `✓ Classe « ${cls.nom} » réactivée.`
          : `✓ Classe « ${cls.nom} » désactivée (les élèves inscrits conservent leur classe).`
      );
    } catch (err: any) {
      showToast(`Erreur : ${err?.message || 'Impossible de modifier le statut de la classe.'}`);
    } finally {
      setTogglingClassId(null);
    }
  };

  const handleOpenModelModal = () => {
    const existingNames = new Set(schoolClasses.map((c) => c.nom));
    const missingNames = modeleMauritanienItems
      .filter((item) => !existingNames.has(item.nom))
      .map((item) => item.nom);
    setSelectedModelClasses(missingNames);
    setModelModalError(null);
    setIsModelModalOpen(true);
  };

  const handleInsertModelClasses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSchool || isInsertingModel) return;
    setModelModalError(null);

    const ecoleId = authProfile?.ecole_id || ecole.id;
    if (!ecoleId) {
      setModelModalError("Identifiant de l'école introuvable.");
      return;
    }

    const selectedItems = modeleMauritanienItems.filter((item) =>
      selectedModelClasses.includes(item.nom)
    );

    if (selectedItems.length === 0) {
      setModelModalError('Veuillez cocher au moins une classe à ajouter.');
      return;
    }

    setIsInsertingModel(true);
    try {
      const rows = selectedItems.map((item) => ({
        ecole_id: ecoleId,
        nom: item.nom,
        niveau: item.niveau,
        ordre: item.ordre,
        actif: true,
      }));

      const { error } = await supabase
        .from('classes_ecole')
        .upsert(rows, { onConflict: 'ecole_id,nom', ignoreDuplicates: true });

      if (error) {
        setModelModalError(`Erreur (${error.code || 'BDD'}) : ${error.message}`);
        return;
      }

      setIsModelModalOpen(false);
      await fetchSchoolClasses();
      notifyClassesChanged();
      showToast(`✓ ${selectedItems.length} classe(s) du modèle mauritanien ajoutée(s).`);
    } catch (err: any) {
      setModelModalError(err?.message || "Erreur inattendue lors de l'insertion des classes.");
    } finally {
      setIsInsertingModel(false);
    }
  };

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchStaff = async () => {
    if (!authProfile?.ecole_id) return;
    setIsLoadingStaff(true);
    setStaffError(null);
    try {
      const { data: profilsData, error: profilsErr } = await supabase
        .from('profils')
        .select('*')
        .eq('ecole_id', authProfile.ecole_id)
        .order('created_at', { ascending: false });

      if (profilsErr) {
        throw profilsErr;
      }

      if (profilsData) {
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
          date_ajout: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '',
        }));
        setStaffList(mapped);
      } else {
        setStaffList([]);
      }
    } catch (e: any) {
      console.warn('[ConfigPage] Erreur chargement staff:', e);
      setStaffError(e?.message || 'Erreur lors du chargement des membres');
      setStaffList([]);
    } finally {
      setIsLoadingStaff(false);
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
    setFormData({
      ...ecole,
      annee_scolaire: ecole.annee_scolaire || anneeScolaireSuggeree(),
    });
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
  const [newClasse, setNewClasse] = useState('');
  const [testStaffActionLink, setTestStaffActionLink] = useState<{ label: string; link: string } | null>(null);

  useEffect(() => {
    if (!newClasse && activeClasses.length > 0) {
      setNewClasse(activeClasses[0]);
    }
  }, [activeClasses, newClasse]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveEcoleInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditSchool) {
      showToast("Seuls le directeur et le super administrateur peuvent modifier les paramètres de l'établissement.");
      return;
    }

    const ecoleId = authProfile?.ecole_id || ecole.id;
    if (!ecoleId) {
      showToast("Erreur : identifiant de l'établissement introuvable.");
      return;
    }

    const nomTrimmed = (formData.nom || '').trim();
    if (!nomTrimmed) {
      showToast("Le nom officiel de l'école est obligatoire.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        nom: nomTrimmed,
        ville: (formData.ville || '').trim() || null,
        adresse: (formData.adresse || '').trim() || null,
        telephone: (formData.telephone || '').trim() || null,
        email: (formData.email || '').trim() || null,
        annee_scolaire: (formData.annee_scolaire || '').trim() || null,
      };

      const { data, error } = await supabase
        .from('ecoles')
        .update(payload)
        .eq('id', ecoleId)
        .select('id, nom, ville, adresse, telephone, email, annee_scolaire, statut_activation, statut_abonnement')
        .single();

      if (error) {
        console.error('[ConfigPage] Erreur mise à jour école:', error.code, error.message, error.details);
        showToast(`Erreur (${error.code || 'BDD'}) : ${error.message || 'Impossible de mettre à jour le profil de l’établissement'}`);
      } else if (data) {
        syncEcoleStores(data);
        setFormData((prev) => ({
          ...prev,
          nom: data.nom || '',
          ville: data.ville || '',
          adresse: data.adresse || '',
          telephone: data.telephone || '',
          email: data.email || '',
          annee_scolaire: data.annee_scolaire || '',
        }));
        showToast("✓ Coordonnées et paramètres de l'établissement enregistrés avec succès !");
      }
    } catch (err: any) {
      console.error('[ConfigPage] Exception mise à jour école:', err);
      showToast(`Erreur inattendue : ${err?.message || 'Échec de la sauvegarde'}`);
    } finally {
      setIsSaving(false);
    }
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
        },
      });

      if (data?.actionLink) {
        setTestStaffActionLink({ label: `Invitation ${newPrenom} ${newNom}`, link: data.actionLink });
      }

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
  const [editClasse, setEditClasse] = useState('');
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
    setEditClasse(member.classe_assignee || activeClasses[0] || '');
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
        },
      });

      if (data?.actionLink) {
        setTestStaffActionLink({ label: `Réinitialisation mot de passe (${member.email})`, link: data.actionLink });
      }

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
          title="Année scolaire"
          customValue={ecole.annee_scolaire || 'Non configurée'}
          subtitle="Exercice scolaire de l'établissement"
          icon={<School className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="warning"
        />
      </div>

      {/* School Information Form */}
      <Card
        id="section-profil-ecole"
        className="p-6 sm:p-8 space-y-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Profil de l'Établissement
            </h3>
            {!canEditSchool && (
              <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                Lecture seule
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveEcoleInfo} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom officiel de l'école <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom || ''}
                disabled={!canEditSchool}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Année Scolaire Active <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.annee_scolaire || ''}
                onChange={(val) => setFormData({ ...formData, annee_scolaire: String(val) })}
                options={getAnneeScolaireOptions(formData.annee_scolaire)}
                placeholder="Sélectionner une année scolaire..."
                disabled={!canEditSchool}
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
                value={formData.ville || ''}
                disabled={!canEditSchool}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Téléphone Officiel
              </label>
              <input
                type="text"
                value={formData.telephone || ''}
                disabled={!canEditSchool}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email de Contact
              </label>
              <input
                type="email"
                value={formData.email || ''}
                disabled={!canEditSchool}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Adresse Physique
            </label>
            <input
              type="text"
              value={formData.adresse || ''}
              disabled={!canEditSchool}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {canEditSchool ? (
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
          ) : (
            <div className="pt-2 text-xs text-slate-500 italic">
              Modification réservée au directeur ou au super administrateur de l'établissement.
            </div>
          )}
        </form>
      </Card>

      {/* Section Classes de l'école */}
      <Card
        id="section-classes-ecole"
        className="p-6 sm:p-8 space-y-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Classes de l'école ({schoolClasses.length})
              </h3>
              {!canEditSchool && (
                <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                  Lecture seule
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Une classe désactivée n'est plus proposée pour de nouveaux élèves, mais les élèves qui y sont déjà gardent leur classe.
            </p>
          </div>

          {canEditSchool && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={handleOpenModelModal}
            >
              <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Ajouter les classes du modèle mauritanien
            </Button>
          )}
        </div>

        {/* Formulaire d'ajout d'une classe */}
        {canEditSchool && (
          <form
            onSubmit={handleAddClass}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs"
          >
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Ajouter une classe personnalisée
            </div>

            {addClassError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{addClassError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom de la classe (1 à 80 caractères) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ex: 1AF (CI / CP1), 6ème Bilingue, Terminale C..."
                  disabled={isAddingClass}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Niveau (facultatif)
                </label>
                <Select
                  value={newClassNiveau}
                  onChange={setNewClassNiveau}
                  disabled={isAddingClass}
                  options={[
                    { value: '', label: 'Non spécifié' },
                    { value: 'Maternelle', label: 'Maternelle' },
                    { value: 'Primaire', label: 'Primaire' },
                    { value: 'Collège', label: 'Collège' },
                    { value: 'Lycée', label: 'Lycée' },
                  ]}
                  size="sm"
                  triggerClassName="w-full h-10 rounded-xl font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isAddingClass || !newClassName.trim()}
                  className="w-full h-10 justify-center gap-1.5"
                >
                  {isAddingClass ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Ajouter</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Liste des classes de l'école */}
        {schoolClassesError ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{schoolClassesError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSchoolClasses}>
              Réessayer
            </Button>
          </div>
        ) : isLoadingSchoolClasses ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Chargement des classes de l'école...</span>
          </div>
        ) : schoolClasses.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <School className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Aucune classe définie pour cet établissement
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Ajoutez vos classes ci-dessus ou utilisez le bouton « Ajouter les classes du modèle mauritanien » pour initialiser votre établissement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nom de la classe</th>
                  <th className="py-3.5 px-4">Niveau</th>
                  <th className="py-3.5 px-4 text-center">Élèves inscrits</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  {canEditSchool && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {schoolClasses.map((cls) => {
                  const usage = classUsageMap[cls.nom] || {
                    eleves: 0,
                    baremes: 0,
                    affectations: 0,
                  };
                  const isReferenced =
                    usage.eleves > 0 || usage.baremes > 0 || usage.affectations > 0;
                  const renameBlockedReason = isReferenced
                    ? `Renommage désactivé : classe utilisée (${usage.eleves} élève(s), ${usage.baremes} barème(s), ${usage.affectations} affectation(s) d'enseignant).`
                    : 'Renommer cette classe';

                  return (
                    <tr
                      key={cls.id}
                      className={`transition-colors ${
                        cls.actif
                          ? 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                          : 'bg-slate-50/40 dark:bg-slate-900/40 opacity-75'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {cls.nom}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {cls.niveau ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
                            {cls.niveau}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non spécifié</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {usage.eleves}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cls.actif ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Désactivée
                          </span>
                        )}
                      </td>
                      {canEditSchool && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Tooltip content={renameBlockedReason}>
                              <span className="inline-block">
                                <button
                                  type="button"
                                  disabled={isReferenced}
                                  title={renameBlockedReason}
                                  onClick={() => {
                                    if (isReferenced) return;
                                    handleOpenRenameModal(cls);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Renommer</span>
                                </button>
                              </span>
                            </Tooltip>

                            <button
                              type="button"
                              disabled={togglingClassId === cls.id}
                              onClick={() => handleToggleClassActive(cls)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                                cls.actif
                                  ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                                  : 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {togglingClassId === cls.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )}
                              <span>{cls.actif ? 'Désactiver' : 'Réactiver'}</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Test Link Banner (Mode Diagnostic/Dev Uniquement) */}
      {testStaffActionLink && (
        <div className="relative animate-in fade-in">
          <TestActivationLinkBanner
            actionLink={testStaffActionLink.link}
            title={`Lien de secours généré (Mode Test) — ${testStaffActionLink.label}`}
          />
          <button
            type="button"
            onClick={() => setTestStaffActionLink(null)}
            className="absolute top-3 right-3 text-amber-800 dark:text-amber-200 hover:text-amber-950 dark:hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/40"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Staff Directory Table */}
      <div
        id="section-personnel-ecole"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
      >
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

        <AdaptiveTable
          data={paginatedStaff}
          keyExtractor={(member) => member.id}
          bordered={false}
          cardsContainerClassName="p-3 sm:p-4"
          isLoading={isLoadingStaff}
          emptyState={
            staffError ? (
              <div className="py-8 px-4 text-center space-y-3 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Erreur de chargement du personnel
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {staffError}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchStaff}
                  className="gap-2 mx-auto"
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="py-8 px-4 text-center space-y-2 max-w-md mx-auto">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Aucun membre du personnel
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invitez des enseignants ou surveillants avec le bouton « Inviter un membre ».
                </p>
              </div>
            )
          }
          columns={[
            {
              id: 'avatar',
              header: '',
              cardRole: 'avatar',
              className: 'w-10 pr-0',
              render: (member) => {
                const initials = `${member.prenom.charAt(0)}${member.nom.charAt(0)}`.toUpperCase();
                return (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                    {initials}
                  </div>
                );
              },
            },
            {
              id: 'nom',
              header: 'Membre du Personnel',
              cardRole: 'title',
              className: 'min-w-[200px]',
              render: (member) => (
                <div className="min-w-0">
                  <Tooltip content={`${member.prenom} ${member.nom}`} as="div" className="block min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {member.prenom} {member.nom}
                    </div>
                  </Tooltip>
                  <Tooltip content={member.email} as="div" className="block min-w-0 md:hidden">
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-normal">
                      {member.email}
                    </div>
                  </Tooltip>
                </div>
              ),
            },
            {
              id: 'role',
              header: 'Rôle Attribué',
              cardRole: 'key-fact',
              cardLabel: 'Habilitation',
              render: (member) => {
                const roleInfo = roleLabels[member.role] || roleLabels.enseignant;
                return (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${roleInfo.badge}`}
                  >
                    {roleInfo.label}
                  </span>
                );
              },
            },
            {
              id: 'classe',
              header: 'Classe Assignée',
              cardRole: 'key-fact',
              cardLabel: 'Classe assignée',
              render: (member) =>
                member.classe_assignee ? (
                  <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {member.classe_assignee}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                    Établissement entier
                  </span>
                ),
            },
            {
              id: 'telephone',
              header: 'Coordonnées',
              cardRole: 'key-fact',
              cardLabel: 'Téléphone',
              render: (member) => (
                <span className="font-mono text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                  {member.telephone}
                </span>
              ),
            },
            {
              id: 'date_ajout',
              header: 'Date Ajout',
              cardRole: 'key-fact',
              cardLabel: 'Date ajout',
              align: 'center',
              render: (member) => (
                <span className="font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                  {member.date_ajout}
                </span>
              ),
            },
            {
              id: 'statut',
              header: 'Statut Compte',
              cardRole: 'badge',
              align: 'center',
              render: (member) =>
                member.actif ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full font-bold text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full font-bold text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    En attente
                  </span>
                ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cardRole: 'action',
              align: 'right',
              render: (member) => (
                <div className="relative staff-menu-container">
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
                    <div className="absolute right-0 top-9 sm:top-11 z-30 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-left animate-in fade-in zoom-in-95">
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
                </div>
              ),
            },
          ]}
        />

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
                  placeholder="contact@ecole.mr"
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
                  {!isLoadingActiveClasses && activeClasses.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                      Aucune classe définie. Ajoutez vos classes dans Configuration &gt; Classes.
                    </div>
                  ) : (
                    <Select
                      value={newClasse}
                      onChange={setNewClasse}
                      disabled={isInviting || activeClasses.length === 0}
                      options={activeClasses.map((c) => ({ value: c, label: c }))}
                      placeholder="Sélectionner une classe..."
                      size="sm"
                      triggerClassName="w-full h-9 rounded-lg font-semibold"
                    />
                  )}
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  disabled={isInviting || (newRole === 'enseignant' && activeClasses.length === 0)}
                >
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
                  {!isLoadingActiveClasses && activeClasses.length === 0 && !editClasse ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                      Aucune classe définie. Ajoutez vos classes dans Configuration &gt; Classes.
                    </div>
                  ) : (
                    <Select
                      value={editClasse}
                      onChange={setEditClasse}
                      disabled={isUpdatingMember}
                      options={Array.from(
                        new Set(editClasse ? [editClasse, ...activeClasses] : activeClasses)
                      ).map((c) => ({ value: c, label: c }))}
                      placeholder="Sélectionner une classe..."
                      size="sm"
                      triggerClassName="w-full h-9 rounded-lg font-semibold"
                    />
                  )}
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

      {/* Modal Renommer une classe */}
      {renamingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Renommer la classe « {renamingClass.nom} »
              </h3>
              <button
                type="button"
                onClick={() => setRenamingClass(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renameClassError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{renameClassError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRenameClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nouveau nom (1 à 80 caractères) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  disabled={isRenamingClass}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRenamingClass}
                  onClick={() => setRenamingClass(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isRenamingClass || !renameValue.trim()}
                  className="gap-1.5"
                >
                  {isRenamingClass ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajouter les classes du modèle mauritanien */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Ajouter les classes du modèle mauritanien
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sélectionnez les classes à créer pour votre établissement (les doublons éventuels sont ignorés automatiquement).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modelModalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modelModalError}</span>
              </div>
            )}

            <div className="flex items-center justify-between px-1 text-xs shrink-0">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {selectedModelClasses.length} classe(s) sélectionnée(s) sur {modeleMauritanienItems.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedModelClasses.length === modeleMauritanienItems.length) {
                    setSelectedModelClasses([]);
                  } else {
                    setSelectedModelClasses(modeleMauritanienItems.map((i) => i.nom));
                  }
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {selectedModelClasses.length === modeleMauritanienItems.length
                  ? 'Tout décocher'
                  : 'Tout cocher'}
              </button>
            </div>

            <form
              onSubmit={handleInsertModelClasses}
              className="flex-1 flex flex-col min-h-0 space-y-4 text-xs"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {NIVEAUX_SCOLAIRES_ORDRE.map((niveau) => {
                  const groupItems = modeleMauritanienItems.filter((i) => i.niveau === niveau);
                  const existingSet = new Set(schoolClasses.map((c) => c.nom));

                  return (
                    <div
                      key={niveau}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                        {niveau} ({groupItems.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groupItems.map((item) => {
                          const checked = selectedModelClasses.includes(item.nom);
                          const alreadyExists = existingSet.has(item.nom);
                          return (
                            <label
                              key={item.nom}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedModelClasses((prev) => [...prev, item.nom]);
                                    } else {
                                      setSelectedModelClasses((prev) =>
                                        prev.filter((n) => n !== item.nom)
                                      );
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {item.nom}
                                </span>
                              </div>
                              {alreadyExists && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                  Déjà créée
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isInsertingModel}
                  onClick={() => setIsModelModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isInsertingModel || selectedModelClasses.length === 0}
                  className="gap-1.5"
                >
                  {isInsertingModel ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Insertion...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Ajouter la sélection ({selectedModelClasses.length})</span>
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
