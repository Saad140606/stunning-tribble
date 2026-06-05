import { apiFetch } from '../services/api';

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
  try {
    const params = new URLSearchParams({
      category: report.category,
      lat: String(report.lat),
      lng: String(report.lng),
    });
    const response = await apiFetch(`/complaints/duplicate-check?${params.toString()}`, {
      skipAuth: true,
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.duplicate ?? null;
  } catch (err) {
    console.error('Duplicate check failed:', err);
    return null;
  }
}

