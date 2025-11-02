import request from 'supertest';
import db from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';

describe('HTTP integration: login -> criar turma -> matricular', () => {
  let adminToken;
  let studentToken;
  let turmaId;
  let disciplinaId;
  let horarioId;
  const admin = { email: `admin-${Date.now()}@test.local`, senha: 'senha123' };
  const student = { email: `student-${Date.now()}@test.local`, senha: 'senha123' };

  beforeAll(async () => {
    // create admin and student in DB
    const hashedAdmin = bcrypt.hashSync(admin.senha, 10);
    const hashedStudent = bcrypt.hashSync(student.senha, 10);
    const [adminId] = await db('usuarios').insert({ nome: 'Admin Test', email: admin.email, senha: hashedAdmin, roles: JSON.stringify(['ADMIN']) });
    const [studentId] = await db('usuarios').insert({ nome: 'Student Test', email: student.email, senha: hashedStudent, roles: JSON.stringify(['ALUNO']) });

    // login admin
    const resAuth = await request(app).post('/api/auth/login').send({ email: admin.email, senha: admin.senha });
    expect(resAuth.status).toBe(200);
    adminToken = resAuth.body.accessToken;

    // create horario
    const resH = await request(app).post('/api/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `H-${Date.now()}`, descricao: 'Horario integração', dia: 2, turno: 1 });
  expect([200, 201]).toContain(resH.status);
    horarioId = resH.body.id || resH.body[0] && resH.body[0].id;

    // create disciplina
    const resD = await request(app).post('/api/disciplinas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `D-${Date.now()}`, nome: 'Disciplina integração', carga_horaria: 60 });
  expect([200, 201]).toContain(resD.status);
    disciplinaId = resD.body.id || resD.body[0] && resD.body[0].id;

    // create turma
    const resT = await request(app).post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `T-${Date.now()}`, nome: 'Turma integração', disciplina_id: disciplinaId, horario_id: horarioId, vagas: 5 });
  expect([200, 201]).toContain(resT.status);
    turmaId = resT.body.id || resT.body[0] && resT.body[0].id;

    // login student
    const resS = await request(app).post('/api/auth/login').send({ email: student.email, senha: student.senha });
    expect(resS.status).toBe(200);
    studentToken = resS.body.accessToken;
  });

  afterAll(async () => {
    try {
      if (turmaId) await db('matriculas').where({ turma_id: turmaId }).del();
      if (turmaId) await db('turmas').where({ id: turmaId }).del();
      if (disciplinaId) await db('disciplinas').where({ id: disciplinaId }).del();
      if (horarioId) await db('horarios').where({ id: horarioId }).del();
      await db('usuarios').where({ email: admin.email }).del();
      await db('usuarios').where({ email: student.email }).del();
    } catch (e) {
      // ignore
    } finally {
      await db.destroy();
    }
  });

  test('student can enroll in created turma via HTTP', async () => {
    const res = await request(app).post('/api/matriculas')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ turmaId });

  expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('id');
  });
});
