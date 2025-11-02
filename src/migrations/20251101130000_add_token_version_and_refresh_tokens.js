export async function up(knex) {
  const hasTokenVersion = await knex.schema.hasColumn('usuarios', 'token_version');
  if (!hasTokenVersion) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.integer('token_version').notNullable().defaultTo(0);
    });
  }

  const exists = await knex.schema.hasTable('refresh_tokens');
  if (!exists) {
    await knex.schema.createTable('refresh_tokens', (table) => {
      table.increments('id').primary();
      table.integer('usuario_id').unsigned().notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
      table.string('token').notNullable().unique();
      table.boolean('revoked').notNullable().defaultTo(false);
      table.timestamp('expires_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable('refresh_tokens');
  if (exists) await knex.schema.dropTable('refresh_tokens');

  const hasTokenVersion = await knex.schema.hasColumn('usuarios', 'token_version');
  if (hasTokenVersion) {
    await knex.schema.alterTable('usuarios', (table) => {
      table.dropColumn('token_version');
    });
  }
}
