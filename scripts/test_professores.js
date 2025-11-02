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
    // login admin
    const adminLoginRespRaw = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'teste@mail.com', senha:'12345'})} );
    const adminLoginResp = await parseResponse(adminLoginRespRaw);
    if (adminLoginRespRaw.status !== 200) {
      console.error('Admin login failed', adminLoginRespRaw.status, adminLoginResp);
      process.exitCode = 2;
      return;
    }
    const adminToken = adminLoginResp.accessToken;
    console.log('Admin token present?', !!adminToken);

    // fetch professores
    const profsRaw = await fetch(base + '/api/usuarios/professores', {method:'GET', headers:{'Authorization':'Bearer ' + adminToken}});
    const profs = await parseResponse(profsRaw);
    console.log('GET /api/usuarios/professores status', profsRaw.status);
    if (profsRaw.status !== 200) {
      console.error('Failed to fetch professores:', profs);
      process.exitCode = 3;
      return;
    }

    if (!Array.isArray(profs)) {
      console.error('Unexpected response shape, expected array but got:', typeof profs);
      process.exitCode = 4;
      return;
    }

    console.log('Professores returned:', profs.map(p => ({id:p.id, nome:p.nome, email:p.email})));

    const expectedEmails = ['professor1@mail.com','professor2@mail.com','professor3@mail.com'];
    const found = expectedEmails.filter(e => profs.some(p => p.email === e));

    console.log(`Found ${found.length} of ${expectedEmails.length} expected professor emails.`);

    if (found.length === expectedEmails.length) {
      console.log('TEST PASSED: All expected professors found.');
      return;
    } else {
      console.error('TEST FAILED: Missing expected professors. Missing:', expectedEmails.filter(e=>!found.includes(e)));
      process.exitCode = 5;
      return;
    }

  } catch (e) {
    console.error('script error', e && e.message ? e.message : e);
    process.exit(1);
  }

})();
