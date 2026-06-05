import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  createComplaint,
  listPublicComplaints,
  checkDuplicate,
  flagComplaint,
} from '../controllers/complaints.controller';

const router = Router();

router.get('/public', listPublicComplaints);
router.get('/duplicate-check', checkDuplicate);
router.post('/', authenticateJWT as any, createComplaint as any);
router.post('/:id/flag', authenticateJWT as any, flagComplaint as any);

export default router;
