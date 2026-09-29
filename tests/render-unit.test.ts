import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { readUnit } from '../src/io/unit';
import { projectUnit } from '../src/model/render-unit';
import type { UnitInputs } from '../src/model/unit-input-v1';

const demo = readUnit(readFileSync(new URL('../examples/demo-unit.json', import.meta.url), 'utf8'));
const legacy = JSON.parse(readFileSync(new URL('../fixtures/editor/legacy-geometry.json', import.meta.url), 'utf8'));

const boxOf = (poly: [number, number][]) => [
  Math.min(...poly.map(p => p[0])), Math.min(...poly.map(p => p[1])),
  Math.max(...poly.map(p => p[0])), Math.max(...poly.map(p => p[1])),
];

test('demo geometry projects to the legacy plan and keeps provenance/baseline unchanged', () => {
  const before = structuredClone(demo);
  const view = projectUnit(demo);
  assert.deepEqual(view.rooms.find(r => r.id === 'master')?.poly,
    [[6600, 0], [10270, 0], [10270, 3370], [6600, 3370], [6600, 0]]);
  assert.deepEqual(view.rooms.find(r => r.id === 'dining')?.poly,
    [[2420, 5190], [4820, 5190], [4820, 7960], [2420, 7960], [2420, 7400], [2180, 7400], [2180, 5796], [2420, 5796], [2420, 5190]]);
  const top = view.walls.find(w => w.id === 'w0')!;
  assert.deepEqual([Math.min(...top.polygon.map(p => p[0])), Math.max(...top.polygon.map(p => p[0])),
    Math.min(...top.polygon.map(p => p[1])), Math.max(...top.polygon.map(p => p[1]))], [1580, 2120, -240, 0]);
  assert.equal(view.walls.find(w => w.id === 'w30')?.height, 1000);
  assert.deepEqual(view.openings.find(o => o.id === 'door-0')?.h, [4580, 3280]);
  assert.deepEqual(view.openings.find(o => o.id === 'door-0')?.o, [-1, 0]);
  assert.deepEqual(view.openings.find(o => o.id === 'door-5')?.entry, true);
  assert.equal(view.rooms.find(r => r.id === 'bay1')?.counted, false);
  assert.equal(view.rooms.find(r => r.id === 'bay1')?.at, undefined);
  assert.deepEqual(view.walls.find(w => w.id === 'host-bay-lintel-0')?.segments, []);
  assert.equal(view.openings.find(o => o.id === 'bay-lintel-0')?.sill, 0);
  assert.equal(view.openings.find(o => o.id === 'bay-lintel-0')?.height, 2400);
  assert.equal(demo.survey.data_origin, 'regression_baseline');
  assert.ok(demo.baseline.walls!.slice(0, 48).every(w => w.id === `w${demo.baseline.walls!.indexOf(w)}`));
  for (const [i, rect] of legacy.walls.entries()) assert.deepEqual(boxOf(view.walls[i].polygon), rect.slice(0, 4), `wall w${i}`);
  for (const room of legacy.rooms) assert.deepEqual(view.rooms.find(r => r.id === room.id)?.poly, [...room.poly, room.poly[0]], `room ${room.id}`);
  for (const [i, rect] of legacy.windows.entries()) assert.deepEqual(boxOf(view.openings.find(o => o.id === `window-${i}`)!.polygon), rect, `window ${i}`);
  for (const [i, door] of legacy.doors.entries()) {
    const projected = view.openings.find(o => o.id === `door-${i}`)!;
    assert.deepEqual(boxOf(projected.polygon), door.rect, `door ${i}`);
    assert.deepEqual(projected.h, door.h, `door hinge ${i}`);
    assert.deepEqual(projected.c, door.c, `door closed direction ${i}`);
    assert.deepEqual(projected.o, door.o, `door open direction ${i}`);
  }
  for (const [i, slider] of legacy.sliders.entries()) assert.deepEqual(boxOf(view.openings.find(o => o.id === `slide-${i}`)!.polygon), slider.rect, `slider ${i}`);
  assert.deepEqual(demo, before);
});

test('diagonal wall cuts openings by host distance, including nonzero along_wall', () => {
  const unit: UnitInputs = structuredClone(demo);
  unit.baseline = {
    walls: [{
      id: 'diagonal', a: { x: m(0), y: m(0) }, b: { x: m(4000), y: m(3000) },
      thickness: m(200), kind: 'partition',
    }],
    openings: [{ id: 'diagonal-door', kind: 'door', host_wall: 'diagonal', along_wall: m(1000), width: m(900), swing: 'left' }],
    rooms: [], fixtures: [], thresholds: [], measurements: [],
  };
  unit.changes = [];
  const { walls, openings } = projectUnit(unit);
  assert.deepEqual(walls[0].segments.map(s => [s.a, s.b]), [
    [[0, 0], [800, -600]], [[1520, -1140], [4000, -3000]],
  ]);
  assert.deepEqual([openings[0].a, openings[0].b], [[800, -600], [1520, -1140]]);
  assert.deepEqual(openings[0].c, [0.8, -0.6], 'the closed door follows the opening, not the wall before it');
  assert.ok(Math.abs(Math.hypot(...(openings[0].b.map((v, i) => v - openings[0].a[i]) as [number, number])) - 900) < 1e-8);
  assert.deepEqual(unit.baseline.walls![0].a, { x: m(0), y: m(0) });
  unit.changes = [{ op: 'modify_opening', target: 'diagonal-door', set: { along_wall: m(1500), swing: 'right' } }];
  assert.deepEqual(projectUnit(unit).openings[0].a, [1200, -900]);
  assert.deepEqual(projectUnit(unit).openings[0].h, [1260, -820]);
  assert.ok(Math.abs(projectUnit(unit).openings[0].o![0] + 0.6) < 1e-8);
  assert.ok(Math.abs(projectUnit(unit).openings[0].o![1] + 0.8) < 1e-8);
});

function m(value_mm: number) {
  return { value_mm, status: 'assumed' as const, method: 'archive_drawing' as const,
    source_refs: ['test:diagonal'] as [string], confidence_mm: null };
}
