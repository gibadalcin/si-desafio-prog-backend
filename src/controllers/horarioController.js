/**
 * Controller de Horários
 * - Manipula listagem e CRUD de horários.
 * - Validações de entrada são aplicadas via validators antes de chegar aqui.
 */
import horarioService from '../services/horarioService.js';

/**
 * @openapi
 * tags:
 *   - name: Horarios
 *     description: Operações sobre horários
 */

/**
 * @openapi
 * /api/horarios:
 *   get:
 *     tags: [Horarios]
 *     summary: Lista todos os horários
 *     responses:
 *       200:
 *         description: Lista de horários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Horario'
 */

/**
 * @openapi
 * /api/horarios:
 *   post:
 *     tags: [Horarios]
 *     summary: Cria um novo horário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HorarioCreate'
 *     responses:
 *       201:
 *         description: Horário criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Horario'
 *       400:
 *         description: Erro de validação
 *       409:
 *         description: Conflito (código de horário já existe)
 *
 */

/**
 * @openapi
 * /api/horarios/{id}:
 *   put:
 *     tags: [Horarios]
 *     summary: Atualiza um horário
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do horário
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HorarioCreate'
 *     responses:
 *       200:
 *         description: Horário atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Horario'
 *       409:
 *         description: Conflito (código de horário já existe)
 */

export const listAll = async (req, res) => {
  try {
    const items = await horarioService.listAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await horarioService.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Horario não encontrado' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const newItem = await horarioService.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const updated = await horarioService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await horarioService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default { listAll, getById, create, update, remove };

