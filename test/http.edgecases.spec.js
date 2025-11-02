import request from 'supertest';
import db from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';

describe('HTTP edge cases: vagas esgotadas e conflito de professor', () => {
  let adminToken;
  let student1Token;
  let student2Token;
  let professorId;
  let horarioId;
  let disciplinaId;
  let turmaId;

  const admin = { email: `admin-edge-${Date.now()}@test.local`, senha: 'senha123' };
  const student1 = { email: `stud1-edge-${Date.now()}@test.local`, senha: 'senha123' };
  const student2 = { email: `stud2-edge-${Date.now()}@test.local`, senha: 'senha123' };
  const professor = { email: `prof-edge-${Date.now()}@test.local`, senha: 'senha123' };

  beforeAll(async () => {
    // create users
    const hashAdmin = bcrypt.hashSync(admin.senha, 10);
    const hashS1 = bcrypt.hashSync(student1.senha, 10);
    const hashS2 = bcrypt.hashSync(student2.senha, 10);
    const hashProf = bcrypt.hashSync(professor.senha, 10);

    const [adminId] = await db('usuarios').insert({ nome: 'Admin Edge', email: admin.email, senha: hashAdmin, roles: JSON.stringify(['ADMIN']) });
    const [s1] = await db('usuarios').insert({ nome: 'Student One', email: student1.email, senha: hashS1, roles: JSON.stringify(['ALUNO']) });
    const [s2] = await db('usuarios').insert({ nome: 'Student Two', email: student2.email, senha: hashS2, roles: JSON.stringify(['ALUNO']) });
    const [pId] = await db('usuarios').insert({ nome: 'Professor Edge', email: professor.email, senha: hashProf, roles: JSON.stringify(['PROFESSOR']) });
    professorId = pId;

    // login admin
    const resA = await request(app).post('/api/auth/login').send({ email: admin.email, senha: admin.senha });
    expect([200, 201]).toContain(resA.status);
    adminToken = resA.body.accessToken;

    // login students
    const resS1 = await request(app).post('/api/auth/login').send({ email: student1.email, senha: student1.senha });
    expect([200, 201]).toContain(resS1.status);
    student1Token = resS1.body.accessToken;

    const resS2 = await request(app).post('/api/auth/login').send({ email: student2.email, senha: student2.senha });
    expect([200, 201]).toContain(resS2.status);
    student2Token = resS2.body.accessToken;

    // create horario
    const resH = await request(app).post('/api/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `HE-${Date.now()}`, descricao: 'Horario edge', dia: 3, turno: 1 });
    expect([200, 201]).toContain(resH.status);
    horarioId = resH.body.id || resH.body[0] && resH.body[0].id;

    // create disciplina
    const resD = await request(app).post('/api/disciplinas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `DE-${Date.now()}`, nome: 'Disc Edge', carga_horaria: 30 });
    expect([200, 201]).toContain(resD.status);
    disciplinaId = resD.body.id || resD.body[0] && resD.body[0].id;

    // create turma with 1 vaga and professor assigned
    const resT = await request(app).post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `TE-${Date.now()}`, nome: 'Turma Edge', disciplina_id: disciplinaId, horario_id: horarioId, vagas: 1, professor_id: professorId });
    expect([200, 201]).toContain(resT.status);
    turmaId = resT.body.id || resT.body[0] && resT.body[0].id;
  });

  afterAll(async () => {
    try {
      if (turmaId) await db('matriculas').where({ turma_id: turmaId }).del();
      if (turmaId) await db('turmas').where({ id: turmaId }).del();
      if (disciplinaId) await db('disciplinas').where({ id: disciplinaId }).del();
      if (horarioId) await db('horarios').where({ id: horarioId }).del();
      await db('usuarios').where({ email: admin.email }).del();
      await db('usuarios').where({ email: student1.email }).del();
      await db('usuarios').where({ email: student2.email }).del();
      await db('usuarios').where({ email: professor.email }).del();
    } catch (e) {
      // ignore
    } finally {
      await db.destroy();
    }
  });

  test('cannot enroll more students than vagas (second enrollment should fail 409)', async () => {
    const res1 = await request(app).post('/api/matriculas')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ turmaId });
    expect([200, 201]).toContain(res1.status);

    const res2 = await request(app).post('/api/matriculas')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ turmaId });

    // expecting conflict (no vagas)
    expect([409, 400]).toContain(res2.status);
  });

  test('cannot assign same professor to another turma with same horario (should fail 409)', async () => {
    // try to create another turma with same horario and same professor
    const res = await request(app).post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `TE2-${Date.now()}`, nome: 'Turma Edge 2', disciplina_id: disciplinaId, horario_id: horarioId, vagas: 10, professor_id: professorId });

    expect([409, 400]).toContain(res.status);
  });
});
