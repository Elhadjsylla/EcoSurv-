import type { NavTab } from '../components/ui/Sidebar';
import type { TeacherNavTab } from '../components/enseignant/TeacherSidebar';
import type { CaissierNavTab } from '../components/caissier/CaissierSidebar';
import type { ParentNavTab } from '../components/parent/ParentSidebar';
import type { RoleUtilisateur } from '../types/database';

/** Portails de l'application web. Le super_admin n'en a pas (console à venir). */
export type Portal = 'directeur' | 'enseignant' | 'caissier' | 'parent';

export type AppRoute = NavTab | TeacherNavTab | CaissierNavTab | ParentNavTab;

/**
 * Écrans de chaque portail. Toute navigation vers un écran absent de la
 * liste du portail de l'utilisateur est refusée : un enseignant ne peut pas
 * afficher un écran du caissier, même en forçant la navigation.
 */
export const ROUTES_BY_PORTAL: Record<Portal, readonly AppRoute[]> = {
  directeur: ['dashboard', 'eleves', 'echeances', 'relances', 'rapports', 'config'],
  enseignant: ['teacher_dashboard', 'teacher_classes', 'teacher_absences', 'teacher_grades'],
  caissier: ['caissier_guichet', 'caissier_journal', 'caissier_impayes'],
  parent: ['parent_dashboard', 'parent_paiements', 'parent_pedagogie', 'parent_assiduite'],
};

/** Écran d'arrivée de chaque portail. */
export const PORTAL_HOME: Record<Portal, AppRoute> = {
  directeur: 'dashboard',
  enseignant: 'teacher_dashboard',
  caissier: 'caissier_guichet',
  parent: 'parent_dashboard',
};

/** Portail correspondant au rôle lu dans `profils`, ou null pour le super_admin. */
export function portalForRole(role: RoleUtilisateur): Portal | null {
  return role === 'super_admin' ? null : role;
}

export function isRouteOfPortal(route: AppRoute | undefined, portal: Portal): route is AppRoute {
  return route !== undefined && ROUTES_BY_PORTAL[portal].includes(route);
}
