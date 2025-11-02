export async function seed(knex) {
  await knex('roles').del();
  await knex('roles').insert([
    { id: 1, name: 'ADMIN', description: 'Administrador da instituição' },
    { id: 2, name: 'PROFESSOR', description: 'Professor' },
    { id: 3, name: 'ALUNO', description: 'Aluno' }
  ]);
}
