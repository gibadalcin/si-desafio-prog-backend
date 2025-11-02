export async function seed(knex) {
  // associar usuário teste (id 1) com roles ADMIN e ALUNO
  await knex('usuario_roles').del();
  await knex('usuario_roles').insert([
    { usuario_id: 1, role_id: 1 },
    { usuario_id: 1, role_id: 3 }
  ]);
}
