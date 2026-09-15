import { useAuthStore, type UserProfile } from '../store/useAuthStore';

export interface Session {
  userId: string;
  profile: UserProfile;
  /** École du profil ; null uniquement pour un super_admin, qui n'a pas de portail. */
  ecoleId: string | null;
}

/**
 * Session de l'utilisateur connecté, pour les écrans des portails.
 * Ces écrans ne sont rendus qu'une fois le profil chargé (AuthGate) ; un
 * appel hors session est une erreur de programmation.
 */
export function useSession(): Session {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  if (!user || !profile) {
    throw new Error('useSession appelé hors d’une session authentifiée');
  }
  return { userId: user.id, profile, ecoleId: profile.ecole_id };
}
