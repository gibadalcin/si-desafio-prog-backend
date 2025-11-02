import request from 'supertest';
import db from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';

describe('RBAC: professor owner can edit turma; others cannot', () => {
  let adminToken;
  let profToken;
  let otherProfToken;
  let studentToken;
  let disciplinaId;
  let horarioId;
  let turmaId;

  const admin = { email: `rbac-admin-${Date.now()}@test.local`, senha: 'senha123' };
  const prof = { email: `rbac-prof-${Date.now()}@test.local`, senha: 'senha123' };
  const otherProf = { email: `rbac-prof2-${Date.now()}@test.local`, senha: 'senha123' };
  const student = { email: `rbac-stud-${Date.now()}@test.local`, senha: 'senha123' };

  beforeAll(async () => {
    const hashAdmin = bcrypt.hashSync(admin.senha, 10);
    const hashProf = bcrypt.hashSync(prof.senha, 10);
    const hashProf2 = bcrypt.hashSync(otherProf.senha, 10);
    const hashStud = bcrypt.hashSync(student.senha, 10);

    await db('usuarios').insert({ nome: 'RBAC Admin', email: admin.email, senha: hashAdmin, roles: JSON.stringify(['ADMIN']) });
    const [p1] = await db('usuarios').insert({ nome: 'RBAC Prof', email: prof.email, senha: hashProf, roles: JSON.stringify(['PROFESSOR']) });
    const [p2] = await db('usuarios').insert({ nome: 'RBAC Prof2', email: otherProf.email, senha: hashProf2, roles: JSON.stringify(['PROFESSOR']) });
    await db('usuarios').insert({ nome: 'RBAC Stud', email: student.email, senha: hashStud, roles: JSON.stringify(['ALUNO']) });

    // login admin
    const resA = await request(app).post('/api/auth/login').send({ email: admin.email, senha: admin.senha });
    adminToken = resA.body.accessToken;

    // login profs and student
    const resP = await request(app).post('/api/auth/login').send({ email: prof.email, senha: prof.senha });
    profToken = resP.body.accessToken;
    const resP2 = await request(app).post('/api/auth/login').send({ email: otherProf.email, senha: otherProf.senha });
    otherProfToken = resP2.body.accessToken;
    const resS = await request(app).post('/api/auth/login').send({ email: student.email, senha: student.senha });
    studentToken = resS.body.accessToken;

    // create horario
    const resH = await request(app).post('/api/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `R-${Date.now()}`, descricao: 'RBAC horario', dia: 2, turno: 1 });
    horarioId = resH.body.id || resH.body[0] && resH.body[0].id;

    // create disciplina
    const resD = await request(app).post('/api/disciplinas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `RD-${Date.now()}`, nome: 'RBAC Disc', carga_horaria: 20 });
    disciplinaId = resD.body.id || resD.body[0] && resD.body[0].id;

    // create turma with prof as owner
    const resT = await request(app).post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `RT-${Date.now()}`, nome: 'RBAC Turma', disciplina_id: disciplinaId, horario_id: horarioId, vagas: 10, professor_id: p1 });
    turmaId = resT.body.id || resT.body[0] && resT.body[0].id;
  });

  afterAll(async () => {
    try {
      if (turmaId) await db('matriculas').where({ turma_id: turmaId }).del();
      if (turmaId) await db('turmas').where({ id: turmaId }).del();
      if (disciplinaId) await db('disciplinas').where({ id: disciplinaId }).del();
      if (horarioId) await db('horarios').where({ id: horarioId }).del();
      await db('usuarios').where({ email: admin.email }).del();
      await db('usuarios').where({ email: prof.email }).del();
      await db('usuarios').where({ email: otherProf.email }).del();
      await db('usuarios').where({ email: student.email }).del();
    } catch (e) {
      // ignore
    } finally {
      await db.destroy();
    }
  });

  test('professor owner can update their turma', async () => {
    const res = await request(app).put(`/api/turmas/${turmaId}`)
      .set('Authorization', `Bearer ${profToken}`)
      .send({ nome: 'RBAC Updated by Prof' });
    expect([200,201]).toContain(res.status);
  });

  test('other professor cannot update turma owned by another', async () => {
    const res = await request(app).put(`/api/turmas/${turmaId}`)
      .set('Authorization', `Bearer ${otherProfToken}`)
      .send({ nome: 'Malicious Update' });
    expect(res.status).toBe(403);
  });

  test('student cannot update turma', async () => {
    const res = await request(app).put(`/api/turmas/${turmaId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ nome: 'Student Update' });
    expect(res.status).toBe(403);
  });
});
