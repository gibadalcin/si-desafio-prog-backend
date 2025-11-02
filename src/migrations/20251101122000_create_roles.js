export async function up(knex) {
  const exists = await knex.schema.hasTable('roles');
  if (!exists) {
    await knex.schema.createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('roles');
  if (exists) await knex.schema.dropTable('roles');
}
