/**
 * Utilitários JWT
 * - Geração/validação de access tokens (JWT) e geração de refresh tokens aleatórios.
 * - Observação: manter `JWT_SECRET` em variáveis de ambiente e fora do repositório.
 */
import jwt from 'jsonwebtoken';

// Defina sua chave secreta em variáveis de ambiente, NUNCA hardcoded!
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
import crypto from 'crypto';
const JWT_EXPIRATION = '1d'; // Expira em 1 dia

/**
 * Gera um token JWT para o usuário.
 * @param {object} userPayload - Dados do usuário para incluir no token (id, email, roles).
 * @returns {string} Token JWT.
 */
export const generateAccessToken = (userPayload, expiresIn = '15m') => {
  // O payload deve conter informações essenciais para a autorização (ex: roles)
  return jwt.sign(userPayload, JWT_SECRET, { expiresIn });
};

/**
 * Verifica e decodifica um token JWT.
 * @param {string} token - O token JWT.
 * @returns {object | null} O payload decodificado ou null em caso de erro.
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Erro comum: Token expirado (TokenExpiredError) ou inválido (JsonWebTokenError)
    console.error("Erro ao verificar token:", error.message);
    return null;
  }
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString('hex');
};

export default { generateAccessToken, verifyAccessToken, generateRefreshToken };