import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware';
import {
  createComplaint,
  listPublicComplaints,
  checkDuplicate,
  flagComplaint,
  upvoteComplaint,
  addComment,
  aiAnalyze,
} from '../controllers/complaints.controller';

const router = Router();

router.get('/public', listPublicComplaints);
router.get('/duplicate-check', checkDuplicate);
router.post('/ai-analyze', authenticateJWT as any, aiAnalyze as any);
router.post('/', authenticateJWT as any, rateLimiterMiddleware as any, createComplaint as any);
router.post('/:id/flag', authenticateJWT as any, flagComplaint as any);
// FIX 8: Upvote and comment routes
router.post('/:id/upvote', authenticateJWT as any, upvoteComplaint as any);
router.post('/:id/comment', authenticateJWT as any, addComment as any);

export default router;
