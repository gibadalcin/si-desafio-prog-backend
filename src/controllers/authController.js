import authService from '../services/authService.js';
import refreshTokensRepository from '../repositories/refreshTokensRepository.js';
import usuarioRepository from '../repositories/usuarioRepository.js';
import { generateAccessToken, generateRefreshToken } from '../security/jwtUtils.js';

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticação
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Autenticar usuário e receber access + refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       200:
 *         description: Retorna accessToken e refreshToken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

export const login = async (req, res, next) => {
	try {
		const { email, senha } = req.body;
		const result = await authService.login(email, senha);
		if (!result) return res.status(401).json({ message: 'Credenciais inválidas' });
		return res.json(result);
	} catch (err) {
		next(err);
	}
};

export const refresh = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) return res.status(400).json({ message: 'refreshToken é obrigatório' });

		const record = await refreshTokensRepository.findByToken(refreshToken);
		if (!record || record.revoked) return res.status(403).json({ message: 'Refresh token inválido' });

		// checar expiração
		if (record.expires_at && new Date(record.expires_at) < new Date()) {
			return res.status(403).json({ message: 'Refresh token expirado' });
		}

		const user = await usuarioRepository.findById(record.usuario_id);
		if (!user) return res.status(404).json({ message: 'Usuário do refresh token não encontrado' });

		const roles = user.roles || [];
		const payload = { id: user.id, email: user.email, roles };
		if (user.token_version !== undefined) payload.token_version = user.token_version;

			// Rotacionar o token de atualização: emitir um novo token de atualização e atualizar o registro no banco de dados.
			const newRefresh = generateRefreshToken();
			const newExpires = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10) * 24 * 60 * 60 * 1000));
			try {
				await refreshTokensRepository.rotate(record.id, newRefresh, newExpires);
			} catch (e) {
				console.error('Erro ao rotacionar refresh token:', e.message);
				return res.status(500).json({ message: 'Erro interno ao rotacionar token' });
			}

			const accessToken = generateAccessToken(payload, process.env.ACCESS_TOKEN_EXPIRY || '15m');
			return res.json({ accessToken, refreshToken: newRefresh });
	} catch (err) {
		next(err);
	}
};

export default { login };

export const whoami = async (req, res) => {
	// retorna o payload decodificado do token (útil para debug local)
	if (!req.user) return res.status(401).json({ message: 'Não autenticado' });
	return res.json({ user: req.user });
};
