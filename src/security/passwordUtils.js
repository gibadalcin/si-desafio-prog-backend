/**
 * Utilitários de senha
 * - Hash e comparação de senhas usando bcryptjs.
 * - Use SALT_ROUNDS via .env para controlar custo.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

export const hashPassword = async (plain) => {
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	return bcrypt.hash(plain, salt);
};

export const comparePassword = async (plain, hash) => {
	return bcrypt.compare(plain, hash);
};

export default { hashPassword, comparePassword };
