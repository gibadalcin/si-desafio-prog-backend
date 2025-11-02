export async function seed(knex) {
  // Inserir algumas disciplinas de exemplo de forma idempotente
  const disciplinas = [
    { codigo: 'MAT101', nome: 'Cálculo I', carga_horaria: 60 },
    { codigo: 'FIS101', nome: 'Física I', carga_horaria: 60 },
    { codigo: 'PROG101', nome: 'Introdução à Programação', carga_horaria: 80 },
  ];

  for (const d of disciplinas) {
    const exists = await knex('disciplinas').where({ codigo: d.codigo }).first();
    if (!exists) {
      await knex('disciplinas').insert(d);
    }
  }
}
