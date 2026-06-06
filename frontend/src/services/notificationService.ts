import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { firestore, getFirebaseMessaging, isFirebaseConfigured } from '../lib/firebase';
import {
  CivicNotification,
  EmergencyAlertInput,
  NotificationDocument,
  NotificationType,
  PushMessagePayload,
} from '../types/notifications';

const NOTIFICATION_CACHE_PREFIX = 'fix-karachi-notifications:';
const MAX_BATCH_WRITES = 450;

export function toNotification(id: string, data: Partial<NotificationDocument>): CivicNotification {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
  return {
    id,
    userId: data.userId ?? '',
    title: data.title ?? 'Notification',
    message: data.message ?? '',
    type: data.type ?? 'status_updated',
    read: Boolean(data.read),
    relatedReportId: data.relatedReportId ?? null,
    createdAt,
    severity: data.severity,
    area: data.area,
    distanceKm: data.distanceKm,
  };
}

export function getCachedNotifications(userId: string): CivicNotification[] {
  try {
    const raw = localStorage.getItem(`${NOTIFICATION_CACHE_PREFIX}${userId}`);
    if (!raw) return [];
    return (JSON.parse(raw) as Array<Omit<CivicNotification, 'createdAt'> & { createdAt: string }>).map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch {
    return [];
  }
}

export function cacheNotifications(userId: string, notifications: CivicNotification[]) {
  localStorage.setItem(
    `${NOTIFICATION_CACHE_PREFIX}${userId}`,
    JSON.stringify(notifications.slice(0, 50)),
  );
}

export function subscribeToNotifications(
  userId: string,
  onNext: (notifications: CivicNotification[]) => void,
  onError?: (error: Error) => void,
) {
  if (!isFirebaseConfigured || !userId) return () => undefined;

  const notificationsQuery = query(
    collection(firestore, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((item) => toNotification(item.id, item.data() as NotificationDocument));
      cacheNotifications(userId, notifications);
      onNext(notifications);
    },
    (error) => onError?.(error),
  );
}

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedReportId?: string | null;
  severity?: CivicNotification['severity'];
  area?: string;
  distanceKm?: number;
}) {
  const docRef = await addDoc(collection(firestore, 'notifications'), {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    read: false,
    relatedReportId: input.relatedReportId ?? null,
    createdAt: serverTimestamp(),
    ...(input.severity ? { severity: input.severity } : {}),
    ...(input.area ? { area: input.area } : {}),
    ...(typeof input.distanceKm === 'number' ? { distanceKm: input.distanceKm } : {}),
  });

  await enqueuePushNotification({
    userId: input.userId,
    title: input.title,
    body: input.message,
    type: input.type,
    relatedReportId: input.relatedReportId ?? null,
  });

  return docRef.id;
}

export async function createReportStatusNotification(input: {
  userId: string;
  reportId: string;
  status: string;
}) {
  const statusCopy: Record<string, { title: string; message: string; type: NotificationType }> = {
    reported: {
      title: 'Report submitted successfully',
      message: 'Your civic issue has been received and is now visible for review.',
      type: 'report_created',
    },
    verified: {
      title: 'Your report has been verified',
      message: 'Another citizen verified your report. Authorities have a stronger signal now.',
      type: 'report_verified',
    },
    inprogress: {
      title: 'Authorities started work',
      message: 'Authorities have started working on your complaint.',
      type: 'status_updated',
    },
    resolved: {
      title: 'Your issue has been resolved',
      message: 'This report has been marked resolved. Thank you for helping improve the city.',
      type: 'resolved',
    },
    rejected: {
      title: 'Report status updated',
      message: 'Your report was reviewed and could not be accepted in its current form.',
      type: 'status_updated',
    },
    emergency: {
      title: 'Report escalated as emergency',
      message: 'Your report has been escalated for urgent attention.',
      type: 'status_updated',
    },
  };

  const copy = statusCopy[status] ?? {
    title: 'Report status updated',
    message: `Your report status changed to ${status}.`,
    type: 'status_updated' as NotificationType,
  };

  return createNotification({
    userId: input.userId,
    relatedReportId: input.reportId,
    ...copy,
  });
}

export async function markNotificationRead(notificationId: string, read = true) {
  await updateDoc(doc(firestore, 'notifications', notificationId), { read });
}

export async function markAllNotificationsRead(userId: string) {
  const unreadQuery = query(
    collection(firestore, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    limit(100),
  );
  const snapshot = await getDocs(unreadQuery);
  const batch = writeBatch(firestore);
  snapshot.docs.forEach((item) => batch.update(item.ref, { read: true }));
  await batch.commit();
}

export async function deleteNotification(notificationId: string) {
  await deleteDoc(doc(firestore, 'notifications', notificationId));
}

export async function requestAndStoreFcmToken(userId: string) {
  if (!userId || !('Notification' in window)) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const messaging = await getFirebaseMessaging();
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!messaging || !vapidKey) return null;

  let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
  if ('serviceWorker' in navigator) {
    serviceWorkerRegistration =
      (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')) ??
      (await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
      }).toString()}`));
  }

  const token = await getToken(messaging, {
    vapidKey,
    ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
  });

  if (token) {
    await setDoc(
      doc(firestore, 'users', userId),
      {
        uid: userId,
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return token;
}

export async function updateUserNotificationLocation(userId: string, location: { lat: number; lng: number }) {
  await setDoc(
    doc(firestore, 'users', userId),
    {
      uid: userId,
      lastLocation: location,
      lastLocationUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function subscribeToForegroundPush(onNext: (payload: { title: string; body: string }) => void) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => undefined;
  return onMessage(messaging, (payload) => {
    onNext({
      title: payload.notification?.title ?? 'Fix Karachi',
      body: payload.notification?.body ?? '',
    });
  });
}

export async function enqueuePushNotification(payload: PushMessagePayload) {
  await addDoc(collection(firestore, 'pushMessages'), {
    ...payload,
    status: 'queued',
    createdAt: serverTimestamp(),
  });
}

export async function broadcastEmergencyAlert(input: EmergencyAlertInput & { createdBy: string }) {
  const alertRef = await addDoc(collection(firestore, 'emergencyAlerts'), {
    ...input,
    createdAt: serverTimestamp(),
    active: true,
  });

  const usersSnapshot = await getDocs(query(collection(firestore, 'users'), limit(1000)));
  let batch = writeBatch(firestore);
  let operationCount = 0;
  let recipients = 0;

  const commitIfNeeded = async (force = false) => {
    if (operationCount >= MAX_BATCH_WRITES || (force && operationCount > 0)) {
      await batch.commit();
      batch = writeBatch(firestore);
      operationCount = 0;
    }
  };

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data() as {
      uid?: string;
      lastLocation?: { lat: number; lng: number };
      coordinates?: { lat: number; lng: number };
    };
    const userId = data.uid ?? userDoc.id;
    const userLocation = data.lastLocation ?? data.coordinates;
    if (!userId || !userLocation) continue;

    const distanceKm = haversineKm(input.center, userLocation);
    if (distanceKm > input.radiusKm) continue;

    const notificationRef = doc(collection(firestore, 'notifications'));
    batch.set(notificationRef, {
      userId,
      title: input.title,
      message: `${input.description} Reported near ${input.area}.`,
      type: 'emergency_alert',
      read: false,
      relatedReportId: alertRef.id,
      createdAt: serverTimestamp(),
      severity: input.severity,
      area: input.area,
      distanceKm: Number(distanceKm.toFixed(2)),
    });
    operationCount += 1;
    recipients += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);

  await addDoc(collection(firestore, 'adminNotifications'), {
    title: 'Emergency alert broadcast',
    message: `${input.title} sent to ${recipients} nearby users in ${input.area}.`,
    type: 'emergency_alert',
    read: false,
    createdAt: serverTimestamp(),
    severity: input.severity,
  });

  return { alertId: alertRef.id, recipients };
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
