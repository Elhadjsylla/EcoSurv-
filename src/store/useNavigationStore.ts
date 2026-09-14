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

interface NavigationState {
  portal: UserRole;
  /** Pile des écrans visités ; l'écran affiché est entries[index]. */
  entries: AppRoute[];
  index: number;
  navigate: (route: AppRoute) => void;
  back: () => void;
  forward: () => void;
  switchPortal: (portal: UserRole) => void;
  reset: () => void;
}

const initialState: Pick<NavigationState, 'portal' | 'entries' | 'index'> = {
  portal: 'directeur',
  entries: [PORTAL_HOME.directeur],
  index: 0,
};

/**
 * Historique de navigation interne à l'application (boutons Précédent / Suivant).
 *
 * Gardé en mémoire uniquement : jamais persisté, et réinitialisé au changement
 * de portail ou à la déconnexion.
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  ...initialState,

  navigate: (route) =>
    set((state) => {
      // Rouvrir l'écran courant n'ajoute pas d'entrée.
      if (state.entries[state.index] === route) return state;
      // Naviguer depuis le milieu de la pile efface l'historique « suivant ».
      const entries = [...state.entries.slice(0, state.index + 1), route].slice(-MAX_HISTORY_ENTRIES);
      return { entries, index: entries.length - 1 };
    }),

  back: () => set((state) => (state.index > 0 ? { index: state.index - 1 } : state)),

  forward: () =>
    set((state) => (state.index < state.entries.length - 1 ? { index: state.index + 1 } : state)),

  switchPortal: (portal) =>
    set((state) =>
      state.portal === portal ? state : { portal, entries: [PORTAL_HOME[portal]], index: 0 }
    ),

  reset: () => set(initialState),
}));

export const selectCurrentRoute = (s: NavigationState) => s.entries[s.index];
export const selectCanGoBack = (s: NavigationState) => s.index > 0;
export const selectCanGoForward = (s: NavigationState) => s.index < s.entries.length - 1;
