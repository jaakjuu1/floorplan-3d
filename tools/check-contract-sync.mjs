import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const flag = process.argv.indexOf('--rk');
const rk = flag >= 0 ? process.argv[flag + 1] : undefined;
if (!rk) {
  console.error('Usage: node tools/check-contract-sync.mjs --rk <rakennuspiirustus-automaatio path>');
  process.exit(2);
}

const files = ['schemas/unit-input-v1.schema.json', 'examples/accessibility-unit.json', 'examples/demo-unit.json'];
for (const directory of ['fixtures/unit', 'fixtures/apply']) {
  const source = resolve(root, directory);
  const names = (await readdir(source)).filter(name => name.endsWith('.json')).sort();
  files.push(...names.map(name => `${directory}/${name}`));
}

let failed = false;
for (const path of files) {
  try {
    const [fp, python] = await Promise.all([
      readFile(resolve(root, path)),
      readFile(resolve(rk, path)),
    ]);
    if (!fp.equals(python)) {
      console.error(`Different: ${path}`);
      failed = true;
    }
  } catch (error) {
    console.error(`Missing or unreadable: ${path} (${error.message})`);
    failed = true;
  }
}

for (const directory of ['fixtures/unit', 'fixtures/apply']) {
  const [fp, python] = await Promise.all([
    readdir(resolve(root, directory)),
    readdir(resolve(rk, directory)).catch(() => []),
  ]);
  const expected = fp.filter(name => name.endsWith('.json')).sort();
  const actual = python.filter(name => name.endsWith('.json')).sort();
  if (expected.join('\0') !== actual.join('\0')) {
    console.error(`File set differs: ${directory} (FP: ${expected.join(', ')}; RK: ${actual.join(', ')})`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`Contract copies match (${files.length} JSON files).`);
