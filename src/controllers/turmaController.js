/**
 * Controller de Turmas
 * - CRUD de turmas; validações mais complexas delegadas ao `turmaService`.
 * - Ponto importante: exclusão é bloqueada se houver matrículas ativas.
 */
import turmaService from '../services/turmaService.js';

/**
 * @swagger
 * tags:
 *   - name: Turmas
 *     description: CRUD de turmas
 */

/**
 * @swagger
 * /api/turmas:
 *   get:
 *     tags: [Turmas]
 *     summary: Listar turmas (público/protegido conforme regras)
 *     responses:
 *       200:
 *         description: Lista de turmas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Turma'
 */

export const listAll = async (req, res, next) => {
	try {
		const items = await turmaService.listAll();
		return res.json(items);
	} catch (err) {
		next(err);
	}
};

export const getById = async (req, res, next) => {
	try {
		const item = await turmaService.getById(req.params.id);
		if (!item) return res.status(404).json({ message: 'Turma não encontrada' });
		return res.json(item);
	} catch (err) {
		next(err);
	}
};

export const create = async (req, res) => {
	try {
		const { codigo, nome, vagas, disciplina_id, horario_id, professor_id } = req.body;
		if (!codigo || !nome) return res.status(400).json({ message: 'codigo e nome são obrigatórios' });
		const created = await turmaService.create({ codigo, nome, vagas: vagas || 0, disciplina_id, horario_id, professor_id });
		return res.status(201).json(created);
	} catch (err) {
		if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		// possível conflito de unique (codigo)
		return res.status(500).json({ message: 'Erro ao criar turma', error: err.message });
	}
};

export const update = async (req, res) => {
	try {
		const { id } = req.params;
		const { codigo, nome, vagas, disciplina_id, horario_id, professor_id } = req.body;
		const updated = await turmaService.update(id, { codigo, nome, vagas, disciplina_id, horario_id, professor_id });
		if (!updated) return res.status(404).json({ message: 'Turma não encontrada' });
		return res.json(updated);
	} catch (err) {
		if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		return res.status(500).json({ message: 'Erro ao atualizar turma', error: err.message });
	}
};

export const remove = async (req, res) => {
	try {
		const { id } = req.params;
		await turmaService.remove(id);
		return res.status(204).send();
	} catch (err) {
		return res.status(500).json({ message: 'Erro ao deletar turma', error: err.message });
	}
};

export default { listAll, getById, create, update, remove };
