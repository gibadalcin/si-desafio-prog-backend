import { Router } from 'express';
import * as matriculaController from '../controllers/matriculaController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Aluno pode ver suas matrículas e se matricular
router.get('/me', authenticate, authorize(['ALUNO']), matriculaController.listMine);
router.post('/', authenticate, authorize(['ALUNO']), matriculaController.enroll);
// Admin pode listar todas as matriculas
router.get('/', authenticate, authorize(['ADMIN']), matriculaController.listAll);
// Ler matrícula por id (ADMIN ou dono)
router.get('/:id', authenticate, matriculaController.getById);
// Atualizar matrícula (status) - ADMIN ou owner (controller valida)
router.put('/:id', authenticate, matriculaController.update);
// Deletar matrícula - ADMIN ou owner
router.delete('/:id', authenticate, authorize(['ADMIN','ALUNO']), matriculaController.remove);

export default router;
