export async function up(knex) {
  // Ensure indexes and FK constraints for matriculas.aluno_id and matriculas.turma_id
  const client = knex.client.config.client;
  if (await knex.schema.hasTable('matriculas')) {
    const hasAluno = await knex.schema.hasColumn('matriculas', 'aluno_id');
    const hasTurma = await knex.schema.hasColumn('matriculas', 'turma_id');

    // Add indexes where applicable
    await knex.schema.alterTable('matriculas', (table) => {
      if (hasAluno) table.index('aluno_id', 'idx_matriculas_aluno_id');
      if (hasTurma) table.index('turma_id', 'idx_matriculas_turma_id');
    });

    // For dialects that support FK addition post-creation, try to add them (idempotent-ish)
    if (!(client && client.includes && client.includes('sqlite'))) {
      await knex.schema.alterTable('matriculas', (table) => {
        try {
          if (hasAluno) table.foreign('aluno_id', 'fk_matriculas_aluno').references('id').inTable('usuarios').onDelete('CASCADE').onUpdate('CASCADE');
        } catch (e) {
          // ignore
        }
        try {
          if (hasTurma) table.foreign('turma_id', 'fk_matriculas_turma').references('id').inTable('turmas').onDelete('CASCADE').onUpdate('CASCADE');
        } catch (e) {
          // ignore
        }
      });
    }
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('matriculas')) {
    const hasAluno = await knex.schema.hasColumn('matriculas', 'aluno_id');
    const hasTurma = await knex.schema.hasColumn('matriculas', 'turma_id');
    await knex.schema.alterTable('matriculas', (table) => {
      if (hasAluno) {
        try { table.dropForeign('aluno_id', 'fk_matriculas_aluno'); } catch (e) {}
        try { table.dropIndex('aluno_id', 'idx_matriculas_aluno_id'); } catch (e) {}
      }
      if (hasTurma) {
        try { table.dropForeign('turma_id', 'fk_matriculas_turma'); } catch (e) {}
        try { table.dropIndex('turma_id', 'idx_matriculas_turma_id'); } catch (e) {}
      }
    });
  }
}
