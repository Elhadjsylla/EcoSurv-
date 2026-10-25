import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface NotificationItem {
  id: string;
  ecole_id: string;
  user_id: string;
  eleve_id?: string | null;
  type: string;
  message: string;
  lu: boolean;
  role_cible?: string | null;
  created_at: string;
}

interface NotificationsStoreState {
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  loadForUser: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsStoreState>()((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  loadForUser: async (userId: string) => {
    if (!userId) {
      set({ notifications: [], isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, ecole_id, user_id, eleve_id, type, message, lu, role_cible, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const isRls =
          error.code === '42501' ||
          error.message.toLowerCase().includes('permission denied') ||
          error.message.toLowerCase().includes('policy');
        const errMsg = isRls
          ? `Accès refusé par la politique de sécurité (RLS) sur la table 'public.notifications' : ${error.message}`
          : `Erreur lors de la lecture de la table 'public.notifications' : ${error.message}`;
        console.error('[useNotificationsStore]', errMsg);
        set({ error: errMsg, notifications: [] });
        return;
      }

      set({ notifications: (data || []) as NotificationItem[], error: null });
    } catch (err: any) {
      const errMsg = `Erreur inattendue sur la table 'public.notifications' : ${err.message || err}`;
      console.error('[useNotificationsStore]', errMsg);
      set({ error: errMsg, notifications: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', id);

      if (error) {
        const isRls =
          error.code === '42501' ||
          error.message.toLowerCase().includes('permission denied') ||
          error.message.toLowerCase().includes('policy');
        const errMsg = isRls
          ? `Mise à jour refusée par la politique RLS sur la table 'public.notifications' : ${error.message}`
          : `Erreur lors de la mise à jour de la table 'public.notifications' : ${error.message}`;
        console.error('[useNotificationsStore]', errMsg);
        set({ error: errMsg });
        return;
      }

      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, lu: true } : n)),
        error: null,
      }));
    } catch (err: any) {
      const errMsg = `Erreur inattendue sur la table 'public.notifications' : ${err.message || err}`;
      console.error('[useNotificationsStore]', errMsg);
      set({ error: errMsg });
    }
  },

  markAllAsRead: async () => {
    const unreadItems = get().notifications.filter((n) => !n.lu);
    if (unreadItems.length === 0) return;
    const unreadIds = unreadItems.map((n) => n.id);

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .in('id', unreadIds);

      if (error) {
        const isRls =
          error.code === '42501' ||
          error.message.toLowerCase().includes('permission denied') ||
          error.message.toLowerCase().includes('policy');
        const errMsg = isRls
          ? `Mise à jour refusée par la politique RLS sur la table 'public.notifications' : ${error.message}`
          : `Erreur lors de la mise à jour de la table 'public.notifications' : ${error.message}`;
        console.error('[useNotificationsStore]', errMsg);
        set({ error: errMsg });
        return;
      }

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, lu: true })),
        error: null,
      }));
    } catch (err: any) {
      const errMsg = `Erreur inattendue sur la table 'public.notifications' : ${err.message || err}`;
      console.error('[useNotificationsStore]', errMsg);
      set({ error: errMsg });
    }
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.lu).length;
  },
}));
