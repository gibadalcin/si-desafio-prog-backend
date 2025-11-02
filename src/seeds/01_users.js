import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // limpa tabela
  await knex('usuarios').del();

  const senha = bcrypt.hashSync('12345', parseInt(process.env.SALT_ROUNDS || '10', 10));

  await knex('usuarios').insert([
    {
      email: 'teste@mail.com',
      nome: 'Usuário Teste',
      senha,
      roles: JSON.stringify(['ADMIN','ALUNO'])
    }
  ]);
}
