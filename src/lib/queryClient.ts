import { QueryClient } from '@tanstack/react-query';

/**
 * Cache des données serveur, partagé par toute l'application.
 * Vidé à chaque déconnexion : aucune donnée d'un compte ne doit rester
 * lisible par le compte suivant sur le même poste.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
