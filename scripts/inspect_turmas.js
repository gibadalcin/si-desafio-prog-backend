import knexfile from '../knexfile.js';
import knex from 'knex';

(async function () {
  const db = knex(knexfile.development);
  try {
    const info = await db('turmas').columnInfo();
    console.log('turmas columns:', info);
  } catch (err) {
    console.error('error querying turmas:', err && err.message ? err.message : err);
  } finally {
    await db.destroy();
  }
})();
