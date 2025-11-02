/**
 * Repositório de Matrículas
 * - Encapsula consultas de matrícula e conversão para a entidade `Matricula`.
 */
import db from '../config/db.js';
import { Matricula } from '../domain/Matricula.js';

const listByAluno = async (alunoId) => {
  try {
    const rows = await db('matriculas').where({ aluno_id: alunoId }).select('*');
    return rows.map(r => new Matricula(r));
  } catch (err) {
    return [];
  }
};

const countByTurma = async (turmaId, trx) => {
  try {
    const q = (trx || db)('matriculas').where({ turma_id: turmaId }).count('id as count');
    const [{ count }] = await q;
    return parseInt(count, 10);
  } catch (err) { return 0; }
};

const exists = async (alunoId, turmaId, trx) => {
  try {
    const row = await (trx || db)('matriculas').where({ aluno_id: alunoId, turma_id: turmaId }).first();
    return !!row;
  } catch (err) { return false; }
};

const create = async (alunoId, turmaId, trx) => {
  try {
    const executor = trx || db;
    const [id] = await executor('matriculas').insert({ aluno_id: alunoId, turma_id: turmaId });
    const row = await executor('matriculas').where({ id }).first();
    return row ? new Matricula(row) : null;
  } catch (err) { throw err; }
};

const remove = async (id) => {
  try {
    return await db('matriculas').where({ id }).del();
  } catch (err) { throw err; }
};

const findById = async (id) => {
  try {
    const row = await db('matriculas').where({ id }).first();
    return row ? new Matricula(row) : null;
  } catch (err) { return null; }
};

const listAll = async () => {
  try {
    const rows = await db('matriculas').select('*');
    return rows.map(r => new Matricula(r));
  } catch (err) { return []; }
};

const updateById = async (id, update) => {
  try {
    await db('matriculas').where({ id }).update(update);
    return await findById(id);
  } catch (err) { throw err; }
};

export default { listByAluno, countByTurma, exists, create, remove, findById, listAll, updateById };
