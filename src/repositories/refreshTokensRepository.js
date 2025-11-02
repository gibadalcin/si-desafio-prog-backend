/**
 * Repositório de Refresh Tokens
 * - Armazena apenas hash dos refresh tokens (sha256) e oferece rotação/revogação.
 * - Importante para segurança: nunca armazenar tokens em texto puro.
 */
import db from '../config/db.js';
import crypto from 'crypto';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const create = async ({ usuarioId, token, expiresAt }) => {
  const tokenHash = hashToken(token);
  const [id] = await db('refresh_tokens').insert({ usuario_id: usuarioId, token: tokenHash, expires_at: expiresAt });
  return db('refresh_tokens').where({ id }).first();
};

const findByToken = async (token) => {
  const tokenHash = hashToken(token);
  return db('refresh_tokens').where({ token: tokenHash }).first();
};

const rotate = async (id, newToken, newExpiresAt) => {
  const tokenHash = hashToken(newToken);
  await db('refresh_tokens').where({ id }).update({ token: tokenHash, expires_at: newExpiresAt, revoked: false });
  return db('refresh_tokens').where({ id }).first();
};

const revokeByUser = async (usuarioId) => {
  return db('refresh_tokens').where({ usuario_id: usuarioId }).update({ revoked: true });
};

const deleteByUser = async (usuarioId) => {
  return db('refresh_tokens').where({ usuario_id: usuarioId }).del();
};

export default { create, findByToken, rotate, revokeByUser, deleteByUser };
