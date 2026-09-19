import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface NotificationItem {
  id: string;
  ecole_id: string;
  user_id: string;
  titre: string;
  message: string;
  type: 'info' | 'paiement' | 'rappel' | 'alerte' | 'systeme';
  lu: boolean;
  created_at: string;
  lien_onglet?: string;
}

const INITIAL_NOTIFICATIONS_BY_ROLE: Record<string, NotificationItem[]> = {
  directeur: [
    {
      id: 'notif-dir-1',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-dir-001',
      titre: 'Campagne de relances SMS exécutée',
      message: '8 rappels d\'échéance envoyés avec succès aux tuteurs d\'élèves en retard.',
      type: 'rappel',
      lu: false,
      created_at: 'Il y a 15 min',
      lien_onglet: 'relances',
    },
    {
      id: 'notif-dir-2',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-dir-001',
      titre: 'Versement important enregistré',
      message: 'Paiement de 45 000 MRU validé pour Mamadou Oury Diallo (Terminales C).',
      type: 'paiement',
      lu: false,
      created_at: 'Il y a 1h',
      lien_onglet: 'dashboard',
    },
    {
      id: 'notif-dir-3',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-dir-001',
      titre: 'Pointage des absences Terminales C',
      message: 'L\'enseignant M. Sow a renseigné 2 absences pour la séance de Mathématiques.',
      type: 'info',
      lu: true,
      created_at: 'Hier à 16:30',
      lien_onglet: 'eleves',
    },
  ],
  caissier: [
    {
      id: 'notif-cais-1',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-cais-001',
      titre: 'Rappel Clôture de Caisse',
      message: 'Pensez à éditer le journal et certifier la caisse physique avant 17h00.',
      type: 'alerte',
      lu: false,
      created_at: 'Il y a 25 min',
      lien_onglet: 'caissier_journal',
    },
    {
      id: 'notif-cais-2',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-cais-001',
      titre: 'Nouveau virement Bankily reçu',
      message: 'Notification automatique : quittance BKY-9012 rapprochée au guichet.',
      type: 'paiement',
      lu: false,
      created_at: 'Il y a 2h',
      lien_onglet: 'caissier_journal',
    },
  ],
  enseignant: [
    {
      id: 'notif-ens-1',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-ens-001',
      titre: 'Rappel saisie des notes du 2nd Trimestre',
      message: 'La clôture des moyennes pour la classe de 6ème A intervient vendredi.',
      type: 'rappel',
      lu: false,
      created_at: 'Il y a 30 min',
      lien_onglet: 'teacher_grades',
    },
    {
      id: 'notif-ens-2',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-ens-001',
      titre: 'Justificatif d\'absence validé',
      message: 'La direction a validé le certificat médical pour l\'élève Cheikh Sow.',
      type: 'info',
      lu: true,
      created_at: 'Hier à 11:20',
      lien_onglet: 'teacher_absences',
    },
  ],
  parent: [
    {
      id: 'notif-par-1',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-par-001',
      titre: 'Échéance scolarité Mars 2026',
      message: 'L\'échéance mensuelle de 15 000 MRU pour Mamadou Oury est disponible au règlement.',
      type: 'rappel',
      lu: false,
      created_at: 'Il y a 40 min',
      lien_onglet: 'parent_paiements',
    },
    {
      id: 'notif-par-2',
      ecole_id: 'ecole-demo-001',
      user_id: 'usr-par-001',
      titre: 'Bulletin du 1er Trimestre disponible',
      message: 'Les résultats scolaires de Mamadou Oury Diallo sont téléchargeables en PDF.',
      type: 'info',
      lu: false,
      created_at: 'Il y a 3h',
      lien_onglet: 'parent_pedagogie',
    },
  ],
};

interface NotificationsStoreState {
  notifications: NotificationItem[];
  loadForUser: (userId: string, role: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsStoreState>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS_BY_ROLE.directeur,

      loadForUser: async (userId, role) => {
        // 1. Tenter la lecture Supabase
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            set({ notifications: data as NotificationItem[] });
            return;
          }
        } catch {
          // Ignorer et basculer sur les données réalistes
        }

        // 2. Si pas en base ou hors-ligne, charger selon le rôle actif
        const defaultForRole = INITIAL_NOTIFICATIONS_BY_ROLE[role] || INITIAL_NOTIFICATIONS_BY_ROLE.directeur;
        // Conserver l'état lu si déjà en store
        const currentNotifs = get().notifications;
        if (currentNotifs.length > 0 && currentNotifs.some((n) => n.user_id.includes(role.slice(0, 3)))) {
          return;
        }
        set({ notifications: defaultForRole });
      },

      markAsRead: async (id: string) => {
        // Synchroniser Supabase
        try {
          await supabase.from('notifications').update({ lu: true }).eq('id', id);
        } catch {
          // ignore
        }

        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, lu: true } : n)),
        }));
      },

      markAllAsRead: async () => {
        try {
          await supabase.from('notifications').update({ lu: true }).eq('lu', false);
        } catch {
          // ignore
        }

        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, lu: true })),
        }));
      },

      unreadCount: () => {
        return get().notifications.filter((n) => !n.lu).length;
      },
    }),
    {
      name: 'ecosurv-notifications-store',
    }
  )
);
