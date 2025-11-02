/**
 * Service de Turmas
 * - Regras de negócio para criação/atualização/exclusão de turmas.
 * - Verifica conflitos de horário para professores e integridade referencial.
 */
import turmaRepository from '../repositories/turmaRepository.js';
import matriculaRepository from '../repositories/matriculaRepository.js';
import disciplinaRepository from '../repositories/disciplinaRepository.js';
import horarioRepository from '../repositories/horarioRepository.js';
import usuarioRepository from '../repositories/usuarioRepository.js';
import HttpError from '../utils/HttpError.js';

const listAll = async () => {
  return turmaRepository.listAll();
};

const getById = async (id) => {
  return turmaRepository.findById(id);
};

const create = async (payload) => {
  // Valida as entidades relacionadas, se fornecidas.
  if (payload.disciplina_id) {
    const d = await disciplinaRepository.findById(payload.disciplina_id);
    if (!d) throw new HttpError(404, 'Disciplina não encontrada');
  }
  if (payload.horario_id) {
    const h = await horarioRepository.findById(payload.horario_id);
    if (!h) throw new HttpError(404, 'Horario não encontrado');
  }
  // valida professor_id se fornecido
  if (payload.professor_id) {
    const professor = await usuarioRepository.findById(payload.professor_id);
    if (!professor) throw new HttpError(404, 'Professor não encontrado');
    const roles = professor.roles || (professor.getRoles ? await professor.getRoles() : []);
    // roles pode ser array de nomes
    if (!Array.isArray(roles) || !roles.includes('PROFESSOR')) {
      throw new HttpError(400, 'Usuário informado não é um professor');
    }
  }
  // verifica codigo exclusivo
  if (payload.codigo) {
    const existing = await turmaRepository.findByCodigo(payload.codigo);
    if (existing) throw new HttpError(409, 'Código de turma já existe');
  }
  // checa conflito de horário: professor não pode ter outra turma no mesmo horario
  if (payload.professor_id && payload.horario_id) {
    const turmasDoProf = await turmaRepository.findByProfessorId(payload.professor_id);
    const conflito = turmasDoProf.find(t => t.horario_id && Number(t.horario_id) === Number(payload.horario_id));
    if (conflito) throw new HttpError(409, 'Conflito de horário: professor já possui turma nesse horário');
  }
  return turmaRepository.create(payload);
};

const update = async (id, payload) => {
  const existingTurma = await turmaRepository.findById(id);
  if (!existingTurma) throw new HttpError(404, 'Turma não encontrada');

  if (payload.disciplina_id) {
    const d = await disciplinaRepository.findById(payload.disciplina_id);
    if (!d) throw new HttpError(404, 'Disciplina não encontrada');
  }
  if (payload.horario_id) {
    const h = await horarioRepository.findById(payload.horario_id);
    if (!h) throw new HttpError(404, 'Horario não encontrado');
  }
  if (payload.codigo) {
    const existing = await turmaRepository.findByCodigo(payload.codigo);
    if (existing && existing.id !== Number(id)) throw new HttpError(409, 'Código de turma já existe');
  }

  // valida professor_id se estiver sendo alterado
  const newProfessorId = payload.professor_id !== undefined ? payload.professor_id : existingTurma.professor_id;
  const newHorarioId = payload.horario_id !== undefined ? payload.horario_id : existingTurma.horario_id;
  if (payload.professor_id) {
    const professor = await usuarioRepository.findById(payload.professor_id);
    if (!professor) throw new HttpError(404, 'Professor não encontrado');
    const roles = professor.roles || (professor.getRoles ? await professor.getRoles() : []);
    if (!Array.isArray(roles) || !roles.includes('PROFESSOR')) {
      throw new HttpError(400, 'Usuário informado não é um professor');
    }
  }

  // checa conflito de horário: se professor e horario estão definidos, não pode haver outra turma com mesmo horario
  if (newProfessorId && newHorarioId) {
    const turmasDoProf = await turmaRepository.findByProfessorId(newProfessorId);
    const conflito = turmasDoProf.find(t => t.id !== Number(id) && t.horario_id && Number(t.horario_id) === Number(newHorarioId));
    if (conflito) throw new HttpError(409, 'Conflito de horário: professor já possui outra turma nesse horário');
  }

  return turmaRepository.update(id, payload);
};

const remove = async (id) => {
  // não permite exclusão se houver matrículas ativas
  const count = await matriculaRepository.countByTurma(id);
  if (count > 0) throw new HttpError(409, 'Não é possível excluir turma com matrículas ativas');
  return turmaRepository.remove(id);
};

export default { listAll, getById, create, update, remove };
