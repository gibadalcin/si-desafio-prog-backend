export async function seed(knex) {
  // cria turmas de amostra ligadas aos professores criados pelo seed anterior
  const professorEmails = ['professor1@mail.com','professor2@mail.com','professor3@mail.com'];

  for (const email of professorEmails) {
    const user = await knex('usuarios').where({ email }).first();
    if (!user) continue;

    const codigo = `SEED-PROF-${email.split('@')[0].toUpperCase()}`;
    const exists = await knex('turmas').where({ codigo }).first();
    if (exists) continue;

    await knex('turmas').insert({
      codigo,
      nome: `Turma do ${user.nome}`,
      vagas: 30,
      disciplina_id: null,
      horario_id: null,
      professor_id: user.id
    });
  }
}
