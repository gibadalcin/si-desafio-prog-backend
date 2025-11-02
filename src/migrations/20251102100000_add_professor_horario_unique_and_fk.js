export async function up(knex) {
  const client = knex.client.config.client;
  if (await knex.schema.hasTable('turmas')) {
    const hasProf = await knex.schema.hasColumn('turmas', 'professor_id');
    const hasHora = await knex.schema.hasColumn('turmas', 'horario_id');

    // Ensure columns exist before adding constraints/indexes
    await knex.schema.alterTable('turmas', (table) => {
      if (!hasProf) table.integer('professor_id').unsigned().nullable();
      if (!hasHora) table.integer('horario_id').unsigned().nullable();
    });

    if (client && client.includes && client.includes('sqlite')) {
      // SQLite: add a composite unique index to prevent duplicate (professor, horario)
      try {
        await knex.schema.alterTable('turmas', (table) => {
          table.unique(['professor_id', 'horario_id'], 'uq_turmas_professor_horario');
        });
      } catch (e) {
        // Ignore if already exists or unsupported in this sqlite build
      }
      // Also add an index for queries
      try {
        await knex.schema.alterTable('turmas', (table) => {
          table.index(['professor_id', 'horario_id'], 'idx_turmas_professor_horario');
        });
      } catch (e) {}
    } else {
      // For Postgres/MySQL etc., add FK and unique constraint
      await knex.schema.alterTable('turmas', (table) => {
        try {
          table.index(['professor_id'], 'idx_turmas_professor_id');
        } catch (e) {}
      });
      await knex.schema.alterTable('turmas', (table) => {
        try {
          table.unique(['professor_id', 'horario_id'], 'uq_turmas_professor_horario');
        } catch (e) {}
        try {
          table.foreign('professor_id', 'fk_turmas_professor')
            .references('id')
            .inTable('usuarios')
            .onDelete('SET NULL')
            .onUpdate('CASCADE');
        } catch (e) {}
      });
    }
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('turmas')) {
    const client = knex.client.config.client;
    if (client && client.includes && client.includes('sqlite')) {
      try {
        await knex.schema.alterTable('turmas', (table) => {
          try { table.dropUnique(['professor_id', 'horario_id'], 'uq_turmas_professor_horario'); } catch (e) {}
          try { table.dropIndex(['professor_id', 'horario_id'], 'idx_turmas_professor_horario'); } catch (e) {}
        });
      } catch (e) {}
    } else {
      try {
        await knex.schema.alterTable('turmas', (table) => {
          try { table.dropForeign('professor_id', 'fk_turmas_professor'); } catch (e) {}
          try { table.dropUnique(['professor_id', 'horario_id'], 'uq_turmas_professor_horario'); } catch (e) {}
          try { table.dropIndex('professor_id', 'idx_turmas_professor_id'); } catch (e) {}
        });
      } catch (e) {}
    }
  }
}
