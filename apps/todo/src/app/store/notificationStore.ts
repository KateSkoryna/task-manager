import { create } from 'zustand';
import { generateId } from '../lib/id';

export interface AppNotification {
  id: string;
  reportId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addReportReadyNotification: (reportId: string, message: string) => void;
  markRead: (id: string) => void;
}

/**
 * Session-only (not persisted) — mirrors `authStore`/`dateStore`, which
 * don't persist either. A page refresh clears notifications same as it
 * would clear an in-memory toast queue.
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addReportReadyNotification: (reportId, message) =>
    set((state) => ({
      notifications: [
        {
          id: generateId('notification'),
          reportId,
          message,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
}));
