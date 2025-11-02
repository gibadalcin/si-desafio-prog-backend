/**
 * Service de Horários
 * - Valida existência/uniquidade de horários e impede exclusão se em uso.
 */
import horarioRepository from '../repositories/horarioRepository.js';
import turmaRepository from '../repositories/turmaRepository.js';
import HttpError from '../utils/HttpError.js';

const listAll = async () => {
  return horarioRepository.listAll();
};

const getById = async (id) => {
  return horarioRepository.findById(id);
};

const create = async (payload) => {
  const exists = await horarioRepository.findByCodigo(payload.codigo);
  if (exists) throw new HttpError(409, 'Código de horário já existe');
  return horarioRepository.create(payload);
};

const update = async (id, payload) => {
  if (payload.codigo) {
    const existing = await horarioRepository.findByCodigo(payload.codigo);
    if (existing && existing.id !== Number(id)) throw new HttpError(409, 'Código de horário já existe');
  }
  return horarioRepository.update(id, payload);
};

const remove = async (id) => {
  // não permite exclusão de horário se houver turmas usando este horário
  const count = await turmaRepository.countByHorario(id);
  if (count > 0) throw new HttpError(409, 'Não é possível excluir horário em uso por turmas');
  return horarioRepository.remove(id);
};

export default { listAll, getById, create, update, remove };
