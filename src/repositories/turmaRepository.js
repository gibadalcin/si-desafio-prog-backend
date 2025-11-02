/**
 * Repositório de Turmas
 * - Todas as consultas CRUD para turmas; retorna instâncias de domínio `Turma`.
 */
import db from '../config/db.js';
import { Turma } from '../domain/Turma.js';

const listAll = async () => {
  try {
    const rows = await db('turmas').select('*');
    return rows.map(r => new Turma(r));
  } catch (err) {
    return [];
  }
};

const findById = async (id) => {
  try {
    const row = await db('turmas').where({ id }).first();
    return row ? new Turma(row) : null;
  } catch (err) {
    return null;
  }
};

const findByCodigo = async (codigo) => {
  try {
    const row = await db('turmas').where({ codigo }).first();
    return row ? new Turma(row) : null;
  } catch (err) {
    return null;
  }
};

const countByDisciplina = async (disciplinaId) => {
  try {
    const [{ count }] = await db('turmas').where({ disciplina_id: disciplinaId }).count('id as count');
    return parseInt(count, 10);
  } catch (e) { return 0; }
};

const countByHorario = async (horarioId) => {
  try {
    const [{ count }] = await db('turmas').where({ horario_id: horarioId }).count('id as count');
    return parseInt(count, 10);
  } catch (e) { return 0; }
};

const create = async (payload) => {
  try {
    const [id] = await db('turmas').insert(payload);
    return findById(id);
  } catch (err) {
    throw err;
  }
};

const update = async (id, payload) => {
  try {
    await db('turmas').where({ id }).update(payload);
    return findById(id);
  } catch (err) {
    throw err;
  }
};

const remove = async (id) => {
  try {
    return await db('turmas').where({ id }).del();
  } catch (err) {
    throw err;
  }
};

const findByProfessorId = async (professorId) => {
  try {
    const rows = await db('turmas').where({ professor_id: professorId }).select('*');
    return rows.map(r => new Turma(r));
  } catch (err) {
    return [];
  }
};

export default { listAll, findById, create, update, remove, findByCodigo, countByDisciplina, countByHorario, findByProfessorId };
