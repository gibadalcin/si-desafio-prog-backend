/**
 * Middlewares de Autenticação/Autorização
 * - `authenticate`: valida JWT e injeta `req.user`.
 * - `authorize`: checa se o usuário possui alguma das roles requeridas (OR logic).
 * - `authorizeOrTurmaOwner`: permite ADMIN ou PROFESSOR responsável pela turma.
 */
import { verifyAccessToken } from '../security/jwtUtils.js';
import turmaRepository from '../repositories/turmaRepository.js';

export const authenticate = (req, res, next) => {
  // 1. Verifica o cabeçalho de Autorização
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido ou formato incorreto (Bearer).' });
  }

  // 2. Extrai o token
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token inválido.' });
  }

  // 3. Verifica o token
  const decodedUser = verifyAccessToken(token);

  if (!decodedUser) {
    return res.status(403).json({ message: 'Token inválido ou expirado.' });
  }

  // 4. Injeta o payload do usuário na requisição
  req.user = decodedUser;
  
  // 5. Continua para o próximo middleware/controller
  next();
};

/**
 * Middleware para verificar se o usuário autenticado possui o(s) papel(is) necessário(s) (RBAC).
 * @param {string[]} requiredRoles - Array de papéis necessários (ex: ['ADMIN', 'PROFESSOR']).
 */
export const authorize = (requiredRoles) => (req, res, next) => {
    // req.user deve estar disponível após o middleware 'authenticate'
    if (!req.user || !req.user.roles) {
        return res.status(403).json({ message: 'Acesso negado. Informação de papéis ausente.' });
    }

    const userRoles = req.user.roles; // Ex: ['ALUNO']
    
    // Verifica se pelo menos um dos papéis do usuário está na lista de papéis necessários
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Permissão insuficiente para esta ação.' });
    }

    next();
};

/**
 * Middleware específico para permitir que ADMIN ou o PROFESSOR dono da turma façam a ação.
 * Usa `req.params.id` para identificar a turma.
 */
export const authorizeOrTurmaOwner = async (req, res, next) => {
  try {
    const requester = req.user;
    if (!requester || !requester.roles) return res.status(403).json({ message: 'Acesso negado' });

    // ADMIN sempre pode
    if (requester.roles.includes('ADMIN')) return next();

    // Se for PROFESSOR, verifica se é dono da turma
    if (requester.roles.includes('PROFESSOR')) {
      const turmaId = req.params.id;
      if (!turmaId) return res.status(400).json({ message: 'Id da turma é necessário para autorização' });
      const turma = await turmaRepository.findById(turmaId);
      if (!turma) return res.status(404).json({ message: 'Turma não encontrada' });
      // compara ids (number/string)
      if (Number(turma.professor_id) === Number(requester.id)) return next();
      return res.status(403).json({ message: 'Acesso negado: não é o professor responsável' });
    }

    return res.status(403).json({ message: 'Permissão insuficiente para esta ação.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao verificar autorização', error: err.message });
  }
};
