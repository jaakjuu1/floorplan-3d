import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { readUnit } from '../src/io/unit';
import { addFixture, addWall, demolishWall, modifyOpening, moveFixture, removeThreshold } from '../src/model/edit';
import { evaluate, surfaced } from '../src/model/rules';

const unit = () => readUnit(readFileSync(new URL('../examples/accessibility-unit.json', import.meta.url), 'utf8'));
const find = (fs: ReturnType<typeof evaluate>, rule: string, id?: string) => fs.find(f => f.rule === rule && (!id || f.element?.id === id));

test('without changes the survey is checked quietly: nothing is surfaced unless a profile asks', () => {
  const fs = evaluate(unit());
  assert.ok(!fs.some(f => f.profile === 'muutostyo'));
  assert.deepEqual(surfaced(fs), []);
  const door = find(fs, 'esteettomyys.oven_vapaa_leveys', 'o1')!;
  assert.deepEqual([door.ok, door.value, door.limit, door.touched], [true, 800, 800, false]);
  assert.equal(find(fs, 'esteettomyys.kynnys', 't1')!.ok, true);
  // Bathroom r2: walls are 100 mm thick, free height 2050..4000 → Ø 1950; hall r1: 50..1950 → Ø 1900.
  assert.equal(find(fs, 'esteettomyys.pesutila_vapaa_tila', 'r2')!.value, 1950);
  assert.equal(find(fs, 'esteettomyys.kaantymistila', 'r1')!.value, 1900);
  // WC f1 sits 300 mm from the room edge and 300 mm from the sink.
  const wc = find(fs, 'esteettomyys.wc_sivutila', 'f1')!;
  assert.deepEqual([wc.ok, wc.value], [false, 300]);
  assert.deepEqual(surfaced(fs, ['esteettomyys']).map(f => f.rule), ['esteettomyys.wc_sivutila']);
  // Every finding cites its statute.
  assert.ok(fs.every(f => f.source.url.startsWith('https://www.finlex.fi/') && f.source.section));
});

test('changes surface the rules they touch, never as blocks', () => {
  let u = modifyOpening(unit(), 'o2', { clear_width: 700 }).unit;
  u = removeThreshold(u, 't1').unit;
  const fs = evaluate(u), shown = surfaced(fs).map(f => `${f.rule}:${f.element?.id ?? ''}`);
  // The changed door touches the bathroom, so its WC clearance surfaces too.
  assert.deepEqual(shown.sort(), ['esteettomyys.oven_vapaa_leveys:o2', 'esteettomyys.tuki:', 'esteettomyys.wc_sivutila:f1', 'muutostyo.ilmoitus:', 'muutostyo.markatila:r2'].sort());
  assert.match(find(fs, 'esteettomyys.oven_vapaa_leveys', 'o2')!.message.fi, /700 mm.*800 mm/);
  assert.equal(find(fs, 'muutostyo.seina_lupa'), undefined);

  const walls = addWall(demolishWall(unit(), 'w2').unit, { x: 1000, y: 0 }, { x: 1000, y: 1500 }, { thickness_mm: 100 }).unit;
  const wf = evaluate(walls);
  assert.ok(find(wf, 'muutostyo.seina_lupa'));
  assert.equal(find(wf, 'muutostyo.seina_oletus'), undefined); // w2 has survey evidence
  assert.equal(find(wf, 'esteettomyys.kaantymistila', 'r1')!.touched, true);
});

test('fixture moves update free space and the WC side clearance', () => {
  const moved = moveFixture(unit(), 'f2', { x: 3300, y: 2600 }).unit;
  const fs = evaluate(moved), wc = find(fs, 'esteettomyys.wc_sivutila', 'f1')!;
  assert.equal(wc.value, 2300); // sink's left edge 3000 − WC's right side 700
  assert.equal(wc.ok, true);
  assert.equal(wc.touched, true);
  assert.ok(find(fs, 'muutostyo.markatila', 'r2'));
  const bar = addFixture(unit(), { kind: 'grab_bar', x: 300, y: 3900, width: 600, depth: 80 }).unit;
  assert.ok(find(evaluate(bar), 'esteettomyys.tuki'));
  // A demolished wall whose type is only assumed asks for evidence.
  const assumed = unit(); assumed.baseline.walls![1].source_refs = ['assumption:typical'];
  assert.ok(find(evaluate(demolishWall(assumed, 'w2').unit), 'muutostyo.seina_oletus', 'w2'));
});
