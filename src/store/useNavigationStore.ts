import { create } from 'zustand';
import type { UserRole } from '../components/ui/Header';
import type { NavTab } from '../components/ui/Sidebar';
import type { TeacherNavTab } from '../components/enseignant/TeacherSidebar';
import type { CaissierNavTab } from '../components/caissier/CaissierSidebar';
import type { ParentNavTab } from '../components/parent/ParentSidebar';

export type AppRoute = NavTab | TeacherNavTab | CaissierNavTab | ParentNavTab;

/** Écran d'arrivée de chaque portail. */
export const PORTAL_HOME: Record<UserRole, AppRoute> = {
  directeur: 'dashboard',
  enseignant: 'teacher_dashboard',
  caissier: 'caissier_guichet',
  parent: 'parent_dashboard',
};

/** Au-delà, les entrées les plus anciennes sont oubliées, comme dans un navigateur. */
export const MAX_HISTORY_ENTRIES = 50;

export type ViewMode = 'landing' | 'app';

export const PORTAL_ROUTES: Record<UserRole, AppRoute[]> = {
  directeur: ['dashboard', 'eleves', 'echeances', 'relances', 'rapports', 'config'],
  enseignant: ['teacher_dashboard', 'teacher_classes', 'teacher_absences', 'teacher_grades'],
  caissier: ['caissier_guichet', 'caissier_journal', 'caissier_impayes'],
  parent: ['parent_dashboard', 'parent_paiements', 'parent_pedagogie', 'parent_assiduite'],
};

export const isRouteAllowedForRole = (role: UserRole, route: AppRoute): boolean => {
  return PORTAL_ROUTES[role]?.includes(route) ?? false;
};

interface NavigationState {
  viewMode: ViewMode;
  userRole: UserRole;
  portal: UserRole;
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
  switchPortal: (portal: UserRole) => void;
  setViewMode: (mode: ViewMode) => void;
  launchAppWithPortal: (portal?: UserRole) => void;
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
  userRole: 'directeur' as UserRole,
  portal: 'directeur' as UserRole,
  isMobileMenuOpen: false,
  ...positionAt([PORTAL_HOME.directeur], 0),
};

/**
 * Historique de navigation interne à l'application (boutons Précédent / Suivant
 * et swipe trackpad) et gestion du mode Vue (Landing vitrine vs Application opérationnelle).
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  ...initialState,

  setUserRole: (role) => set({ userRole: role }),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setViewMode: (mode) => set({ viewMode: mode, isMobileMenuOpen: false }),

  launchAppWithPortal: (portal) =>
    set(() => {
      const targetRole = portal || 'directeur';
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
      let targetRoute = route;
      if (state.userRole !== 'directeur') {
        if (!isRouteAllowedForRole(state.userRole, route)) {
          targetRoute = PORTAL_HOME[state.userRole];
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
      // Seul le DIRECTEUR peut basculer de portail ("voir en tant que")
      if (state.userRole !== 'directeur') {
        return { isMobileMenuOpen: false };
      }
      return state.portal === portal
        ? { isMobileMenuOpen: false }
        : { portal, isMobileMenuOpen: false, ...positionAt([PORTAL_HOME[portal]], 0) };
    }),

  reset: () => set(initialState),
}));

export const selectCurrentRoute = (s: NavigationState) => s.entries[s.index];
