import { db } from '../config/db';
import { prisma } from '../config/prismaClient';
import { Complaint } from '@prisma/client';
import logger from '../config/logger';

/**
 * Weight mapping for categories (as per requirements)
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  POTHOLE: 1,
  GARBAGE: 2,
  STREETLIGHT: 2,
  WATER_LEAKAGE: 3,
  EMERGENCY: 5,
};

/**
 * Calculate the haversine distance between two lat/lng points in meters.
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Retrieve complaints from DB (PostgreSQL via Prisma or fallback JSON) and apply filters.
 */
async function fetchComplaints(filters: any): Promise<Complaint[]> {
  // Use Prisma if connected to PostgreSQL, otherwise fallback to db simulation (JSON)
  if ((db as any).isPg) {
    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = new Date(filters.startDate);
      if (filters.endDate) where.created_at.lte = new Date(filters.endDate);
    }
    return prisma.complaint.findMany({ where });
  } else {
    // JSON fallback – simulate simple filter logic
    const result = await db.query('SELECT * FROM complaints', []);
    // result.rows is the simulated JSON data
    return result.rows as Complaint[];
  }
}

/**
 * Compute heatmap points with aggregated weight for each complaint.
 * We aggregate by rounding lat/lng to a grid of ~500m (approx 0.0045°).
 */
export async function getHeatmapPoints(filters: any = {}): Promise<any[]> {
  try {
    const complaints = await fetchComplaints(filters);
    const gridSize = 0.0045; // roughly 500m at equator
    const map = new Map<string, { latitude: number; longitude: number; weight: number; count: number }>();
    for (const c of complaints) {
      const weight = CATEGORY_WEIGHTS[c.category as string] || 1;
      const gridLat = Math.round(c.latitude / gridSize) * gridSize;
      const gridLon = Math.round(c.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLon}`;
      if (!map.has(key)) {
        map.set(key, { latitude: gridLat, longitude: gridLon, weight, count: 1 });
      } else {
        const entry = map.get(key)!;
        entry.weight += weight;
        entry.count += 1;
      }
    }
    return Array.from(map.values()).map((e) => ({
      latitude: e.latitude,
      longitude: e.longitude,
      weight: e.weight,
      count: e.count,
    }));
  } catch (err) {
    logger.error('Heatmap service error', err);
    throw err;
  }
}
