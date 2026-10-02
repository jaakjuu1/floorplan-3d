import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { readUnit } from '../src/io/unit';
import { apply } from '../src/model/apply';
import { addFixture, addWall, changeMarks, demolishWall, modifyOpening, moveFixture, removeThreshold, replaceFixture,
  restoreWall, revertChange, setFloor } from '../src/model/edit';

const unit = () => readUnit(readFileSync(new URL('../examples/accessibility-unit.json', import.meta.url), 'utf8'));
const planned = (value_mm: number, ref: string) => ({ value_mm, status: 'assumed', method: 'assumption', source_refs: [`design:${ref}`], confidence_mm: null });

test('each edit appends exactly one validated change and leaves the survey baseline untouched', () => {
  const original = unit(), before = structuredClone(original);
  const widened = modifyOpening(original, 'o2', { width: 1000, clear_width: 900 });
  assert.deepEqual(original, before);
  assert.deepEqual(widened.unit.baseline, before.baseline);
  assert.deepEqual(widened.unit.changes, [{ op: 'modify_opening', target: 'o2',
    set: { width: planned(1000, 'o2/width'), clear_width: planned(900, 'o2/clear_width') } }]);
  const target = apply(widened.unit.baseline, widened.unit.changes!);
  assert.equal(target.openings!.find(o => o.id === 'o2')!.clear_width!.value_mm, 900);
  // The surveyed opening keeps its measured provenance in the baseline.
  assert.equal(widened.unit.baseline.openings!.find(o => o.id === 'o2')!.clear_width!.status, before.baseline.openings![1].clear_width!.status);

  const flat = removeThreshold(widened.unit, 't1');
  assert.deepEqual(flat.unit.changes!.at(-1), { op: 'remove_threshold', target: 't1' });
  const floor = setFloor(flat.unit, 'r1', 'antislip');
  assert.deepEqual(floor.unit.changes!.at(-1), { op: 'change_finish', room: 'r1', floor: 'antislip' });
  assert.deepEqual(changeMarks(floor.unit), { added: [], modified: ['o2', 'r1'] });
});

test('walls: bearing walls stay, partitions can be demolished and restored, new walls are planned values', () => {
  assert.throws(() => demolishWall(unit(), 'w1'), /Kantavia/);
  const gone = demolishWall(unit(), 'w2');
  assert.ok(!apply(gone.unit.baseline, gone.unit.changes!).walls!.some(w => w.id === 'w2'));
  assert.ok(!apply(gone.unit.baseline, gone.unit.changes!).openings!.some(o => o.id === 'o2'));
  assert.throws(() => demolishWall(gone.unit, 'w2'), /ei ole tavoitetilassa/);
  assert.deepEqual(restoreWall(gone.unit, 'w2').unit, unit());
  assert.throws(() => restoreWall(unit(), 'w2'), /ei ole merkitty/);

  const added = addWall(gone.unit, { x: 0, y: 1200 }, { x: 2500, y: 1200 }, { thickness_mm: 100 });
  assert.equal(added.id, 'w-new-1');
  const wall = apply(added.unit.baseline, added.unit.changes!).walls!.find(w => w.id === added.id)!;
  assert.deepEqual(wall.thickness, planned(100, 'w-new-1/thickness'));
  assert.deepEqual(wall.a.x, planned(0, 'w-new-1/position'));
  assert.equal(wall.kind, 'partition');
  assert.deepEqual(changeMarks(added.unit).added, ['w-new-1']);
  assert.equal(addWall(added.unit, { x: 0, y: 1500 }, { x: 900, y: 1500 }, { thickness_mm: 100 }).id, 'w-new-2');
});

test('fixtures, reverting and invalid plans', () => {
  const bar = addFixture(unit(), { kind: 'grab_bar', x: 300, y: 300, width: 600, depth: 80 });
  assert.equal(bar.id, 'f-new-1');
  const swapped = replaceFixture(bar.unit, 'f1', { kind: 'wc', x: 800, y: 400, width: 400, depth: 700, height: 460 });
  const wc = apply(swapped.unit.baseline, swapped.unit.changes!).fixtures!.find(f => f.id === 'f1')!;
  assert.deepEqual(wc.height, planned(460, 'f1/height'));
  assert.deepEqual(changeMarks(swapped.unit), { added: ['f-new-1'], modified: ['f1'] });
  assert.deepEqual(revertChange(swapped.unit, 1).unit, bar.unit);

  assert.throws(() => modifyOpening(unit(), 'o2', { clear_width: 1000 }), /hylättiin/); // wider than the frame opening
  assert.throws(() => modifyOpening(unit(), 'o2', { width: 3000 }), /hylättiin/); // outside the host wall
  assert.throws(() => modifyOpening(unit(), 'o2', {}), /uusi mitta/);
  assert.throws(() => removeThreshold(unit(), 'nope'), /ei ole tavoitetilassa/);
  // Removing the wall also removes its opening, so a later edit on it is no longer valid.
  const gone = demolishWall(modifyOpening(unit(), 'o2', { clear_width: 700 }).unit, 'w2');
  assert.throws(() => modifyOpening(gone.unit, 'o2', { clear_width: 600 }), /ei ole tavoitetilassa/);
  assert.throws(() => revertChange(unit(), 0), /ei löydy/);
});

test('moving fixtures keeps one planned change per fixture', () => {
  const original = unit();
  const once = moveFixture(original, 'f1', { x: 700, y: 2500 });
  assert.equal(once.unit.changes!.length, 1);
  const replaced = once.unit.changes![0] as any;
  assert.equal(replaced.op, 'replace_fixture');
  assert.deepEqual(replaced.fixture.x, planned(700, 'f1/position'));
  // Size and kind stay as surveyed; only the pose becomes a plan.
  assert.deepEqual(replaced.fixture.width, original.baseline.fixtures![0].width);
  const twice = moveFixture(once.unit, 'f1', { x: 900, y: 2400, rotation_deg: -90 });
  assert.equal(twice.unit.changes!.length, 1);
  const f1 = apply(twice.unit.baseline, twice.unit.changes!).fixtures!.find(f => f.id === 'f1')!;
  assert.deepEqual([f1.x.value_mm, f1.y.value_mm, f1.rotation_deg], [900, 2400, 270]);
  assert.deepEqual(twice.unit.baseline, original.baseline);

  const bar = addFixture(original, { kind: 'grab_bar', x: 300, y: 300, width: 600, depth: 80 });
  const moved = moveFixture(bar.unit, bar.id, { x: 1000, y: 300 });
  assert.equal(moved.unit.changes!.length, 1);
  assert.equal((moved.unit.changes![0] as any).op, 'add_fixture');
  assert.deepEqual((moved.unit.changes![0] as any).fixture.x, planned(1000, 'f-new-1/position'));
  assert.throws(() => moveFixture(original, 'nope', { x: 0, y: 0 }), /ei ole tavoitetilassa/);
});
