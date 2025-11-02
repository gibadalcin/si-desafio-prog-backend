export async function seed(knex) {
  // limpa tabela e insere turmas de exemplo
  await knex('turmas').del();

  await knex('turmas').insert([
    { codigo: 'TURMA101', nome: 'Turma de Exemplo 101', vagas: 30 },
    { codigo: 'TURMA102', nome: 'Turma de Exemplo 102', vagas: 25 }
  ]);
}
