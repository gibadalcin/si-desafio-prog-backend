import { Router } from 'express';
import * as turmaController from '../controllers/turmaController.js';
import { authenticate, authorize, authorizeOrTurmaOwner } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.get('/', authenticate, turmaController.listAll);
router.get('/:id', authenticate, turmaController.getById);

// Operações de escrita exigem papel ADMIN
router.post('/', authenticate, authorize(['ADMIN']), turmaController.create);
router.put('/:id', authenticate, authorizeOrTurmaOwner, turmaController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), turmaController.remove);

export default router;
