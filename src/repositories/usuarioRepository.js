/**
 * Repositório de Usuários
 * - Encapsula consultas ao banco para usuários e agrega roles quando possível.
 * - Atenção: `findByEmail` e `findById` agregam roles via `usuario_roles` para popular o payload do token.
 */
import db from '../config/db.js';
import { Usuario } from '../domain/Usuario.js';

const findByEmail = async (email) => {
  try {
    if (db && typeof db === 'function') {
      const row = await db('usuarios').where({ email }).first();
      if (row) {
        if (row.roles && typeof row.roles === 'string') {
          try { row.roles = JSON.parse(row.roles); } catch (e) { /* keep as string */ }
        }
        // agrega roles normalizadas quando disponível
        try {
          const roles = await db('roles')
            .select('roles.id', 'roles.name')
            .join('usuario_roles', 'roles.id', 'usuario_roles.role_id')
            .join('usuarios', 'usuarios.id', 'usuario_roles.usuario_id')
            .where('usuarios.email', email);
          if (roles && roles.length) row.roles = roles.map(r => r.name);
        } catch (e) {
          // ignore se tabelas não existirem
        }
  return new Usuario(row);
      }
    }
  } catch (err) {
    // se não há tabela, retorna null e deixa fallback acontecer
    // console.warn('DB query failed in usuarioRepository.findByEmail:', err.message);
  }

  return null;
};

const findById = async (id) => {
  try {
    if (db && typeof db === 'function') {
      const row = await db('usuarios').where({ id }).first();
      if (row) {
        if (row.roles && typeof row.roles === 'string') {
          try { row.roles = JSON.parse(row.roles); } catch (e) { }
        }
        // também agregamos roles normalizadas via tabela usuario_roles/roles quando disponível
        try {
          const roles = await db('roles')
            .select('roles.id', 'roles.name')
            .join('usuario_roles', 'roles.id', 'usuario_roles.role_id')
            .where('usuario_roles.usuario_id', id);
          if (roles && roles.length) row.roles = roles.map(r => r.name);
        } catch (e) {
          // ignore: se tabela não existe, mantemos o valor anterior
        }
  return new Usuario(row);
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
};

const create = async (user) => {
  // user: { nome, email, senha, ra, siape }
  const insert = {
    nome: user.nome,
    email: user.email,
    senha: user.senha,
    ra: user.ra || null,
    siape: user.siape || null,
  };
  const [id] = await db('usuarios').insert(insert);
  return findById(id);
};

const listAll = async () => {
  const rows = await db('usuarios').select('id', 'nome', 'email', 'ra', 'siape');
  return rows.map(r => new Usuario(r));
};

const listByRole = async (roleName) => {
  const rows = await db('usuarios')
    .select('usuarios.id', 'usuarios.nome', 'usuarios.email', 'usuarios.ra', 'usuarios.siape')
    .join('usuario_roles', 'usuarios.id', 'usuario_roles.usuario_id')
    .join('roles', 'roles.id', 'usuario_roles.role_id')
    .where('roles.name', roleName);
  return rows.map(r => new Usuario(r));
};

const getRoles = async (usuarioId) => {
  const roles = await db('roles')
    .select('roles.id', 'roles.name')
    .join('usuario_roles', 'roles.id', 'usuario_roles.role_id')
    .where('usuario_roles.usuario_id', usuarioId);
  return roles.map(r => ({ id: r.id, name: r.name }));
};

const addRole = async (usuarioId, roleId) => {
  try {
    await db('usuario_roles').insert({ usuario_id: usuarioId, role_id: roleId });
    return true;
  } catch (e) {
    // se já existir, ignore
    return false;
  }
};

const removeRole = async (usuarioId, roleId) => {
  const deleted = await db('usuario_roles').where({ usuario_id: usuarioId, role_id: roleId }).del();
  return deleted > 0;
};

const incrementTokenVersion = async (usuarioId) => {
  await db('usuarios').where({ id: usuarioId }).increment('token_version', 1);
  return true;
};

const updateById = async (id, update) => {
  await db('usuarios').where({ id }).update(update);
  return await findById(id);
};

const deleteById = async (id) => {
  return await db('usuarios').where({ id }).del();
};

export default { findByEmail, findById, create, listAll, listByRole, getRoles, addRole, removeRole, incrementTokenVersion, updateById, deleteById };
