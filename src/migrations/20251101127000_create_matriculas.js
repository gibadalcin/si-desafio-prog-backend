export async function up(knex) {
  const exists = await knex.schema.hasTable('matriculas');
  if (!exists) {
    await knex.schema.createTable('matriculas', (table) => {
      table.increments('id').primary();
      table.integer('aluno_id').unsigned().notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
      table.integer('turma_id').unsigned().notNullable().references('id').inTable('turmas').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['aluno_id', 'turma_id']);
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('matriculas');
  if (exists) await knex.schema.dropTable('matriculas');
}
