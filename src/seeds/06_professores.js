import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // Inserir alguns professores de exemplo se ainda não existirem
  const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);

  const professores = [
    { email: 'professor1@mail.com', nome: 'Prof. Ana Silva', senha: bcrypt.hashSync('prof123', saltRounds) },
    { email: 'professor2@mail.com', nome: 'Prof. Bruno Costa', senha: bcrypt.hashSync('prof123', saltRounds) },
    { email: 'professor3@mail.com', nome: 'Prof. Carla Lima', senha: bcrypt.hashSync('prof123', saltRounds) }
  ];

  for (const p of professores) {
    // evita duplicação de e-mail
    const existing = await knex('usuarios').where({ email: p.email }).first();
    if (!existing) {
      const [id] = await knex('usuarios').insert({ nome: p.nome, email: p.email, senha: p.senha });
      // associar role PROFESSOR (role_id = 2 conforme seed de roles)
      try {
        await knex('usuario_roles').insert({ usuario_id: id, role_id: 2 });
      } catch (e) {
        // ignore se já existir
      }
    }
  }
}
