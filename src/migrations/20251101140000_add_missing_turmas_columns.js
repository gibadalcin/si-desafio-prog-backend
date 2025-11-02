export async function up(knex) {
  if (await knex.schema.hasTable('turmas')) {
    const hasDisc = await knex.schema.hasColumn('turmas', 'disciplina_id');
    const hasHora = await knex.schema.hasColumn('turmas', 'horario_id');
    const hasProf = await knex.schema.hasColumn('turmas', 'professor_id');

    await knex.schema.alterTable('turmas', (table) => {
      if (!hasDisc) table.integer('disciplina_id').unsigned().nullable();
      if (!hasProf) table.integer('professor_id').unsigned().nullable();
      if (!hasHora) table.integer('horario_id').unsigned().nullable();
    });
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('turmas')) {
    const hasDisc = await knex.schema.hasColumn('turmas', 'disciplina_id');
    const hasHora = await knex.schema.hasColumn('turmas', 'horario_id');
    const hasProf = await knex.schema.hasColumn('turmas', 'professor_id');
    // SQLite doesn't support dropping columns easily; attempt if supported by dialect
    try {
      await knex.schema.alterTable('turmas', (table) => {
        if (hasDisc) table.dropColumn('disciplina_id');
        if (hasProf) table.dropColumn('professor_id');
        if (hasHora) table.dropColumn('horario_id');
      });
    } catch (e) {
      // ignore on sqlite
    }
  }
}
