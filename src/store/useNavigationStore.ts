import { create } from 'zustand';
import { PORTAL_HOME, isRouteOfPortal, type AppRoute, type Portal } from '../lib/portals';

export { PORTAL_HOME, type AppRoute } from '../lib/portals';

/** Au-delà, les entrées les plus anciennes sont oubliées, comme dans un navigateur. */
export const MAX_HISTORY_ENTRIES = 50;

interface NavigationState {
  /** Portail de l'utilisateur connecté, fixé à partir de son rôle réel ; null hors session. */
  portal: Portal | null;
  /** Pile des écrans visités ; l'écran affiché est entries[index]. */
  entries: AppRoute[];
  index: number;
  canGoBack: boolean;
  canGoForward: boolean;
  navigate: (route: AppRoute) => void;
  goBack: () => void;
  goForward: () => void;
  /** Ouvre la session de navigation sur l'accueil du portail du rôle connecté. */
  startSession: (portal: Portal) => void;
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
  portal: null as Portal | null,
  ...positionAt([], 0),
};

/**
 * Historique de navigation interne à l'application (boutons Précédent / Suivant
 * et swipe trackpad).
 *
 * Gardé en mémoire uniquement : jamais persisté, et réinitialisé à la
 * connexion comme à la déconnexion. Il ne peut contenir que des écrans du
 * portail de l'utilisateur connecté.
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  ...initialState,

  navigate: (route) =>
    set((state) => {
      // Écran d'un autre portail, ou aucune session : la navigation est refusée.
      if (!state.portal || !isRouteOfPortal(route, state.portal)) {
        if (import.meta.env.DEV) {
          console.warn(`[navigation] écran « ${route} » refusé pour le portail ${state.portal ?? 'hors session'}`);
        }
        return state;
      }
      // Rouvrir l'écran courant n'ajoute pas d'entrée.
      if (state.entries[state.index] === route) return state;
      // Naviguer depuis le milieu de la pile efface l'historique « suivant ».
      const entries = [...state.entries.slice(0, state.index + 1), route].slice(-MAX_HISTORY_ENTRIES);
      return positionAt(entries, entries.length - 1);
    }),

  goBack: () =>
    set((state) => (state.canGoBack ? positionAt(state.entries, state.index - 1) : state)),

  goForward: () =>
    set((state) => (state.canGoForward ? positionAt(state.entries, state.index + 1) : state)),

  startSession: (portal) => set({ portal, ...positionAt([PORTAL_HOME[portal]], 0) }),

  reset: () => set(initialState),
}));

export const selectCurrentRoute = (s: NavigationState) => s.entries[s.index];
