export async function up(knex) {
  const exists = await knex.schema.hasTable('disciplinas');
  if (!exists) {
    await knex.schema.createTable('disciplinas', (table) => {
      table.increments('id').primary();
      table.string('codigo').notNullable().unique();
      table.string('nome').notNullable();
      table.integer('carga_horaria').defaultTo(0);
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('disciplinas');
  if (exists) await knex.schema.dropTable('disciplinas');
}
