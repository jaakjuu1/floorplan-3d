import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { compile } from 'json-schema-to-typescript';

const target = new URL('../src/model/unit-input-v1.ts', import.meta.url);
const source = new URL('../schemas/unit-input-v1.schema.json', import.meta.url);
// The generator uses draft-7 tuple syntax; Pydantic exports draft-2020 prefixItems.
function generatorSchema(value) {
  if (Array.isArray(value)) return value.map(generatorSchema);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, generatorSchema(v)]));
  if (result.prefixItems) {
    result.items = result.prefixItems;
    delete result.prefixItems;
    result.additionalItems = false;
  }
  return result;
}
const output = await compile(generatorSchema(JSON.parse(await readFile(source, 'utf8'))), 'UnitInputs', {
  bannerComment: '/* Generated from schemas/unit-input-v1.schema.json. Run npm run types:generate. */',
  additionalProperties: false,
});
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')).replace(/\r\n/g, '\n') !== output) {
    throw new Error('Generated unit types differ. Run npm run types:generate.');
  }
} else {
  await mkdir(new URL('../src/model/', import.meta.url), { recursive: true });
  await writeFile(target, output);
}
