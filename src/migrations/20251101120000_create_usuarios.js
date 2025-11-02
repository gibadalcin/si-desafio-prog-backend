/**
 * Migration: cria tabela `usuarios` para o sistema de matrículas.
 */

export async function up(knex) {
  const exists = await knex.schema.hasTable('usuarios');
  if (!exists) {
    await knex.schema.createTable('usuarios', (table) => {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('nome').notNullable();
      table.string('senha').notNullable();
      table.text('roles').nullable(); // armazenar JSON string
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('usuarios');
  if (exists) {
    await knex.schema.dropTable('usuarios');
  }
}
