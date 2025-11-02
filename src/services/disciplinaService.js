/**
 * Service de Disciplinas
 * - Encapsula regras de unicidade e integridade antes de delegar ao repositório.
 */
import disciplinaRepository from '../repositories/disciplinaRepository.js';
import turmaRepository from '../repositories/turmaRepository.js';
import HttpError from '../utils/HttpError.js';

const listAll = async () => {
  return disciplinaRepository.listAll();
};

const getById = async (id) => {
  return disciplinaRepository.findById(id);
};

const create = async (payload) => {
  // garante código único
  const exists = await disciplinaRepository.findByCodigo(payload.codigo);
  if (exists) throw new HttpError(409, 'Código de disciplina já existe');
  return disciplinaRepository.create(payload);
};

const update = async (id, payload) => {
  // se código mudar, verificar unicidade
  if (payload.codigo) {
    const existing = await disciplinaRepository.findByCodigo(payload.codigo);
    if (existing && existing.id !== Number(id)) throw new HttpError(409, 'Código de disciplina já existe');
  }
  return disciplinaRepository.update(id, payload);
};

const remove = async (id) => {
  // não permite exclusão de disciplina se houver turmas vinculadas
  const count = await turmaRepository.countByDisciplina(id);
  if (count > 0) throw new HttpError(409, 'Não é possível excluir disciplina com turmas vinculadas');
  return disciplinaRepository.remove(id);
};

export default { listAll, getById, create, update, remove };
