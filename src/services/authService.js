/**
 * Service de Autenticação
 * - Responsável por autenticar usuário, gerar accessToken e refreshToken.
 * - Gera payload com `roles` que será embutido no access token (impacta autorização).
 */
import usuarioRepository from '../repositories/usuarioRepository.js';
import { comparePassword } from '../security/passwordUtils.js';
import { generateAccessToken, generateRefreshToken } from '../security/jwtUtils.js';
import refreshTokensRepository from '../repositories/refreshTokensRepository.js';

const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);

const login = async (email, senha) => {
	// tenta encontrar usuário no repositório
	const user = await usuarioRepository.findByEmail(email);
		// se usuário não encontrado, retorna null (sem fallback de demo)
		if (!user) return null;

	// se houver senha no registro, compara
	if (user.senha) {
		const ok = await comparePassword(senha, user.senha);
		if (!ok) return null;
	} else {
		// se não há senha armazenada, recusar (ou adaptar conforme necessidade)
		return null;
	}

		let roles = user.roles || [];
		if (typeof roles === 'string') {
			try { roles = JSON.parse(roles); } catch (e) { /* keep as string fallback */ }
		}
			const payload = { id: user.id, email: user.email, roles };
			// inclui token_version se disponível (opcional)
			if (user.token_version !== undefined) payload.token_version = user.token_version;

			const accessToken = generateAccessToken(payload, process.env.ACCESS_TOKEN_EXPIRY || '15m');
			const refreshToken = generateRefreshToken();
			// calcula expires_at
			const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
			// armazena refresh token no banco
			try {
				await refreshTokensRepository.create({ usuarioId: user.id, token: refreshToken, expiresAt });
			} catch (e) {
				// log e prosseguir
				console.error('Erro ao armazenar refresh token:', e.message);
			}

			return { accessToken, refreshToken, user: payload };
};

export default { login };
