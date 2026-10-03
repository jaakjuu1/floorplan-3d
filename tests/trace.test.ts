import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { attachmentToModel, calibrateBackground, createBackground, type AttachmentSource } from '../src/io/background';
import { DEFAULT_STORE, parseDesign, type Design } from '../src/io/design';
import { readUnit } from '../src/io/unit';
import { apply } from '../src/model/apply';
import { traceOpening, traceRoom, traceWall } from '../src/model/trace';
import { removeTraced } from '../src/model/edit';

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

test('a traced opening finds its host wall and keeps drawing provenance', () => {
  const bg = calibrated(), drawnFrom = (v: number) => drawn(v);
  const walled = traceWall(unit(), bg, { x: 50, y: 200 }, { x: 550, y: 200 }, { thickness_mm: 120, kind: 'partition' });
  // Taps slightly off the centre line still land on the traced wall: 100 px = 800 mm from its start, 100 px wide.
  const { unit: next, id } = traceOpening(walled.unit, bg, { x: 150, y: 203 }, { x: 250, y: 197 }, { kind: 'door', clear_width_mm: 700 });
  const opening = next.baseline.openings!.find(o => o.id === id)!;
  assert.equal(opening.host_wall, walled.id);
  assert.equal(opening.kind, 'door');
  assert.ok(Math.abs(opening.along_wall.value_mm - 800) <= 1 && Math.abs(opening.width.value_mm - 800) <= 2);
  assert.deepEqual(opening.clear_width, drawnFrom(700));
  assert.equal(opening.width.method, 'archive_drawing');
  assert.equal(opening.along_wall.status, 'inferred');
  assert.throws(() => traceOpening(next, bg, { x: 200, y: 200 }, { x: 300, y: 200 }, { kind: 'window' }), /päällekkäin/);
  assert.throws(() => traceOpening(next, bg, { x: 400, y: 200 }, { x: 405, y: 200 }, { kind: 'window' }), /100 mm/);
  assert.throws(() => traceOpening(next, bg, { x: 400, y: 380 }, { x: 500, y: 380 }, { kind: 'window' }), /seinän kohdalta/);
  assert.throws(() => traceOpening(next, bg, { x: 400, y: 200 }, { x: 500, y: 200 }, { kind: 'door', clear_width_mm: 900 }), /Vapaa leveys/);
  assert.throws(() => traceOpening(next, { ...bg, calibration: null }, { x: 400, y: 200 }, { x: 500, y: 200 }, { kind: 'door' }), /Kalibroi/);
});

test('a traced element can be removed from the survey with what depends on it; surveyed ones cannot', () => {
  const bg = calibrated();
  const walled = traceWall(unit(), bg, { x: 50, y: 200 }, { x: 550, y: 200 }, { thickness_mm: 120, kind: 'partition' });
  const door = traceOpening(walled.unit, bg, { x: 150, y: 200 }, { x: 250, y: 200 }, { kind: 'door' });
  const gone = removeTraced(door.unit, walled.id).unit;
  assert.deepEqual(gone, unit()); // the wall and its traced door go together
  assert.deepEqual(removeTraced(door.unit, door.id).unit, walled.unit);
  assert.throws(() => removeTraced(unit(), 'w2'), /Vain pohjakuvasta/);
});
