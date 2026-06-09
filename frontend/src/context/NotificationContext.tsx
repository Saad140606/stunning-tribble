import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { auth as firebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { CivicNotification, NotificationType } from '../types/notifications';
import {
  cacheNotifications,
  createNotification,
  deleteNotification,
  getCachedNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  requestAndStoreFcmToken,
  subscribeToForegroundPush,
  subscribeToNotifications,
} from '../services/notificationService';

interface NotificationContextValue {
  notifications: CivicNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pushEnabled: boolean;
  latestEmergency: CivicNotification | null;
  enablePushNotifications: () => Promise<void>;
  notify: (input: {
    title: string;
    message: string;
    type: NotificationType;
    relatedReportId?: string | null;
  }) => Promise<void>;
  markRead: (notificationId: string, read?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    // Prefer Firebase UID for Firestore subscriptions when available
    const firebaseUid = isFirebaseConfigured ? firebaseAuth.currentUser?.uid : undefined;
    const subId = firebaseUid ?? user?.uid;
    if (!subId) {
      setNotifications([]);
      setPushEnabled(false);
      return;
    }

    const cached = getCachedNotifications(subId);
    if (cached.length) setNotifications(cached);
    setLoading(true);
    hasHydratedRef.current = false;

    const unsubscribe = subscribeToNotifications(
      subId,
      (items) => {
        setNotifications((previous) => {
          if (hasHydratedRef.current) {
            const previousIds = new Set(previous.map((item) => item.id));
            items
              .filter((item) => !previousIds.has(item.id))
              .slice(0, 3)
              .forEach((item) => {
                toast(item.title, { description: item.message });
              });
          }
          hasHydratedRef.current = true;
          return items;
        });
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.error('Notification listener failed:', snapshotError);
        setError('Notifications are temporarily unavailable.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    subscribeToForegroundPush((payload) => {
      toast(payload.title, { description: payload.body });
    }).then((fn) => {
      unsubscribe = fn;
    });
    return () => unsubscribe?.();
  }, []);

  const enablePushNotifications = useCallback(async () => {
    const firebaseUid = isFirebaseConfigured ? firebaseAuth.currentUser?.uid : undefined;
    const subId = firebaseUid ?? user?.uid;
    if (!subId) return;
    try {
      const token = await requestAndStoreFcmToken(subId);
      setPushEnabled(Boolean(token));
      if (token) toast.success('Push notifications enabled');
      else toast.error('Push permission was not granted or FCM is not configured');
    } catch (err) {
      console.error('Unable to enable push notifications:', err);
      toast.error('Unable to enable push notifications');
    }
  }, [user?.uid]);

  const notify = useCallback<NotificationContextValue['notify']>(async (input) => {
    const firebaseUid = isFirebaseConfigured ? firebaseAuth.currentUser?.uid : undefined;
    const subId = firebaseUid ?? user?.uid;
    if (!subId) return;
    await createNotification({ userId: subId, ...input });
  }, [user?.uid]);

  const markRead = useCallback(async (notificationId: string, read = true) => {
    await markNotificationRead(notificationId, read);
    setNotifications((prev) => {
      const next = prev.map((item) => (item.id === notificationId ? { ...item, read } : item));
      const firebaseUid = isFirebaseConfigured ? firebaseAuth.currentUser?.uid : undefined;
      const subId = firebaseUid ?? user?.uid;
      if (subId) cacheNotifications(subId, next);
      return next;
    });
  }, [user?.uid]);

  const markAllRead = useCallback(async () => {
    const firebaseUid = isFirebaseConfigured ? firebaseAuth.currentUser?.uid : undefined;
    const subId = firebaseUid ?? user?.uid;
    if (!subId) return;
    await markAllNotificationsRead(subId);
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      cacheNotifications(subId, next);
      return next;
    });
  }, [user?.uid]);

  const removeNotification = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId);
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== notificationId);
      const firebaseUid = isFirebaseConfigured ? firebaseAuth.currentUser?.uid : undefined;
      const subId = firebaseUid ?? user?.uid;
      if (subId) cacheNotifications(subId, next);
      return next;
    });
  }, [user?.uid]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const latestEmergency = notifications.find((item) => item.type === 'emergency_alert' && !item.read) ?? null;

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    pushEnabled,
    latestEmergency,
    enablePushNotifications,
    notify,
    markRead,
    markAllRead,
    removeNotification,
  }), [
    notifications,
    unreadCount,
    loading,
    error,
    pushEnabled,
    latestEmergency,
    enablePushNotifications,
    notify,
    markRead,
    markAllRead,
    removeNotification,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return context;
}
