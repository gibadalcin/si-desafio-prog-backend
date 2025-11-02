import request from 'supertest';
import db from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';

describe('GET /api/usuarios/professores/:id/turmas', () => {
  let adminToken;
  let profToken;
  let otherProfToken;
  let disciplinaId;
  let horarioId1;
  let horarioId2;
  let p1;
  let turmaIds = [];

  const admin = { email: `pt-admin-${Date.now()}@test.local`, senha: 'senha123' };
  const prof = { email: `pt-prof-${Date.now()}@test.local`, senha: 'senha123' };
  const otherProf = { email: `pt-prof2-${Date.now()}@test.local`, senha: 'senha123' };

  beforeAll(async () => {
    const hashAdmin = bcrypt.hashSync(admin.senha, 10);
    const hashProf = bcrypt.hashSync(prof.senha, 10);
    const hashProf2 = bcrypt.hashSync(otherProf.senha, 10);

    await db('usuarios').insert({ nome: 'PT Admin', email: admin.email, senha: hashAdmin, roles: JSON.stringify(['ADMIN']) });
    const [pid] = await db('usuarios').insert({ nome: 'PT Prof', email: prof.email, senha: hashProf, roles: JSON.stringify(['PROFESSOR']) });
    p1 = pid;
    const [p2] = await db('usuarios').insert({ nome: 'PT Prof2', email: otherProf.email, senha: hashProf2, roles: JSON.stringify(['PROFESSOR']) });

    // login admin
    const resA = await request(app).post('/api/auth/login').send({ email: admin.email, senha: admin.senha });
    adminToken = resA.body.accessToken;

    // login profs
    const resP = await request(app).post('/api/auth/login').send({ email: prof.email, senha: prof.senha });
    profToken = resP.body.accessToken;
    const resP2 = await request(app).post('/api/auth/login').send({ email: otherProf.email, senha: otherProf.senha });
    otherProfToken = resP2.body.accessToken;

    // Cria dois horários (diferentes) porque o professor não pode ser alocado duas vezes no mesmo horário.
    const resH1 = await request(app).post('/api/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `PT1-${Date.now()}`, descricao: 'PT horario 1', dia: 2, turno: 1 });
    horarioId1 = resH1.body.id || (resH1.body[0] && resH1.body[0].id);
    const resH2 = await request(app).post('/api/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `PT2-${Date.now()}`, descricao: 'PT horario 2', dia: 3, turno: 1 });
    horarioId2 = resH2.body.id || (resH2.body[0] && resH2.body[0].id);

    // cria disciplina
    const resD = await request(app).post('/api/disciplinas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `PD-${Date.now()}`, nome: 'PT Disc', carga_horaria: 20 });
    disciplinaId = resD.body.id || (resD.body[0] && resD.body[0].id);

    // Cria duas turmas para p1.
    const resT1 = await request(app).post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `PTT1-${Date.now()}`, nome: 'PT Turma 1', disciplina_id: disciplinaId, horario_id: horarioId1, vagas: 10, professor_id: p1 });
    const t1 = resT1.body.id || (resT1.body[0] && resT1.body[0].id);
    turmaIds.push(t1);

    const resT2 = await request(app).post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ codigo: `PTT2-${Date.now()}`, nome: 'PT Turma 2', disciplina_id: disciplinaId, horario_id: horarioId2, vagas: 10, professor_id: p1 });
    const t2 = resT2.body.id || (resT2.body[0] && resT2.body[0].id);
    turmaIds.push(t2);
  });

  afterAll(async () => {
    try {
      for (const id of turmaIds) {
        if (id) await db('matriculas').where({ turma_id: id }).del();
        if (id) await db('turmas').where({ id }).del();
      }
      if (disciplinaId) await db('disciplinas').where({ id: disciplinaId }).del();
      if (horarioId) await db('horarios').where({ id: horarioId }).del();
      await db('usuarios').where({ email: admin.email }).del();
      await db('usuarios').where({ email: prof.email }).del();
      await db('usuarios').where({ email: otherProf.email }).del();
    } catch (e) {
      // ignore
    } finally {
      await db.destroy();
    }
  });

  test('admin can list turmas of a professor', async () => {
    const res = await request(app).get(`/api/usuarios/professores/${p1}/turmas`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body.turmas)).toBe(true);
    expect(res.body.turmas.length).toBeGreaterThanOrEqual(2);
  });

  test('professor can list their own turmas', async () => {
    const res = await request(app).get(`/api/usuarios/professores/${p1}/turmas`)
      .set('Authorization', `Bearer ${profToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.turmas)).toBe(true);
  });

  test('other professor cannot list turmas of another professor', async () => {
    const res = await request(app).get(`/api/usuarios/professores/${p1}/turmas`)
      .set('Authorization', `Bearer ${otherProfToken}`);
    expect(res.status).toBe(403);
  });
});
