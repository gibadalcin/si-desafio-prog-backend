/**
 * Repositório de Disciplinas
 * - CRUD direto no banco e conversão para `Disciplina`.
 */
import db from '../config/db.js';
import { Disciplina } from '../domain/Disciplina.js';

const listAll = async () => {
	try {
		const rows = await db('disciplinas').select('*');
		return rows.map(r => new Disciplina(r));
	} catch (err) {
		return [];
	}
};

const findById = async (id) => {
	try {
		const row = await db('disciplinas').where({ id }).first();
		return row ? new Disciplina(row) : null;
	} catch (err) {
		return null;
	}
};

const findByCodigo = async (codigo) => {
	try {
		const row = await db('disciplinas').where({ codigo }).first();
		return row ? new Disciplina(row) : null;
	} catch (err) {
		return null;
	}
};

const create = async (payload) => {
	try {
		const [id] = await db('disciplinas').insert(payload);
		return findById(id);
	} catch (err) {
		throw err;
	}
};

const update = async (id, payload) => {
	try {
		await db('disciplinas').where({ id }).update(payload);
		return findById(id);
	} catch (err) {
		throw err;
	}
};

const remove = async (id) => {
	try {
		return await db('disciplinas').where({ id }).del();
	} catch (err) {
		throw err;
	}
};

export default { listAll, findById, findByCodigo, create, update, remove };
