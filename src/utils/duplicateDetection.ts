import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../lib/firebase';

export interface DuplicateCandidate {
  id: string;
  category: string;
  distanceMeters: number;
  hoursAgo: number;
}

interface NewReportLocation {
  category: string;
  lat: number;
  lng: number;
}

export interface LocalDuplicateCandidate {
  id: string;
  distanceMeters: number;
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earth = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function findLocalDuplicate(
  reports: Array<{ id: string; type: string; status: string; coordinates?: { lat: number; lng: number } }>,
  report: { type: string; coordinates: { lat: number; lng: number } },
  maxDistanceMeters = 50
): LocalDuplicateCandidate | null {
  for (const candidate of reports) {
    if (candidate.status === 'resolved' || candidate.type !== report.type) continue;
    if (!candidate.coordinates) continue;
    const distance = distanceMeters(report.coordinates, candidate.coordinates);
    if (distance <= maxDistanceMeters) {
      return {
        id: candidate.id,
        distanceMeters: Math.round(distance),
      };
    }
  }

  return null;
}

export async function findPotentialDuplicate(report: NewReportLocation): Promise<DuplicateCandidate | null> {
  if (!isFirebaseConfigured) return null;

  const since = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const q = query(
    collection(firestore, 'reports'),
    where('category', '==', report.category),
    where('createdAt', '>=', since),
    where('status', '!=', 'resolved'),
  );
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const lat = data.lat ?? data.coordinates?.lat;
    const lng = data.lng ?? data.coordinates?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const distance = distanceMeters(report, { lat, lng });
    if (distance <= 100) {
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
      return {
        id: docSnap.id,
        category: data.category,
        distanceMeters: Math.round(distance),
        hoursAgo: Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 3600000)),
      };
    }
  }

  return null;
}

