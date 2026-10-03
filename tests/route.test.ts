import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { readUnit } from '../src/io/unit';
import { addFixture, modifyOpening } from '../src/model/edit';
import { findRoute } from '../src/model/route';

const unit = () => readUnit(readFileSync(new URL('../examples/accessibility-unit.json', import.meta.url), 'utf8'));
const route = (u = unit(), over: Partial<Parameters<typeof findRoute>[0]> = {}) =>
  findRoute({ unit: u, start: { x: 2000, y: 1000 }, goal: { x: 2800, y: 3000 }, pathWidth: 900, doorWidth: 800, ...over });

test('the hall-to-bathroom route passes the 800 mm door clear width', () => {
  const r = route();
  assert.equal(r.reachable, true);
  assert.equal(r.ok, true);
  // The bottleneck is the door, measured at its clear width rather than the 900 mm frame opening.
  assert.deepEqual([r.narrowest!.at, r.narrowest!.opening, r.narrowest!.width, r.narrowest!.required], ['door', 'o2', 800, 800]);
  assert.ok(r.narrowest!.y > 1900 && r.narrowest!.y < 2100);
  assert.ok(r.length_mm > 2000 && r.length_mm < 3500);
  assert.ok(r.path.length > 3);
});

test('a stricter door requirement or a narrowed door is reported at that door', () => {
  const strict = route(unit(), { doorWidth: 900 });
  assert.equal(strict.ok, false);
  assert.equal(strict.narrowest!.opening, 'o2');
  const narrow = route(modifyOpening(unit(), 'o2', { clear_width: 600 }).unit);
  assert.equal(narrow.ok, false);
  assert.deepEqual([narrow.narrowest!.at, narrow.narrowest!.width], ['door', 600]);
});

test('a cabinet narrowing the hall below the route width becomes the narrowest point', () => {
  // Cabinet from x 1500..2500 against the bearing wall up to y 1500 leaves 450 mm to the partition face.
  const u = addFixture(unit(), { kind: 'cabinet', x: 2000, y: 775, width: 1000, depth: 1450 }).unit;
  const r = route(u, { start: { x: 500, y: 1000 }, goal: { x: 3500, y: 1000 } });
  assert.equal(r.reachable, true);
  assert.equal(r.ok, false);
  assert.equal(r.narrowest!.at, 'path');
  assert.ok(Math.abs(r.narrowest!.width - 450) <= 40, String(r.narrowest!.width));
  // Movable furniture counts too.
  const blocked = route(unit(), { start: { x: 500, y: 1000 }, goal: { x: 3500, y: 1000 }, extra: [{ x: 2000, y: 1000, width: 400, depth: 1900 }] });
  assert.equal(blocked.ok, false);
});
