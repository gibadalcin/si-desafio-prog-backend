import fs from 'fs/promises';
import path from 'path';
import { swaggerSpec } from '../src/config/swagger.js';

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function main() {
  const outDir = path.join(process.cwd(), 'docs');
  const outFile = path.join(outDir, 'openapi.json');
  await ensureDir(outDir);
  const json = JSON.stringify(swaggerSpec, null, 2);
  await fs.writeFile(outFile, json, 'utf8');
  console.log(`OpenAPI exported to ${outFile}`);
}

main().catch((err) => {
  console.error('Failed to export OpenAPI:', err);
  process.exit(1);
});
