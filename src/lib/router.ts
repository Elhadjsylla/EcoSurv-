import type { ViewMode, AppRoute } from '../store/useNavigationStore';
import type { PortalRole } from '../store/useAuthStore';

export interface RouteMatch {
  viewMode: ViewMode;
  route?: AppRoute;
  portal?: PortalRole;
}

export const ROUTE_TO_PATH: Record<string, string> = {
  // Vues publiques
  landing: '/',
  login: '/login',
  register: '/register',
  pending_activation: '/activation',
  set_password: '/set-password',
  admin_console: '/admin',

  // Portail Directeur
  dashboard: '/dashboard',
  eleves: '/eleves',
  echeances: '/echeances',
  relances: '/relances',
  rapports: '/rapports',
  config: '/configuration',

  // Portail Enseignant
  teacher_dashboard: '/enseignant/dashboard',
  teacher_classes: '/enseignant/classes',
  teacher_absences: '/enseignant/absences',
  teacher_grades: '/enseignant/notes',

  // Portail Caissier
  caissier_guichet: '/caisse/guichet',
  caissier_journal: '/caisse/journal',
  caissier_impayes: '/caisse/impayes',

  // Portail Parent
  parent_dashboard: '/parent/dashboard',
  parent_paiements: '/parent/paiements',
  parent_pedagogie: '/parent/pedagogie',
  parent_assiduite: '/parent/assiduite',
};

/**
 * Analyse le pathname de l'URL du navigateur et extrait le mode de vue et l'écran cible.
 */
export function parsePath(pathname: string): RouteMatch {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // Vues publiques
  if (clean === '/' || clean === '/landing') return { viewMode: 'landing' };
  if (clean === '/login' || clean === '/connexion') return { viewMode: 'login' };
  if (clean === '/register' || clean === '/inscription') return { viewMode: 'register' };
  if (clean === '/activation' || clean === '/pending_activation') return { viewMode: 'pending_activation' };
  if (clean === '/set-password' || clean === '/reinitialisation') return { viewMode: 'set_password' };
  if (clean === '/admin' || clean === '/super-admin' || clean === '/super_admin') return { viewMode: 'admin_console' };

  // Routes Directeur
  if (clean === '/dashboard' || clean === '/directeur') return { viewMode: 'app', portal: 'directeur', route: 'dashboard' };
  if (clean === '/eleves') return { viewMode: 'app', portal: 'directeur', route: 'eleves' };
  if (clean === '/echeances') return { viewMode: 'app', portal: 'directeur', route: 'echeances' };
  if (clean === '/relances') return { viewMode: 'app', portal: 'directeur', route: 'relances' };
  if (clean === '/rapports') return { viewMode: 'app', portal: 'directeur', route: 'rapports' };
  if (clean === '/configuration' || clean === '/config') return { viewMode: 'app', portal: 'directeur', route: 'config' };

  // Routes Enseignant
  if (clean === '/enseignant' || clean === '/enseignant/dashboard') return { viewMode: 'app', portal: 'enseignant', route: 'teacher_dashboard' };
  if (clean === '/enseignant/classes') return { viewMode: 'app', portal: 'enseignant', route: 'teacher_classes' };
  if (clean === '/enseignant/absences') return { viewMode: 'app', portal: 'enseignant', route: 'teacher_absences' };
  if (clean === '/enseignant/notes' || clean === '/enseignant/grades') return { viewMode: 'app', portal: 'enseignant', route: 'teacher_grades' };

  // Routes Caissier
  if (clean === '/caisse' || clean === '/caisse/guichet' || clean === '/caissier') return { viewMode: 'app', portal: 'caissier', route: 'caissier_guichet' };
  if (clean === '/caisse/journal') return { viewMode: 'app', portal: 'caissier', route: 'caissier_journal' };
  if (clean === '/caisse/impayes') return { viewMode: 'app', portal: 'caissier', route: 'caissier_impayes' };

  // Routes Parent
  if (clean === '/parent' || clean === '/parent/dashboard') return { viewMode: 'app', portal: 'parent', route: 'parent_dashboard' };
  if (clean === '/parent/paiements') return { viewMode: 'app', portal: 'parent', route: 'parent_paiements' };
  if (clean === '/parent/pedagogie') return { viewMode: 'app', portal: 'parent', route: 'parent_pedagogie' };
  if (clean === '/parent/assiduite') return { viewMode: 'app', portal: 'parent', route: 'parent_assiduite' };

  return { viewMode: 'landing' };
}

/**
 * Déduit l'URL canonique pour l'état actuel de navigation.
 */
export function getPathForState(viewMode: ViewMode, currentRoute?: AppRoute): string {
  if (viewMode === 'app' && currentRoute) {
    return ROUTE_TO_PATH[currentRoute] || '/dashboard';
  }
  return ROUTE_TO_PATH[viewMode] || '/';
}
