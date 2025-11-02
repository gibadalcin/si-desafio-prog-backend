/**
 * Service de Matrículas
 * - Contém a lógica transacional para matricular e remover matrículas.
 * - Uso de `db.transaction` e `forUpdate` para garantir atomicidade e evitar race conditions.
 */
import matriculaRepository from '../repositories/matriculaRepository.js';
import usuarioRepository from '../repositories/usuarioRepository.js';
import turmaRepository from '../repositories/turmaRepository.js';
import HttpError from '../utils/HttpError.js';
import db from '../config/db.js';

const enroll = async (alunoId, turmaId) => {
  // validações básicas fora da transação (usuário/roles)
  const aluno = await usuarioRepository.findById(alunoId);
  if (!aluno) {
    throw new HttpError(404, `Aluno não encontrado (id: ${alunoId})`);
  }

  // checa o papel ALUNO
  let roles = aluno.roles || [];
  if (typeof roles === 'string') {
    try { roles = JSON.parse(roles); } catch (e) { roles = [roles]; }
  }
  if (!roles.includes('ALUNO')) throw new HttpError(403, 'Usuário não é um aluno');

  // inicia a transação para checar existência, bloqueio de linha e persistência atômica
  return await db.transaction(async (trx) => {
    // checa a existência de matrícula dentro da transação para evitar corrida
    const already = await matriculaRepository.exists(alunoId, turmaId, trx);
    if (already) throw new HttpError(400, 'Aluno já matriculado nesta turma');

    // busca a turma e bloqueia a linha para update (SELECT FOR UPDATE)
    const turmaRow = await trx('turmas').where({ id: turmaId }).forUpdate().first();
    if (!turmaRow) throw new HttpError(404, 'Turma não encontrada');
    // checa conflito de horário para o aluno: se a turma tem horario_id definido,
    // não permitimos que o aluno já esteja matriculado em outra turma com o mesmo horario
    if (turmaRow.horario_id) {
      const conflitoAluno = await trx('matriculas')
        .join('turmas', 'matriculas.turma_id', 'turmas.id')
        .where({ 'matriculas.aluno_id': alunoId, 'turmas.horario_id': turmaRow.horario_id })
        .first();
      if (conflitoAluno) throw new HttpError(409, 'Conflito de horário: aluno já matriculado em turma nesse horário');
    }

    // checa as vagas
    const vagasRestantes = parseInt(turmaRow.vagas, 10) || 0;
    if (vagasRestantes <= 0) throw new HttpError(409, 'Sem vagas disponíveis');

    // decrementa a vaga e persiste
    const novasVagas = vagasRestantes - 1;
    await trx('turmas').where({ id: turmaId }).update({ vagas: novasVagas });

    // cria a matrícula dentro da mesma transação
    const matricula = await matriculaRepository.create(alunoId, turmaId, trx);
    if (!matricula) throw new HttpError(500, 'Erro ao criar matrícula');

    return matricula;
  });
};

const listByAluno = async (alunoId) => {
  return matriculaRepository.listByAluno(alunoId);
};

const remove = async (id) => {
  // Remove a matrícula e restaurar vaga da turma correspondente dentro de uma transação
  return await db.transaction(async (trx) => {
    // busca a matrícula
    const matRow = await db('matriculas').where({ id }).first().transacting(trx);
    if (!matRow) {
      // nada a remover
      return 0;
    }

    const turmaId = matRow.turma_id;

    // tenta incrementar a vaga na turma, se existir
    try {
      const turmaRow = await db('turmas').where({ id: turmaId }).first().transacting(trx);
      if (turmaRow) {
        // incrementa vagas em 1
        await db('turmas').where({ id: turmaId }).increment('vagas', 1).transacting(trx);
      }
    } catch (e) {
      // se falhar ao atualizar a turma, aborta transação
      throw new HttpError(500, 'Erro ao restaurar vaga da turma');
    }

    // remove a matrícula
    const deleted = await db('matriculas').where({ id }).del().transacting(trx);
    return deleted;
  });
};

const listAll = async () => {
  return matriculaRepository.listAll();
};

const getById = async (id) => {
  return matriculaRepository.findById(id);
};

const update = async (id, update) => {
  // update: { status }
  return matriculaRepository.updateById(id, update);
};

export default { enroll, listByAluno, remove, listAll, getById, update };
