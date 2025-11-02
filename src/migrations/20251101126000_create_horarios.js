export async function up(knex) {
  const exists = await knex.schema.hasTable('horarios');
  if (!exists) {
    await knex.schema.createTable('horarios', (table) => {
      table.increments('id').primary();
      table.integer('dia').notNullable(); // 1..7 (1=domingo or as agreed)
      table.integer('turno').notNullable(); // 1=manhã,2=tarde,3=noite
      table.string('codigo').notNullable().unique(); // e.g. '21' or '33' as string
      table.string('descricao');
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('horarios');
  if (exists) await knex.schema.dropTable('horarios');
}
