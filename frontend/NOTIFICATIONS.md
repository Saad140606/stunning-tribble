# Real-Time Notifications Schema and FCM Setup

## Firestore collections

`notifications/{id}`

```ts
{
  userId: string;
  title: string;
  message: string;
  type:
    | 'report_created'
    | 'report_verified'
    | 'report_upvoted'
    | 'status_updated'
    | 'resolved'
    | 'admin_message'
    | 'emergency_alert';
  read: boolean;
  relatedReportId?: string | null;
  createdAt: Timestamp;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  area?: string;
  distanceKm?: number;
}
```

`users/{uid}`

```ts
{
  uid: string;
  fcmToken?: string;
  fcmTokenUpdatedAt?: Timestamp;
  lastLocation?: { lat: number; lng: number };
  lastLocationUpdatedAt?: Timestamp;
  role?: 'citizen' | 'admin' | 'authority';
}
```

`emergencyAlerts/{id}` stores admin broadcasts with `title`, `description`, `severity`, `area`, `center`, `radiusKm`, `active`, `createdBy`, and `createdAt`.

`pushMessages/{id}` is a secure queue for a Firebase Admin SDK worker or Cloud Function to send FCM messages. Client code writes small payloads only; server code should read the target `users/{uid}.fcmToken`, call FCM, then mark the queue item `sent` or `failed`.

## FCM setup

Add these Vite env values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

The browser service worker is `public/firebase-messaging-sw.js`. It receives Firebase config through the registration URL, so project config is not hardcoded in the public file.

## Query indexes

Create composite indexes when Firestore prompts for:

- `notifications`: `userId ASC`, `createdAt DESC`
- `notifications`: `userId ASC`, `read ASC`
- `adminNotifications`: `createdAt DESC`

## Low-bandwidth behavior

The app listens to the latest 50 user notifications, caches them in `localStorage`, keeps notification payloads text-only, paginates history client-side, and only stores FCM tokens plus the user's latest location needed for radius targeting.

## Implementation notes

- I added a Firestore indexes file at `frontend/firestore.indexes.json` with the composite indexes referenced above. Deploy with the Firebase CLI using `firebase deploy --only firestore:indexes` (run from the `frontend` folder).
- I created a simple component export index at `frontend/src/components/notifications/index.ts` to make imports easier: `import { NotificationBell } from 'src/components/notifications'`.
- Ensure the Vite env vars in this document are set in your environment for FCM to work, and run the app to register the service worker at `/firebase-messaging-sw.js`.
