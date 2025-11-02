(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const log = (...args) => console.log(...args);

  const parse = async (res) => {
    const ct = res.headers.get('content-type') || '';
    try {
      if (ct.includes('application/json')) return await res.json();
      return await res.text();
    } catch (e) { return await res.text(); }
  };

  const check = async (label, fn) => {
    try {
      await fn();
      log(`✅ ${label}`);
      return true;
    } catch (e) {
      log(`❌ ${label} — ${e.message || e}`);
      return false;
    }
  };

  try {
    log('Smoke test started against', base);

    const noAuthDisc = await (async () => {
      const res = await fetch(base + '/api/disciplinas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({codigo: 'NOAUTH-' + Date.now(), nome: 'NoAuth'}) });
      if (res.status >= 200 && res.status < 300) throw new Error(`unexpected success status ${res.status}`);
      return res.status;
    })().catch(e => { throw e; });

    const r1 = await check('POST /api/disciplinas without token should fail', async () => {
      if (noAuthDisc >= 400 && noAuthDisc < 500) return; throw new Error('expected 4xx');
    });

    // admin login
    const adminLogin = await fetch(base + '/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: 'teste@mail.com', senha: '12345' }) });
    const adminBody = await parse(adminLogin);
    if (adminLogin.status !== 200) throw new Error('admin login failed: ' + JSON.stringify(adminBody));
    const adminToken = adminBody.accessToken;
    log('Admin token obtained (trunc):', adminToken ? adminToken.slice(0,40)+'...' : 'no-token');

    // create/update/delete disciplina
    let discId = null;
    const r2 = await check('Create disciplina (ADMIN)', async () => {
      const res = await fetch(base + '/api/disciplinas', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ codigo: 'SMOKE-D-' + Date.now(), nome: 'Smoke Disc' }) });
      const body = await parse(res);
      if (res.status !== 201 && res.status !== 200) throw new Error('create failed: ' + JSON.stringify(body));
      discId = body.id;
    });

    const r3 = await check('Update disciplina (ADMIN)', async () => {
      const res = await fetch(base + `/api/disciplinas/${discId}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ nome: 'Smoke Disc Updated' }) });
      const body = await parse(res);
      if (res.status !== 200) throw new Error('update failed: ' + JSON.stringify(body));
    });

    const r4 = await check('Delete disciplina (ADMIN)', async () => {
      const res = await fetch(base + `/api/disciplinas/${discId}`, { method:'DELETE', headers:{ Authorization: 'Bearer ' + adminToken } });
      if (![200,204].includes(res.status)) {
        const body = await parse(res);
        throw new Error('delete failed: ' + JSON.stringify(body));
      }
    });

    // horario checks
    const noAuthHor = await (async () => {
      const res = await fetch(base + '/api/horarios', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({codigo: 'NOAUTH-H-' + Date.now(), nome: 'NoAuth'}) });
      if (res.status >= 200 && res.status < 300) throw new Error(`unexpected success status ${res.status}`);
      return res.status;
    })();

    const r5 = await check('POST /api/horarios without token should fail', async () => {
      if (noAuthHor >= 400 && noAuthHor < 500) return; throw new Error('expected 4xx');
    });

    let horId = null;
    const r6 = await check('Create horario (ADMIN)', async () => {
      // payload compatível com a tabela `horarios`: codigo, dia, turno, descricao
      const res = await fetch(base + '/api/horarios', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ codigo: 'SMOKE-H-' + Date.now(), descricao: 'Smoke Hor', dia: 2, turno: 1 }) });
      const body = await parse(res);
      if (res.status !== 201 && res.status !== 200) throw new Error('create horario failed: ' + JSON.stringify(body));
      horId = body.id;
    });

    const r7 = await check('Update horario (ADMIN)', async () => {
      const res = await fetch(base + `/api/horarios/${horId}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ descricao: 'Smoke Hor Updated' }) });
      const body = await parse(res);
      if (res.status !== 200) throw new Error('update horario failed: ' + JSON.stringify(body));
    });

    const r8 = await check('Delete horario (ADMIN)', async () => {
      const res = await fetch(base + `/api/horarios/${horId}`, { method:'DELETE', headers:{ Authorization: 'Bearer ' + adminToken } });
      if (![200,204].includes(res.status)) { const body = await parse(res); throw new Error('delete horario failed: ' + JSON.stringify(body)); }
    });

    // turma checks
    const noAuthTur = await (async () => {
      const res = await fetch(base + '/api/turmas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({codigo: 'NOAUTH-T-' + Date.now(), nome: 'NoAuth', vagas:1}) });
      if (res.status >= 200 && res.status < 300) throw new Error(`unexpected success status ${res.status}`);
      return res.status;
    })();

    const r9 = await check('POST /api/turmas without token should fail', async () => {
      if (noAuthTur >= 400 && noAuthTur < 500) return; throw new Error('expected 4xx');
    });

    let turId = null;
    const r10 = await check('Create turma (ADMIN)', async () => {
      const res = await fetch(base + '/api/turmas', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ codigo: 'SMOKE-T-' + Date.now(), nome: 'Smoke Turma', vagas: 2 }) });
      const body = await parse(res);
      if (res.status !== 201 && res.status !== 200) throw new Error('create turma failed: ' + JSON.stringify(body));
      turId = body.id;
    });

    const r11 = await check('Update turma (ADMIN)', async () => {
      const res = await fetch(base + `/api/turmas/${turId}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ nome: 'Smoke Turma Updated' }) });
      const body = await parse(res);
      if (res.status !== 200) throw new Error('update turma failed: ' + JSON.stringify(body));
    });

    const r12 = await check('Delete turma (ADMIN)', async () => {
      const res = await fetch(base + `/api/turmas/${turId}`, { method:'DELETE', headers:{ Authorization: 'Bearer ' + adminToken } });
      if (![200,204].includes(res.status)) { const body = await parse(res); throw new Error('delete turma failed: ' + JSON.stringify(body)); }
    });

    const results = [r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12];
    const passed = results.filter(Boolean).length;
    log('\nSummary: ' + passed + '/' + results.length + ' checks passed');

    if (passed !== results.length) process.exitCode = 2; else process.exitCode = 0;
  } catch (e) {
    console.error('Smoke test error:', e);
    process.exitCode = 3;
  }
})();
