import { create } from 'zustand';
import { useAuthStore, type UserRole, type PortalRole } from './useAuthStore';
import type { NavTab } from '../components/ui/Sidebar';
import type { TeacherNavTab } from '../components/enseignant/TeacherSidebar';
import type { CaissierNavTab } from '../components/caissier/CaissierSidebar';
import type { ParentNavTab } from '../components/parent/ParentSidebar';

export type AppRoute = NavTab | TeacherNavTab | CaissierNavTab | ParentNavTab;

/** Écran d'arrivée de chaque portail. */
export const PORTAL_HOME: Record<PortalRole, AppRoute> = {
  directeur: 'dashboard',
  enseignant: 'teacher_dashboard',
  caissier: 'caissier_guichet',
  parent: 'parent_dashboard',
};

/** Au-delà, les entrées les plus anciennes sont oubliées, comme dans un navigateur. */
export const MAX_HISTORY_ENTRIES = 50;

export type ViewMode = 'landing' | 'login' | 'register' | 'pending_activation' | 'set_password' | 'app' | 'admin_console';

export const PORTAL_ROUTES: Record<PortalRole, AppRoute[]> = {
  directeur: ['dashboard', 'eleves', 'echeances', 'paiements_attente', 'relances', 'rapports', 'config'],
  enseignant: ['teacher_dashboard', 'teacher_classes', 'teacher_absences', 'teacher_grades'],
  caissier: ['caissier_guichet', 'caissier_journal', 'caissier_impayes'],
  parent: ['parent_dashboard', 'parent_paiements', 'parent_pedagogie', 'parent_assiduite'],
};

export const isRouteAllowedForRole = (role: PortalRole, route: AppRoute): boolean => {
  return PORTAL_ROUTES[role]?.includes(route) ?? false;
};

interface NavigationState {
  viewMode: ViewMode;
  userRole: PortalRole;
  portal: PortalRole;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  /** Pile des écrans visités ; l'écran affiché est entries[index]. */
  entries: AppRoute[];
  index: number;
  canGoBack: boolean;
  canGoForward: boolean;
  navigate: (route: AppRoute) => void;
  goBack: () => void;
  goForward: () => void;
  switchPortal: (portal: PortalRole) => void;
  setViewMode: (mode: ViewMode) => void;
  navigateToLogin: () => void;
  navigateToRegister: () => void;
  navigateToPendingActivation: () => void;
  navigateToSetPassword: () => void;
  navigateToAdminConsole: () => void;
  launchAppWithPortal: (portal?: UserRole) => void;
  launchAppWithRoute: (portal: UserRole, route?: AppRoute) => void;
  navigateToUserPortal: (role?: UserRole) => void;
  setUserRole: (role: UserRole) => void;
  reset: () => void;
}

// Position dans la pile, avec les booléens qui en découlent toujours à jour.
const positionAt = (entries: AppRoute[], index: number) => ({
  entries,
  index,
  canGoBack: index > 0,
  canGoForward: index < entries.length - 1,
});

const initialState = {
  viewMode: 'landing' as ViewMode,
  userRole: 'directeur' as PortalRole,
  portal: 'directeur' as PortalRole,
  isMobileMenuOpen: false,
  ...positionAt([PORTAL_HOME.directeur], 0),
};

/**
 * Historique de navigation interne à l'application (boutons Précédent / Suivant
 * et swipe trackpad) et gestion du mode Vue (Landing vitrine vs Connexion vs Inscription vs Activation vs Application opérationnelle).
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  ...initialState,

  setUserRole: (role) => set({ userRole: (role !== 'super_admin' ? role : 'directeur') as PortalRole }),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setViewMode: (mode) => set({ viewMode: mode, isMobileMenuOpen: false }),

  navigateToLogin: () => set({ viewMode: 'login', isMobileMenuOpen: false }),
  navigateToRegister: () => set({ viewMode: 'register', isMobileMenuOpen: false }),
  navigateToPendingActivation: () => set({ viewMode: 'pending_activation', isMobileMenuOpen: false }),
  navigateToSetPassword: () => set({ viewMode: 'set_password', isMobileMenuOpen: false }),
  navigateToAdminConsole: () => set({ viewMode: 'admin_console', isMobileMenuOpen: false }),

  launchAppWithPortal: (portal) =>
    set(() => {
      const authProfile = useAuthStore.getState().profile;
      const realRole = authProfile?.role;
      let targetRole: PortalRole = (portal && portal !== 'super_admin') ? portal : 'directeur';
      if (realRole && realRole !== 'super_admin' && realRole !== 'directeur') {
        targetRole = realRole as PortalRole;
      }
      const effectiveUserRole = (realRole && realRole !== 'super_admin') ? (realRole as PortalRole) : targetRole;
      return {
        viewMode: 'app',
        userRole: effectiveUserRole,
        portal: targetRole,
        isMobileMenuOpen: false,
        ...positionAt([PORTAL_HOME[targetRole]], 0),
      };
    }),

  launchAppWithRoute: (portal, route) =>
    set(() => {
      if (portal === 'super_admin') {
        return {
          viewMode: 'admin_console',
          isMobileMenuOpen: false,
        };
      }
      const authProfile = useAuthStore.getState().profile;
      const realRole = authProfile?.role;

      let targetRole: PortalRole = (portal as PortalRole) || 'directeur';

      // Règle stricte : si le profil connecté est caissier, enseignant ou parent,
      // le portail cible NE PEUT PAS être différent de son rôle réel
      if (realRole && realRole !== 'super_admin' && realRole !== 'directeur') {
        targetRole = realRole as PortalRole;
      }

      const effectiveUserRole = (realRole && realRole !== 'super_admin') ? (realRole as PortalRole) : targetRole;
      const targetRoute = (route && isRouteAllowedForRole(targetRole, route))
        ? route
        : PORTAL_HOME[targetRole];

      return {
        viewMode: 'app',
        userRole: effectiveUserRole,
        portal: targetRole,
        isMobileMenuOpen: false,
        ...positionAt([targetRoute], 0),
      };
    }),

  navigateToUserPortal: (role) =>
    set(() => {
      if (role === 'super_admin') {
        return {
          viewMode: 'admin_console',
          isMobileMenuOpen: false,
        };
      }
      const targetRole: PortalRole = role || 'directeur';
      return {
        viewMode: 'app',
        userRole: targetRole,
        portal: targetRole,
        isMobileMenuOpen: false,
        ...positionAt([PORTAL_HOME[targetRole]], 0),
      };
    }),

  navigate: (route) =>
    set((state) => {
      // Cloisonnement strict pour les rôles non-directeur :
      // Si l'utilisateur n'est pas directeur, il ne peut naviguer hors des routes autorisées pour son rôle
      const authProfile = useAuthStore.getState().profile;
      const effectiveRole = (authProfile?.role && authProfile.role !== 'super_admin')
        ? (authProfile.role as PortalRole)
        : state.userRole;

      let targetRoute = route;
      if (effectiveRole !== 'directeur') {
        if (!isRouteAllowedForRole(effectiveRole, route)) {
          targetRoute = PORTAL_HOME[effectiveRole];
        }
      }

      // Rouvrir l'écran courant n'ajoute pas d'entrée.
      if (state.entries[state.index] === targetRoute) return { isMobileMenuOpen: false };
      // Naviguer depuis le milieu de la pile efface l'historique « suivant ».
      const entries = [...state.entries.slice(0, state.index + 1), targetRoute].slice(-MAX_HISTORY_ENTRIES);
      return { ...positionAt(entries, entries.length - 1), isMobileMenuOpen: false };
    }),

  goBack: () =>
    set((state) => (state.canGoBack ? positionAt(state.entries, state.index - 1) : state)),

  goForward: () =>
    set((state) => (state.canGoForward ? positionAt(state.entries, state.index + 1) : state)),

  switchPortal: (portal) =>
    set((state) => {
      const authProfile = useAuthStore.getState().profile;
      const realRole = (authProfile?.role && authProfile.role !== 'super_admin')
        ? (authProfile.role as PortalRole)
        : state.userRole;

      // Seul le DIRECTEUR peut basculer de portail ("voir en tant que")
      if (realRole !== 'directeur') {
        return { isMobileMenuOpen: false };
      }
      return state.portal === portal
        ? { isMobileMenuOpen: false }
        : { portal, isMobileMenuOpen: false, ...positionAt([PORTAL_HOME[portal]], 0) };
    }),

  reset: () => set(initialState),
}));

export const selectCurrentRoute = (s: NavigationState) => s.entries[s.index];
