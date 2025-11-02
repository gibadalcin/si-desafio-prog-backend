import db from '../src/config/db.js';
import matriculaService from '../src/services/matriculaService.js';

describe('Matrícula concorrente (transacional)', () => {
  let turmaId;
  let studentIds = [];

  beforeAll(async () => {
    const timestamp = Date.now();
    // criar turma com 2 vagas
    const [id] = await db('turmas').insert({ codigo: `JEST-CONC-${timestamp}`, nome: `Turma JEST ${timestamp}`, disciplina_id: null, horario_id: null, vagas: 2 });
    turmaId = id;

    // criar 5 alunos
    for (let i = 0; i < 5; i++) {
      const [uid] = await db('usuarios').insert({ nome: `Aluno JEST ${i}-${timestamp}`, email: `jest-aluno${i}-${timestamp}@test.local`, senha: 'senha123', roles: JSON.stringify(['ALUNO']) });
      studentIds.push(uid);
    }
  });

  afterAll(async () => {
    // limpar
    await db('matriculas').where({ turma_id: turmaId }).del();
    if (studentIds.length) await db('usuarios').whereIn('id', studentIds).del();
    if (turmaId) await db('turmas').where({ id: turmaId }).del();
    await db.destroy();
  });

  test('apenas N alunos conseguem matrícula quando vagas = N', async () => {
    const promises = studentIds.map(id => (
      matriculaService.enroll(id, turmaId)
        .then(() => ({ ok: true }))
        .catch((e) => ({ ok: false, message: e && e.message ? e.message : String(e) }))
    ));

    const results = await Promise.all(promises);
    const success = results.filter(r => r.ok).length;

    // contamos as vagas iniciais (2)
    expect(success).toBe(2);

    // verifica que a contagem persistida é igual a success
    const [{ count }] = await db('matriculas').where({ turma_id: turmaId }).count('id as count');
    expect(parseInt(count, 10)).toBe(success);
  });
});
