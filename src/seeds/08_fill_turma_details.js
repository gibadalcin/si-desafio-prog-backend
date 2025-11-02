export async function seed(knex) {
  // Preenche disciplina_id e horario_id nas turmas seedadas se existirem disciplinas/horarios
  const disciplinas = await knex('disciplinas').select('id').limit(1);
  const horarios = await knex('horarios').select('id').limit(1);
  const discId = disciplinas[0] ? disciplinas[0].id : null;
  const horarioId = horarios[0] ? horarios[0].id : null;

  if (!discId && !horarioId) return;

  const turmas = await knex('turmas').whereRaw("codigo like 'SEED-PROF-%'");
  for (const t of turmas) {
    const update = {};
    if (discId && !t.disciplina_id) update.disciplina_id = discId;
    if (horarioId && !t.horario_id) update.horario_id = horarioId;
    if (Object.keys(update).length) {
      await knex('turmas').where({ id: t.id }).update(update);
    }
  }
}
