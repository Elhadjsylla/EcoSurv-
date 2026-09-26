import { supabase } from './supabase';

export interface AuditEventParams {
  actionType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  actorEmail?: string;
}

/**
 * Journalise un événement dans la table public.audit_logs
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    await supabase.from('audit_logs').insert([
      {
        actor_id: user?.id || null,
        actor_email: params.actorEmail || user?.email || 'superadmin@ecosurv.mr',
        action_type: params.actionType,
        target_id: params.targetId || null,
        metadata: params.metadata || {},
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('[AuditLogger] Échec écriture audit_logs (non bloquant):', err);
  }
}

/**
 * Journalise une connexion réussie d'un Super Admin ou utilisateur
 */
export async function logLoginSuccess(
  userEmail: string,
  role: string = 'super_admin',
  metadata: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent({
    actionType: 'auth.login_success',
    targetId: `session-${Date.now()}`,
    actorEmail: userEmail,
    metadata: {
      role,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  });
}

/**
 * Journalise la consultation des détails complets d'un utilisateur par un Super Admin
 */
export async function logUserDetailsViewed(
  targetUserId: string,
  targetUserData: {
    nom: string;
    prenom: string;
    email: string;
    role: string;
    ecole_nom?: string;
  }
): Promise<void> {
  await logAuditEvent({
    actionType: 'user.details_viewed',
    targetId: targetUserId,
    metadata: {
      cible_nom: `${targetUserData.prenom} ${targetUserData.nom}`,
      cible_email: targetUserData.email,
      cible_role: targetUserData.role,
      cible_ecole: targetUserData.ecole_nom || 'Gestion Globale',
      consulte_le: new Date().toISOString(),
    },
  });
}

/**
 * Journalise le changement de statut (activation / désactivation) d'un utilisateur
 */
export async function logUserStatusChanged(
  targetUserId: string,
  precedentStatut: boolean,
  nouveauStatut: boolean,
  userEmail?: string
): Promise<void> {
  await logAuditEvent({
    actionType: 'user.status_changed',
    targetId: targetUserId,
    metadata: {
      user_email: userEmail,
      precedent_statut: precedentStatut ? 'actif' : 'inactif',
      nouveau_statut: nouveauStatut ? 'actif' : 'inactif',
      horodatage: new Date().toISOString(),
    },
  });
}

/**
 * Journalise le changement de statut d'activation d'un établissement
 */
export async function logSchoolStatusChanged(
  schoolId: string,
  precedentStatut: string,
  nouveauStatut: string
): Promise<void> {
  await logAuditEvent({
    actionType: 'school.status_changed',
    targetId: schoolId,
    metadata: {
      precedent_statut: precedentStatut,
      nouveau_statut: nouveauStatut,
      horodatage: new Date().toISOString(),
    },
  });
}
