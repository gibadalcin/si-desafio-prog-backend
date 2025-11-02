/**
 * Migration: cria tabela `turmas`.
 */

export async function up(knex) {
  const exists = await knex.schema.hasTable('turmas');
  if (!exists) {
    await knex.schema.createTable('turmas', (table) => {
      table.increments('id').primary();
      table.string('codigo').notNullable().unique();
      table.string('nome').notNullable();
      table.integer('vagas').notNullable().defaultTo(0);
      table.integer('disciplina_id').unsigned().nullable();
      table.integer('professor_id').unsigned().nullable();
      table.integer('horario_id').unsigned().nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('turmas');
  if (exists) await knex.schema.dropTable('turmas');
}
