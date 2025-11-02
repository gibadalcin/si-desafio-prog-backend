#!/usr/bin/env node
import { execSync } from 'child_process';

const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  console.log('NODE_ENV=production — skipping migrations and seeds in prestart.');
  process.exit(0);
}

console.log(`NODE_ENV=${env} — running migrations and seeds...`);
try {
  execSync('npm run migrate --silent', { stdio: 'inherit' });
  execSync('npm run seed --silent', { stdio: 'inherit' });
  console.log('Migrations and seeds finished.');
} catch (e) {
  console.error('Error running migrations/seeds:', e && e.message ? e.message : e);
  process.exit(1);
}
