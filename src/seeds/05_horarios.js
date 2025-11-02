export async function seed(knex) {
  // Inserir horários de exemplo idempotentemente
  const horarios = [
    { dia: 2, turno: 1, codigo: 'M1', descricao: 'Segunda-feira - Manhã' },
    { dia: 2, turno: 2, codigo: 'T1', descricao: 'Segunda-feira - Tarde' },
    { dia: 3, turno: 3, codigo: 'N1', descricao: 'Terça-feira - Noite' },
  ];

  for (const h of horarios) {
    const exists = await knex('horarios').where({ codigo: h.codigo }).first();
    if (!exists) await knex('horarios').insert(h);
  }
}
