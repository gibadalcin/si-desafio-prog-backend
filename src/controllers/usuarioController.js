/**
 * Controller de Usuários
 * - Gerencia registro, listagem e atribuição de roles.
 * - Rota pública: POST /api/usuarios/register (self-registration).
 * - Ponto importante: operações administrativas exigem checagem de roles (ADMIN).
 */
import usuarioService from '../services/usuarioService.js';

/**
 * @swagger
 * tags:
 *   - name: Usuarios
 *     description: Gerenciamento de usuários e papéis
 */

/**
 * @swagger
 * /api/usuarios/register:
 *   post:
 *     tags: [Usuarios]
 *     summary: Registrar novo usuário (self-registration)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreate'
 *     responses:
 *       201:
 *         description: Usuário criado
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuários (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */

/**
 * @swagger
 * /api/usuarios/professores:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuários com role PROFESSOR (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de professores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */

/**
 * @swagger
 * /api/usuarios/professores/turmas:
 *   get:
 *     tags: [Usuarios]
 *     summary: Lista professores com suas turmas (requer autenticação)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de professores com turmas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   email:
 *                     type: string
 *                   turmas:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Turma'
 */

/**
 * @swagger
 * /api/usuarios/{id}/roles:
 *   post:
 *     tags: [Usuarios]
 *     summary: Atribuir role a um usuário (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleAssign'
 *     responses:
 *       200:
 *         description: Role atribuída
 */

export const register = async (req, res, next) => {
  try {
    const { nome, email, senha, ra, siape, roles } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ message: 'nome, email e senha são obrigatórios' });
    const user = await usuarioService.createUser({ nome, email, senha, ra, siape, roles });
    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const users = await usuarioService.listUsers();
    return res.json(users);
  } catch (err) {
    next(err);
  }
};

export const listProfessores = async (req, res, next) => {
  try {
    const professores = await usuarioService.listProfessores();
    return res.json(professores);
  } catch (err) {
    next(err);
  }
};

export const listProfessoresWithTurmas = async (req, res, next) => {
  try {
    const data = await usuarioService.listProfessoresWithTurmas();
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/usuarios/{id}/turmas:
 *   get:
 *     tags: [Usuarios]
 *     summary: Lista as turmas atribuídas a um professor (ADMIN ou o próprio professor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do professor
 *     responses:
 *       200:
 *         description: Lista de turmas do professor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 professor_id:
 *                   type: integer
 *                 turmas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Turma'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Permissão insuficiente
 */
export const getProfessorTurmas = async (req, res, next) => {
  try {
    const requester = req.user;
    const id = parseInt(req.params.id, 10);
    if (!requester) return res.status(401).json({ message: 'Não autenticado' });
    // permite ADMIN ou o próprio professor
    if (!(requester.roles && requester.roles.includes('ADMIN')) && Number(requester.id) !== Number(id)) {
      return res.status(403).json({ message: 'Permissão insuficiente' });
    }

    const turmas = await usuarioService.getTurmasByProfessorId(id);
    return res.json({ professor_id: id, turmas });
  } catch (err) {
    next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await usuarioService.getUser(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const assignRole = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body; // role: nome ou id
    if (!role) return res.status(400).json({ message: 'role é obrigatório' });
    const assigned = await usuarioService.assignRole(id, role);
    if (!assigned) return res.status(404).json({ message: 'Role não encontrada' });
    return res.json({ message: 'Role atribuída', role: assigned });
  } catch (err) {
    next(err);
  }
};

export const removeRole = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const roleId = parseInt(req.params.roleId, 10);
    const ok = await usuarioService.removeRole(id, roleId);
    if (!ok) return res.status(404).json({ message: 'Associação não encontrada' });
    return res.json({ message: 'Role removida' });
  } catch (err) {
    next(err);
  }
};

export default { register, list, get, assignRole, removeRole };

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const requester = req.user;
    // Permite self-update ou ADMIN
    if (!requester) return res.status(401).json({ message: 'Não autenticado' });
    if (requester.id !== id && !(requester.roles && requester.roles.includes('ADMIN'))) {
      return res.status(403).json({ message: 'Permissão insuficiente' });
    }

    const { nome, senha, ra, siape } = req.body;
    const updated = await usuarioService.updateUser(id, { nome, senha, ra, siape });
    if (!updated) return res.status(404).json({ message: 'Usuário não encontrado' });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    // Apenas ADMIN pode deletar (rota já protegida), mas checamos por segurança
    const ok = await usuarioService.deleteUser(id);
    if (!ok) return res.status(404).json({ message: 'Usuário não encontrado' });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

