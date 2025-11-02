(async()=>{
  const base = process.env.BASE_URL || 'http://localhost:3000';

  const parseResponse = async (res) => {
    const ct = res.headers.get('content-type') || '';
    try {
      if (ct.includes('application/json')) return await res.json();
      return await res.text();
    } catch (e) {
      return await res.text();
    }
  };

  try {
    // Use o recurso global fetch disponível no Node 18+.
    const adminLoginRespRaw = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'teste@mail.com', senha:'12345'})} );
    const adminLoginResp = await parseResponse(adminLoginRespRaw);
    if (adminLoginRespRaw.status !== 200) {
      console.error('Admin login failed', adminLoginRespRaw.status, adminLoginResp);
      return;
    }
    const adminToken = adminLoginResp.accessToken;
    console.log('ADMIN TOKEN TRUNC:', adminToken ? adminToken.slice(0,40)+'...' : 'no token');

    // criar turma com vagas = 2
    const codigo = 'TEST-TURMA-' + Date.now();
    const turmaRespRaw = await fetch(base + '/api/turmas', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer ' + adminToken}, body: JSON.stringify({codigo, nome:'Turma de Teste Vagas 2', vagas:2})});
    const turma = await parseResponse(turmaRespRaw);
    console.log('Create turma status', turmaRespRaw.status, turma);
    if (turmaRespRaw.status !== 201 && turmaRespRaw.status !== 200) return;
    const turmaId = turma.id;

    const students = [];
    for (let i=0;i<3;i++){
      const email = `student_test_${Date.now()}_${i}@mail.com`;
      const nome = `Aluno Test ${i}`;
      const senha = 'senha123';
  const createRespRaw = await fetch(base + '/api/usuarios/register', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer ' + adminToken}, body: JSON.stringify({nome, email, senha, roles:['ALUNO']})});
      const created = await parseResponse(createRespRaw);
      console.log('Created user', i, 'status', createRespRaw.status, created);
      students.push({email, senha});
      // pequeno atraso para evitar colisões de carimbo de data/hora.
      await new Promise(r=>setTimeout(r, 50));
    }

    for (const s of students){
      const loginRespRaw = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email: s.email, senha: s.senha})});
      const j = await parseResponse(loginRespRaw);
      if (loginRespRaw.status !== 200) {
        console.error('Student login failed', s.email, loginRespRaw.status, j);
        continue;
      }
      const token = j.accessToken;
      console.log('Student login', s.email, 'tokenPresent?', !!token);
      const enrollRespRaw = await fetch(base + '/api/matriculas', {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer ' + token}, body: JSON.stringify({turmaId})});
      const enrollBody = await parseResponse(enrollRespRaw);
      console.log('Enroll', s.email, 'status', enrollRespRaw.status, enrollBody);
    }

  } catch (e) {
    console.error('script error', e && e.message ? e.message : e);
  }

})();
