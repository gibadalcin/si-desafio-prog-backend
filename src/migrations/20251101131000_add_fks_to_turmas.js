export async function up(knex) {
  // Adicione chaves estrangeiras e índices a turmas.disciplina_id e turmas.horario_id.
  const client = knex.client.config.client;

  if (client && client.includes && client.includes('sqlite')) {
    // SQLite: cannot add foreign keys to existing table easily; add indexes instead
    if (await knex.schema.hasTable('turmas')) {
      const hasDisc = await knex.schema.hasColumn('turmas', 'disciplina_id');
      const hasHora = await knex.schema.hasColumn('turmas', 'horario_id');
      await knex.schema.alterTable('turmas', (table) => {
        if (hasDisc) table.index('disciplina_id', 'idx_turmas_disciplina_id');
        if (hasHora) table.index('horario_id', 'idx_turmas_horario_id');
      });
    }
  } else {
    // For Postgres/MySQL and others, add foreign key constraints
    // ensure columns exist (idempotent)
    if (await knex.schema.hasTable('turmas')) {
      const hasDisc = await knex.schema.hasColumn('turmas', 'disciplina_id');
      const hasHora = await knex.schema.hasColumn('turmas', 'horario_id');
      await knex.schema.alterTable('turmas', (table) => {
        if (!hasDisc) table.integer('disciplina_id').unsigned().nullable();
        if (!hasHora) table.integer('horario_id').unsigned().nullable();
      });

      // Add indexes and foreign keys where possible
      await knex.schema.alterTable('turmas', (table) => {
        table.index('disciplina_id', 'idx_turmas_disciplina_id');
        table.index('horario_id', 'idx_turmas_horario_id');

        try {
          table.foreign('disciplina_id', 'fk_turmas_disciplina')
            .references('id')
            .inTable('disciplinas')
            .onDelete('SET NULL')
            .onUpdate('CASCADE');
        } catch (e) {
          // some dialects may throw when adding FK this way; ignore to keep migration robust
        }

        try {
          table.foreign('horario_id', 'fk_turmas_horario')
            .references('id')
            .inTable('horarios')
            .onDelete('SET NULL')
            .onUpdate('CASCADE');
        } catch (e) {
          // ignore
        }
      });
    }
  }
}

export async function down(knex) {
  const client = knex.client.config.client;
  if (await knex.schema.hasTable('turmas')) {
    const hasDisc = await knex.schema.hasColumn('turmas', 'disciplina_id');
    const hasHora = await knex.schema.hasColumn('turmas', 'horario_id');
    await knex.schema.alterTable('turmas', (table) => {
      if (hasDisc) {
        try { table.dropForeign('disciplina_id', 'fk_turmas_disciplina'); } catch (e) {}
        try { table.dropIndex('disciplina_id', 'idx_turmas_disciplina_id'); } catch (e) {}
      }
      if (hasHora) {
        try { table.dropForeign('horario_id', 'fk_turmas_horario'); } catch (e) {}
        try { table.dropIndex('horario_id', 'idx_turmas_horario_id'); } catch (e) {}
      }
    });
  }
}
