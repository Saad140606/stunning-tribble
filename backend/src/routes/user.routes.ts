import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateJWT as any, getProfile as any);
router.put('/profile', authenticateJWT as any, updateProfile as any);
router.delete('/account', authenticateJWT as any, deleteAccount as any);

export default router;
