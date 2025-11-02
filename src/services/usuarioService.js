/**
 * Service de Usuários
 * - Criação, listagem, atribuição de roles e gestão de tokens relacionados a usuários.
 * - Observação: ao atribuir role incrementa-se `token_version` e revoga-se refresh tokens.
 */
import usuarioRepository from '../repositories/usuarioRepository.js';
import rolesRepository from '../repositories/rolesRepository.js';
import db from '../config/db.js';
import turmaRepository from '../repositories/turmaRepository.js';
import { hashPassword } from '../security/passwordUtils.js';
import refreshTokensRepository from '../repositories/refreshTokensRepository.js';


const createUser = async ({ nome, email, senha, ra, siape, roles }) => {
  // senha deve estar em texto; vamos hashear
  const hashed = await hashPassword(senha);
  const user = await usuarioRepository.create({ nome, email, senha: hashed, ra, siape });

  // se funções forem informadas, reserve via usuario_roles
  if (roles && Array.isArray(roles) && roles.length) {
    for (const r of roles) {
      // r pode ser nome ou id
      let role = null;
      if (typeof r === 'string') role = await rolesRepository.findByName(r);
      else role = await rolesRepository.findById(r);
      if (role) await usuarioRepository.addRole(user.id, role.id);
    }
  }

  // retorna o usuário com funções agregadas
  return usuarioRepository.findById(user.id);
};

const listUsers = async () => {
  return usuarioRepository.listAll();
};

const listProfessores = async () => {
  // se o repositório expõe listByRole, use-o (mais eficiente)
  if (usuarioRepository && typeof usuarioRepository.listByRole === 'function') {
    return usuarioRepository.listByRole('PROFESSOR');
  }

  // fallback: consultar DB diretamente e retornar objetos simples
  try {
    const rows = await db('usuarios')
      .select('usuarios.id', 'usuarios.nome', 'usuarios.email', 'usuarios.ra', 'usuarios.siape')
      .join('usuario_roles', 'usuarios.id', 'usuario_roles.usuario_id')
      .join('roles', 'roles.id', 'usuario_roles.role_id')
      .where('roles.name', 'PROFESSOR');
    // Retornamos instâncias simplificadas (não precisamos do domínio completo aqui)
    return rows.map(r => ({ id: r.id, nome: r.nome, email: r.email, ra: r.ra, siape: r.siape }));
  } catch (e) {
    console.error('Erro ao buscar professores diretamente no DB:', e.message);
    return [];
  }
};

const listProfessoresWithTurmas = async () => {
  // retorna professores com suas turmas (público)
  const profs = await listProfessores();
  // profs pode ser instâncias ou objetos simples
  const result = [];
  for (const p of profs) {
    const pid = p.id || (p && p.toJSON && p.toJSON().id) || null;
    if (!pid) continue;
    const turmas = await turmaRepository.findByProfessorId(pid);
    result.push({ id: pid, nome: p.nome, email: p.email, turmas: turmas.map(t => t.toSafeJSON ? t.toSafeJSON() : t) });
  }
  return result;
};

const getUser = async (id) => {
  return usuarioRepository.findById(id);
};

const getTurmasByProfessorId = async (professorId) => {
  const turmas = await turmaRepository.findByProfessorId(professorId);
  return turmas.map(t => (t.toSafeJSON ? t.toSafeJSON() : t));
};

const assignRole = async (usuarioId, roleNameOrId) => {
  let role = null;
  if (typeof roleNameOrId === 'string') role = await rolesRepository.findByName(roleNameOrId);
  else role = await rolesRepository.findById(roleNameOrId);
  if (!role) return null;
  await usuarioRepository.addRole(usuarioId, role.id);
  // invalida os tokens de atualização anteriores e incrementar token_version para sinalizar a alteração.
  try {
    await usuarioRepository.incrementTokenVersion(usuarioId);
    await refreshTokensRepository.deleteByUser(usuarioId);
  } catch (e) {
    // ignora erros, mas registra
    console.error('Erro ao invalidar tokens do usuário:', e.message);
  }
  return role;
};

const removeRole = async (usuarioId, roleId) => {
  return usuarioRepository.removeRole(usuarioId, roleId);
};

// A exportação padrão será definida após a declaração das funções auxiliares (atualizar/excluir).
const updateUser = async (id, { nome, senha, ra, siape }) => {
  // atualiza campos permitidos; se senha passada, hash deve ser feito aqui
  const update = {};
  if (nome !== undefined) update.nome = nome;
  if (ra !== undefined) update.ra = ra;
  if (siape !== undefined) update.siape = siape;
  if (senha !== undefined && senha !== null && senha !== '') {
    const hashed = await hashPassword(senha);
    update.senha = hashed;
  }
  try {
    await usuarioRepository.updateById(id, update);
    return usuarioRepository.findById(id);
  } catch (e) {
    console.error('Erro ao atualizar usuário:', e.message);
    return null;
  }
};

const deleteUser = async (id) => {
  try {
    const deleted = await usuarioRepository.deleteById(id);
    return deleted > 0;
  } catch (e) {
    console.error('Erro ao deletar usuário:', e.message);
    return false;
  }
};

const usuarioServiceDefault = { createUser, listUsers, listProfessores, listProfessoresWithTurmas, getUser, getTurmasByProfessorId, assignRole, removeRole, updateUser, deleteUser };

export default usuarioServiceDefault;
export { updateUser, deleteUser };
