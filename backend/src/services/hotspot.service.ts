import { prisma } from '../config/prismaClient';
import { Complaint } from '@prisma/client';
import logger from '../config/logger';
import { haversine } from './heatmap.service'; // reuse distance function

/**
 * Determine cluster centers using a simple grid approach (500m) and compute hotspot scores.
 * Score is sum of weighted complaint severity within the radius.
 */
export async function getHotspots(filters: any = {}): Promise<any[]> {
  try {
    // Reuse heatmap fetch for simplicity
    const complaints = await prisma.complaint.findMany({
      where: filters,
    });

    const radius = 500; // meters
    const visited: Set<number> = new Set();
    const hotspots: any[] = [];

    for (let i = 0; i < complaints.length; i++) {
      if (visited.has(i)) continue;
      const base = complaints[i];
      let score = 0;
      const cluster: Complaint[] = [];
      for (let j = 0; j < complaints.length; j++) {
        if (visited.has(j)) continue;
        const cand = complaints[j];
        const dist = haversine(base.latitude, base.longitude, cand.latitude, cand.longitude);
        if (dist <= radius) {
          visited.add(j);
          cluster.push(cand);
          // Simple weighting: severity (1-5) * category weight if needed
          score += cand.severity;
        }
      }
      if (cluster.length > 0) {
        hotspots.push({
          latitude: base.latitude,
          longitude: base.longitude,
          score,
          count: cluster.length,
        });
      }
    }
    // Sort descending by score
    hotspots.sort((a, b) => b.score - a.score);
    return hotspots;
  } catch (err) {
    logger.error('Hotspot service error', err);
    throw err;
  }
}
