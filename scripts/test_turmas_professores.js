(async()=>{
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const parseResponse = async (res) => {
    const ct = res.headers.get('content-type') || '';
    try { if (ct.includes('application/json')) return await res.json(); return await res.text(); } catch (e) { return await res.text(); }
  };
  try {
    // login admin
    const loginRaw = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'teste@mail.com', senha:'12345'})});
    const login = await parseResponse(loginRaw);
  if (loginRaw.status !== 200) { console.error('Admin login failed', login); process.exitCode = 2; return; }
  const token = login.accessToken;
  console.log('Admin token ok');

    const turmasRaw = await fetch(base + '/api/turmas', {method:'GET', headers:{'Authorization':'Bearer ' + token}});
    const turmas = await parseResponse(turmasRaw);
  if (turmasRaw.status !== 200) { console.error('Failed to list turmas', turmas); process.exitCode = 3; return; }

    console.log('Total turmas:', Array.isArray(turmas) ? turmas.length : 'unknown');
    const seeded = turmas.filter(t => typeof t.codigo === 'string' && t.codigo.startsWith('SEED-PROF-'));
    console.log('Seeded turmas found:', seeded.map(s => ({ id: s.id, codigo: s.codigo, professor_id: s.professor_id })));

    if (seeded.length >= 3) {
      console.log('TEST PASSED: Found at least 3 seeded turmas.');
      return;
    } else {
      console.error('TEST FAILED: Less than 3 seeded turmas found.');
      process.exitCode = 4;
      return;
    }

  } catch (e) {
    console.error('script error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
