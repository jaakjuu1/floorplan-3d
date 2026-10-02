import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { attachmentToModel, calibrateBackground, createBackground, type AttachmentSource } from '../src/io/background';
import { DEFAULT_STORE, parseDesign, type Design } from '../src/io/design';
import { readUnit } from '../src/io/unit';
import { apply } from '../src/model/apply';
import { traceRoom, traceWall } from '../src/model/trace';

const bytes = Buffer.from('%PDF-1.7\nsynthetic');
const source: AttachmentSource = { id: 'b'.repeat(64), name: 'synthetic.pdf', mime: 'application/pdf', size: bytes.length, data: bytes.toString('base64') };
const ref = `attachment:${source.id}/page:1`;
const unit = () => readUnit(readFileSync(new URL('../examples/accessibility-unit.json', import.meta.url), 'utf8'));
const calibrated = () => {
  const bg = createBackground(source, { number: 1, count: 1, width: 600, height: 400, rotation: 0 }, { x: 0, y: 0, w: 6000, h: 4000 });
  bg.transform.rotation = 30;
  return calibrateBackground(bg, { x: 50, y: 200 }, { x: 550, y: 200 }, 4000);
};
const drawn = (value_mm: number) => ({ value_mm, status: 'inferred', method: 'archive_drawing', source_refs: [ref], confidence_mm: null });

test('a traced wall lands in the baseline with drawing provenance and leaves the input untouched', () => {
  const original = unit(), before = structuredClone(original), bg = calibrated();
  const { unit: next, id } = traceWall(original, bg, { x: 50, y: 200 }, { x: 550, y: 200 }, { thickness_mm: 120, kind: 'partition' });
  assert.deepEqual(original, before);
  const wall = next.baseline.walls!.find(w => w.id === id)!;
  const a = attachmentToModel({ x: 50, y: 200 }, bg), b = attachmentToModel({ x: 550, y: 200 }, bg);
  assert.deepEqual(wall, { id, kind: 'partition', source_refs: [ref], thickness: drawn(120),
    a: { x: drawn(Math.round(a.x)), y: drawn(Math.round(a.y)) }, b: { x: drawn(Math.round(b.x)), y: drawn(Math.round(b.y)) } });
  assert.ok(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - 4000) < 1e-6);
  // Existing elements and their measurement statuses are unchanged; changes are not used for the survey state.
  assert.deepEqual(next.baseline.walls!.filter(w => w.id !== id), before.baseline.walls);
  assert.deepEqual(next.changes, before.changes);
  const second = traceWall(next, bg, { x: 550, y: 200 }, { x: 550, y: 50 }, { thickness_mm: 120, kind: 'partition' });
  assert.notEqual(second.id, id);
  assert.deepEqual(second.unit.baseline.walls!.at(-1)!.a, wall.b);
});

test('a traced room is closed, validated and survives the design envelope', () => {
  const bg = calibrated(), points = [{ x: 50, y: 50 }, { x: 550, y: 50 }, { x: 550, y: 350 }, { x: 50, y: 350 }];
  const { unit: next, id } = traceRoom(unit(), bg, points, { name: ' Työhuone ', kind: 'bedroom' });
  const room = next.baseline.rooms!.find(r => r.id === id)!;
  assert.equal(room.name, 'Työhuone');
  assert.equal(room.polygon.length, 5);
  assert.deepEqual(room.polygon[0], room.polygon[4]);
  assert.ok(room.polygon.flatMap(p => [p.x, p.y]).every(m => m.status === 'inferred' && m.method === 'archive_drawing' && m.confidence_mm === null));
  assert.ok(apply(next.baseline, next.changes ?? []).rooms!.some(r => r.id === id));
  const design: Design = { schema_version: DEFAULT_STORE, unit: next, furniture: [], rooms: {}, measures: [], background: bg };
  assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(design)), design).unit, next);
});

test('tracing needs a calibration, points on the page and a valid shape', () => {
  const bg = calibrated(), uncalibrated = { ...bg, calibration: null };
  const wall = (b: typeof bg | null, p = { x: 550, y: 200 }, thickness_mm = 120) =>
    traceWall(unit(), b, { x: 50, y: 200 }, p, { thickness_mm, kind: 'partition' });
  assert.throws(() => wall(null), /Kalibroi/);
  assert.throws(() => wall(uncalibrated), /Kalibroi/);
  assert.throws(() => wall(bg, { x: 601, y: 200 }), /ulkopuolella/);
  assert.throws(() => wall(bg, undefined, 0), /paksuus/);
  assert.throws(() => wall(bg, { x: 50, y: 200 }), /hylättiin/);
  const room = (points: { x: number; y: number }[], name = 'Huone') => traceRoom(unit(), bg, points, { name, kind: 'living' });
  assert.throws(() => room([{ x: 0, y: 0 }, { x: 100, y: 0 }]), /kolme/);
  assert.throws(() => room([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }], ' '), /nimi/);
  assert.throws(() => room([{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 100, y: 0 }, { x: 0, y: 100 }]), /hylättiin/);
});
