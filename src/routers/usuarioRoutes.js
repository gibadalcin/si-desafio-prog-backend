import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Registra usuário (público - self registration)
router.post('/register', usuarioController.register);

// Lista de professores (usuários com role PROFESSOR) — requer autenticação
router.get('/professores', authenticate, usuarioController.listProfessores);

// Lista de turmas por professor (ADMIN ou o próprio professor)
router.get('/professores/:id/turmas', authenticate, usuarioController.getProfessorTurmas);

// Lista pública de professores com suas turmas (para frontend) - exige autenticação
router.get('/professores/turmas', authenticate, usuarioController.listProfessoresWithTurmas);

// Rotas administrativas para gerir usuários/roles - apenas ADMIN
router.get('/', authenticate, authorize(['ADMIN']), usuarioController.list);
router.get('/:id', authenticate, authorize(['ADMIN']), usuarioController.get);
router.post('/:id/roles', authenticate, authorize(['ADMIN']), usuarioController.assignRole);
router.delete('/:id/roles/:roleId', authenticate, authorize(['ADMIN']), usuarioController.removeRole);
// Atualiza usuário (self ou ADMIN)
router.put('/:id', authenticate, usuarioController.update);
// Deleta usuário (ADMIN)
router.delete('/:id', authenticate, authorize(['ADMIN']), usuarioController.remove);

export default router;
