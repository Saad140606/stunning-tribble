import { Router } from 'express';
import { getUsers, updateUser, deleteUser } from '../controllers/admin.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes: user must be logged in and have admin or authority role
router.use(authenticateJWT as any);
router.use(authorizeRoles('admin', 'authority') as any);

router.get('/users', getUsers as any);
router.put('/users/:id', updateUser as any);
router.delete('/users/:id', deleteUser as any);

export default router;
