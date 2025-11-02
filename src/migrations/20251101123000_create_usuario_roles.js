export async function up(knex) {
  const exists = await knex.schema.hasTable('usuario_roles');
  if (!exists) {
    await knex.schema.createTable('usuario_roles', (table) => {
      table.increments('id').primary();
      table.integer('usuario_id').unsigned().notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
      table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
      table.unique(['usuario_id', 'role_id']);
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('usuario_roles');
  if (exists) await knex.schema.dropTable('usuario_roles');
}
