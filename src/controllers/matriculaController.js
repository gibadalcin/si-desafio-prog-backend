/**
 * Controller de Matrículas
 * - Endpoints para matricular, listar, remover e atualizar matrículas.
 * - Observação crítica: operações de matrícula usam fluxo transacional no service
 *   (ver `matriculaService.enroll`) para evitar oversubscription e conflitos de horário.
 */
import matriculaService from '../services/matriculaService.js';

/**
 * @swagger
 * tags:
 *   - name: Matriculas
 *     description: Gerenciamento de matrículas (alunos)
 */

/**
 * @swagger
 * /api/matriculas:
 *   post:
 *     tags: [Matriculas]
 *     summary: Matricular aluno em uma turma (requer autenticação como ALUNO)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MatriculaCreate'
 *     responses:
 *       201:
 *         description: Matrícula criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Matricula'
 */

export const enroll = async (req, res) => {
  try {
    const alunoId = req.user && req.user.id;
    const { turmaId } = req.body;
    if (!turmaId) return res.status(400).json({ message: 'turmaId é obrigatório' });
    const m = await matriculaService.enroll(alunoId, turmaId);
    return res.status(201).json(m);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const listMine = async (req, res) => {
  try {
    const alunoId = req.user && req.user.id;
    const list = await matriculaService.listByAluno(alunoId);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await matriculaService.remove(id);
    // "deleted" é o número de linhas removidas (0 ou 1).
    if (!deleted) return res.status(404).json({ message: 'Matrícula não encontrada' });
    // Retorna 204 Sem conteúdo explicitamente sem corpo
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export default { enroll, listMine, remove };

export const listAll = async (req, res) => {
  try {
    const list = await matriculaService.listAll();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const m = await matriculaService.getById(id);
    if (!m) return res.status(404).json({ message: 'Matrícula não encontrada' });
    // Se não for ADMIN, só permite ver se for dono
    const requester = req.user;
    if (!(requester && (requester.roles && requester.roles.includes('ADMIN')))) {
      if (!requester || requester.id !== m.aluno_id) return res.status(403).json({ message: 'Acesso negado' });
    }
    return res.json(m);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateBody = req.body;
    // permissões: ADMIN pode atualizar qualquer; ALUNO pode cancelar sua própria
    const requester = req.user;
    const existing = await matriculaService.getById(id);
    if (!existing) return res.status(404).json({ message: 'Matrícula não encontrada' });
    if (requester.roles && requester.roles.includes('ADMIN')) {
      const updated = await matriculaService.update(id, updateBody);
      return res.json(updated);
    }
    // Se for aluno, só permite alteração se for dono
    if (requester.id !== existing.aluno_id) return res.status(403).json({ message: 'Acesso negado' });
    const allowed = {};
    if (updateBody.status) allowed.status = updateBody.status;
    const updated = await matriculaService.update(id, allowed);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
