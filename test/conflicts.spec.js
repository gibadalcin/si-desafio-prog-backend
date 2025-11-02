import db from '../src/config/db.js';
import matriculaService from '../src/services/matriculaService.js';
import turmaService from '../src/services/turmaService.js';
import HttpError from '../src/utils/HttpError.js';

describe('Conflitos de horário - aluno e professor', () => {
  let horarioId;
  let turmaA;
  let turmaB;
  let alunoId;
  let professorId;

  beforeAll(async () => {
    const ts = Date.now();
  // cria um horario (preencher dia/turno obrigatórios)
  const [hid] = await db('horarios').insert({ codigo: `H-${ts}`, descricao: 'Horario teste', dia: 2, turno: 1 });
    horarioId = hid;

    // cria duas turmas com o mesmo horario
    const [t1] = await db('turmas').insert({ codigo: `T-A-${ts}`, nome: `Turma A ${ts}`, disciplina_id: null, horario_id: horarioId, vagas: 10 });
    const [t2] = await db('turmas').insert({ codigo: `T-B-${ts}`, nome: `Turma B ${ts}`, disciplina_id: null, horario_id: horarioId, vagas: 10 });
    turmaA = t1; turmaB = t2;

    // cria um aluno
    const [aid] = await db('usuarios').insert({ nome: `Aluno Conf ${ts}`, email: `aluno-conf-${ts}@test.local`, senha: 'senha', roles: JSON.stringify(['ALUNO']) });
    alunoId = aid;

    // cria um professor
    const [pid] = await db('usuarios').insert({ nome: `Prof Conf ${ts}`, email: `prof-conf-${ts}@test.local`, senha: 'senha', roles: JSON.stringify(['PROFESSOR']) });
    professorId = pid;
  });

  afterAll(async () => {
    try {
      if (alunoId) await db('matriculas').where({ aluno_id: alunoId }).del();
      if (Array.isArray([turmaA, turmaB])) await db('turmas').whereIn('id', [turmaA, turmaB].filter(Boolean)).del();
      if (horarioId) await db('horarios').where({ id: horarioId }).del();
      if (alunoId) await db('usuarios').where({ id: alunoId }).del();
      if (professorId) await db('usuarios').where({ id: professorId }).del();
    } catch (e) {
      // ignore cleanup errors
    } finally {
      await db.destroy();
    }
  });

  test('aluno não pode se matricular em duas turmas com mesmo horario', async () => {
    // matricula com sucesso na primeira
    const m1 = await matriculaService.enroll(alunoId, turmaA);
    expect(m1).toBeDefined();

    // tentar matricular na segunda turma com mesmo horario deve falhar
  await expect(matriculaService.enroll(alunoId, turmaB)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('professor não pode ter duas turmas no mesmo horario (via turmaService)', async () => {
    // cria uma turma com professor no horario (usando turmaService.create para validar regras)
    const payload = { codigo: `TP-1-${Date.now()}`, nome: 'Turma Prof 1', horario_id: horarioId, vagas: 10, professor_id: professorId };
    const created = await turmaService.create(payload);
    expect(created).toBeDefined();

    // tentar criar outra turma com o mesmo professor e horario deve falhar
    const payload2 = { codigo: `TP-2-${Date.now()}`, nome: 'Turma Prof 2', horario_id: horarioId, vagas: 10, professor_id: professorId };
  await expect(turmaService.create(payload2)).rejects.toMatchObject({ statusCode: 409 });
  });
});
