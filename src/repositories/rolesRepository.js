/**
 * Repositório de Roles
 * - CRUD simples para roles; usado para atribuição de roles a usuários.
 */
import db from '../config/db.js';

const findByName = async (name) => {
  return db('roles').where({ name }).first();
};

const findById = async (id) => {
  return db('roles').where({ id }).first();
};

const create = async ({ name, description }) => {
  const [id] = await db('roles').insert({ name, description });
  return findById(id);
};

const listAll = async () => {
  return db('roles').select('id', 'name', 'description');
};

export default { findByName, findById, create, listAll };
