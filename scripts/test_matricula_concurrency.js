import db from '../src/config/db.js';
import usuarioRepository from '../src/repositories/usuarioRepository.js';
import turmaRepository from '../src/repositories/turmaRepository.js';
import matriculaRepository from '../src/repositories/matriculaRepository.js';
import matriculaService from '../src/services/matriculaService.js';

const run = async () => {
  console.log('Iniciando teste de concorrência de matrícula');
  const timestamp = Date.now();
  // cria uma turma de teste com 2 vagas
  const [turmaId] = await db('turmas').insert({ codigo: `TEST-CONC-${timestamp}`, nome: `Turma Test ${timestamp}`, disciplina_id: null, horario_id: null, vagas: 2 });
  console.log('Turma criada id=', turmaId);

  // cria 5 alunos de teste
  const studentIds = [];
  for (let i = 0; i < 5; i++) {
    const [id] = await db('usuarios').insert({ nome: `Aluno Concurrency ${i}-${timestamp}`, email: `aluno${i}-${timestamp}@test.local`, senha: 'senha123', roles: JSON.stringify(['ALUNO']) });
    studentIds.push(id);
  }
  console.log('Alunos criados:', studentIds.length);

  // tenta matricular todos em paralelo
  const promises = studentIds.map(id => (
    matriculaService.enroll(id, turmaId)
      .then(r => ({ ok: true, id: r.id }))
      .catch(e => ({ ok: false, message: e && e.message ? e.message : String(e) }))
  ));

  const results = await Promise.all(promises);
  const success = results.filter(r => r.ok).length;
  const fails = results.filter(r => !r.ok).length;
  console.log('Resultados:', { success, fails, details: results });

  // verifica a contagem de matriculas e vagas finais
  const [{ count }] = await db('matriculas').where({ turma_id: turmaId }).count('id as count');
  const turmaRow = await db('turmas').where({ id: turmaId }).first();
  console.log('Matriculas na turma:', parseInt(count, 10), 'Vagas restantes:', turmaRow.vagas);

  // limpeza: remove as matriculas, alunos, turma
  await db('matriculas').where({ turma_id: turmaId }).del();
  await db('usuarios').whereIn('id', studentIds).del();
  await db('turmas').where({ id: turmaId }).del();
  console.log('Cleanup realizado. Teste finalizado.');
  process.exit(0);
};

run().catch(e => { console.error('Erro no teste', e); process.exit(1); });
