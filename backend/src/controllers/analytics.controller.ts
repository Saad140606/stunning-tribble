import { Request, Response, NextFunction } from 'express';
import * as heatmapService from '../services/heatmap.service';
import * as hotspotService from '../services/hotspot.service';

/**
 * GET /heatmap
 * Returns aggregated heatmap points. Accepts optional query parameters for filtering.
 */
export const getHeatmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const points = await heatmapService.getHeatmapPoints(filters);
    res.json({ data: points });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /hotspots
 * Returns hotspot clusters based on distance‑based radius (500 m).
 */
export const getHotspots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const hotspots = await hotspotService.getHotspots(filters);
    res.json({ data: hotspots });
  } catch (err) {
    next(err);
  }
};
