/**
 * Controller de Disciplinas
 * - Exposição dos endpoints públicos e administrativos para disciplinas.
 * - Regras de unicidade e validações ficam nos serviços/repos.
 */
import disciplinaService from '../services/disciplinaService.js';

/**
 * @openapi
 * tags:
 *   - name: Disciplinas
 *     description: Operações sobre disciplinas
 */

/**
 * @openapi
 * /api/disciplinas:
 *   get:
 *     tags: [Disciplinas]
 *     summary: Lista todas as disciplinas
 *     responses:
 *       200:
 *         description: Lista de disciplinas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Disciplina'
 */

export const listAll = async (req, res) => {
	try {
		const items = await disciplinaService.listAll();
		res.json(items);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const getById = async (req, res) => {
	try {
		const item = await disciplinaService.getById(req.params.id);
		if (!item) return res.status(404).json({ message: 'Disciplina não encontrada' });
		res.json(item);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const create = async (req, res) => {
	try {
		const newItem = await disciplinaService.create(req.body);
		res.status(201).json(newItem);
	} catch (err) {
		if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		res.status(400).json({ message: err.message });
	}
};

export const update = async (req, res) => {
	try {
		const updated = await disciplinaService.update(req.params.id, req.body);
		res.json(updated);
	} catch (err) {
		if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
		res.status(400).json({ message: err.message });
	}
};

export const remove = async (req, res) => {
	try {
		await disciplinaService.remove(req.params.id);
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export default { listAll, getById, create, update, remove };

/**
 * @openapi
 * /api/disciplinas:
 *   post:
 *     tags: [Disciplinas]
 *     summary: Cria uma nova disciplina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisciplinaCreate'
 *     responses:
 *       201:
 *         description: Disciplina criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Disciplina'
 *       400:
 *         description: Erro de validação
 *       409:
 *         description: Conflito (código de disciplina já existe)
 */

/**
 * @openapi
 * /api/disciplinas/{id}:
 *   put:
 *     tags: [Disciplinas]
 *     summary: Atualiza uma disciplina
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da disciplina
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisciplinaCreate'
 *     responses:
 *       200:
 *         description: Disciplina atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Disciplina'
 *       409:
 *         description: Conflito (código de disciplina já existe)
 */

