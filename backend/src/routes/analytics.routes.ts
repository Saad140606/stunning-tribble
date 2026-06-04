import { Router } from 'express';
import { getHeatmap, getHotspots } from '../controllers/analytics.controller';

const router = Router();

// GET /api/analytics/heatmap
router.get('/heatmap', getHeatmap);

// GET /api/analytics/hotspots
router.get('/hotspots', getHotspots);

export default router;
