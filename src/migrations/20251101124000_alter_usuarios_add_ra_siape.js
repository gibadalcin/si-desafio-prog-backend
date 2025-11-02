export async function up(knex) {
  const has = await knex.schema.hasTable('usuarios');
  if (has) {
    await knex.schema.alterTable('usuarios', (table) => {
      if (!table.hasColumn) {
        // O Knex não expõe o hasColumn de forma confiável entre bancos de dados neste contexto; use o método raw guard.
      }
      table.string('ra').nullable();
      table.string('siape').nullable();
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable('usuarios');
  if (has) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.dropColumn('ra');
      table.dropColumn('siape');
    });
  }
}
