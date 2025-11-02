import { Router } from 'express';
import * as disciplinaController from '../controllers/disciplinaController.js';
import validationMiddleware from '../middlewares/validationMiddleware.js';
import { disciplinaCreateSchema, disciplinaUpdateSchema } from '../validators/disciplinasValidator.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', disciplinaController.listAll);
router.get('/:id', disciplinaController.getById);
// operações que alteram estado exigem autenticação + papel ADMIN
router.post('/', authenticate, authorize(['ADMIN']), disciplinaCreateSchema, validationMiddleware, disciplinaController.create);
router.put('/:id', authenticate, authorize(['ADMIN']), disciplinaUpdateSchema, validationMiddleware, disciplinaController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), disciplinaController.remove);

export default router;
