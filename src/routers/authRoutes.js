import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota para o login - delega para o controller/service
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// debug helper: mostra o payload do token atual
router.get('/whoami', authenticate, authController.whoami);

export default router;