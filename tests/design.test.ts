import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { apply } from '../src/model/apply';
import { readUnit } from '../src/io/unit';
import { DEFAULT_STORE, LEGACY_STORE, loadDesign, parseDesign, saveDesign, type Design } from '../src/io/design';

const demo = readUnit(readFileSync(new URL('../examples/demo-unit.json', import.meta.url), 'utf8'));
const defaults: Design = { schema_version: DEFAULT_STORE, unit: demo, furniture: [], rooms: {}, measures: [] };
// Captured from the old editor's JSON export in the passing pre-integration smoke run.
const legacy = JSON.parse(readFileSync(new URL('../fixtures/editor/legacy-huxing-design-v1.json', import.meta.url), 'utf8'));
const diagonal = readUnit(readFileSync(new URL('../fixtures/editor/diagonal-unit-v1.json', import.meta.url), 'utf8'));

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

test('captured huxing-design-v1 migrates losslessly and repeatably', () => {
  const before = structuredClone(legacy);
  const first = parseDesign(legacy, defaults);
  const second = parseDesign(first, defaults);
  const baseline = structuredClone(first.unit.baseline);
  assert.deepEqual(legacy, before);
  assert.deepEqual(second, first);
  assert.deepEqual(first.legacy, legacy);
  assert.deepEqual(first.furniture, legacy.furniture);
  assert.deepEqual(first.measures, legacy.measures);
  assert.deepEqual(first.rooms, legacy.rooms);
  assert.ok(first.unit.changes?.some(change => change.op === 'demolish_wall' && change.target === 'w26'));
  assert.ok(first.unit.baseline.walls?.some(wall => wall.id === 'w26'), 'migration must leave baseline intact');
  assert.deepEqual(first.unit.baseline, baseline);
  assert.deepEqual(first.unit.baseline, demo.baseline);
  const target = apply(first.unit.baseline, first.unit.changes ?? []);
  assert.ok(!target.walls?.some(wall => wall.id === 'w26'));
  assert.deepEqual(target.walls?.find(wall => wall.id === 'w25'), first.unit.baseline.walls?.find(wall => wall.id === 'w25'));
});

test('legacy floor selection becomes a change_finish operation', () => {
  const input = structuredClone(legacy);
  input.rooms.bay1.mat = 'carpet';
  const migrated = parseDesign(input, defaults);
  assert.ok(migrated.unit.changes?.some(change => change.op === 'change_finish' && change.room === 'bay1' && change.floor === 'carpet'));
  assert.equal(apply(migrated.unit.baseline, migrated.unit.changes ?? []).rooms?.find(room => room.id === 'bay1')?.floor, 'carpet');
});

test('load migrates before returning, leaves old key intact, and reloads the v2 snapshot', () => {
  const storage = memoryStorage({ [LEGACY_STORE]: JSON.stringify(legacy) });
  const migrated = loadDesign(storage, defaults)!;
  assert.ok(storage.getItem(DEFAULT_STORE));
  assert.equal(storage.getItem(LEGACY_STORE), JSON.stringify(legacy));
  assert.deepEqual(loadDesign(storage, defaults), migrated);
});

test('broken current save throws instead of falling back to legacy', () => {
  const storage = memoryStorage({ [DEFAULT_STORE]: '{', [LEGACY_STORE]: JSON.stringify(legacy) });
  assert.throws(() => loadDesign(storage, defaults));
  assert.equal(storage.getItem(LEGACY_STORE), JSON.stringify(legacy));
});

test('migration write failure keeps the original payload available', () => {
  const storage = memoryStorage({ [LEGACY_STORE]: JSON.stringify(legacy) });
  storage.setItem = () => { throw new Error('quota exceeded'); };
  assert.throws(() => loadDesign(storage, defaults), /quota exceeded/);
  assert.equal(storage.getItem(LEGACY_STORE), JSON.stringify(legacy));
});

test('invalid import is rejected before storage changes', () => {
  const storage = memoryStorage({ [DEFAULT_STORE]: JSON.stringify(defaults) });
  const before = [...storage.values];
  for (const invalid of [
    { ...legacy, furniture: [{ ...legacy.furniture[0], w: '1800' }] },
    { ...legacy, furniture: [{ ...legacy.furniture[0], w: Number.NaN }] },
    { ...legacy, demolished: ['missing-wall'] },
    { ...legacy, demolished: ['w26', 'w26'] },
    { ...legacy, measures: [{ a: { x: Number.NaN, y: 1 }, b: { x: 2, y: 3 } }] },
    { ...demo, changes: [{ op: 'demolish_wall', target: 'missing-wall' }] },
    { ...defaults, schema_version: DEFAULT_STORE, unit: { ...demo, changes: [{ op: 'demolish_wall', target: 'missing-wall' }] } },
    { ...defaults, schema_version: DEFAULT_STORE, rooms: { master: { name: 'Makuuhuone', mat: 'carpet' } } },
  ]) assert.throws(() => parseDesign(invalid, defaults));
  assert.deepEqual([...storage.values], before);
});

test('storage write failure propagates without modifying prior data', () => {
  const storage = memoryStorage({ [DEFAULT_STORE]: JSON.stringify(defaults) });
  const before = [...storage.values];
  storage.setItem = () => { throw new Error('quota exceeded'); };
  assert.throws(() => saveDesign(storage, defaults), /quota exceeded/);
  assert.deepEqual([...storage.values], before);
});

test('old screen measures and unknown fields remain recoverable in legacy payload', () => {
  const input = structuredClone(legacy);
  input.future_editor_field = { retained: true };
  input.measures = [{ a: { x: 10, y: 20 }, b: { x: 30, y: 40 } }];
  const migrated = parseDesign(input, defaults);
  assert.deepEqual(migrated.measures, input.measures);
  assert.deepEqual(migrated.legacy, input);
});

test('diagonal E2E fixture is valid and its adjusted geometry remains assumed', () => {
  const wall = diagonal.baseline.walls!.find(item => item.id === 'w1')!;
  assert.equal(diagonal.survey.data_origin, 'regression_baseline');
  assert.deepEqual([wall.b.x.value_mm, wall.b.y.value_mm], [4000, 3000]);
  assert.equal(wall.b.x.status, 'assumed');
  assert.equal(diagonal.baseline.openings!.find(item => item.id === 'o1')!.along_wall.status, 'assumed');
});
