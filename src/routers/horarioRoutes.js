import { Router } from 'express';
import * as horarioController from '../controllers/horarioController.js';
import validationMiddleware from '../middlewares/validationMiddleware.js';
import { horarioCreateSchema, horarioUpdateSchema } from '../validators/horariosValidator.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', horarioController.listAll);
router.get('/:id', horarioController.getById);
// operações que alteram estado exigem autenticação + papel ADMIN
router.post('/', authenticate, authorize(['ADMIN']), horarioCreateSchema, validationMiddleware, horarioController.create);
router.put('/:id', authenticate, authorize(['ADMIN']), horarioUpdateSchema, validationMiddleware, horarioController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), horarioController.remove);

export default router;
