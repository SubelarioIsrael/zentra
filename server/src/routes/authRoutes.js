import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequired } from '../middleware/validate.js';

const router = Router();

router.post('/register', validateRequired(['name', 'email', 'password']), register);
router.post('/login', validateRequired(['email', 'password']), login);
router.get('/me', requireAuth, me);

export default router;
