import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { apply } from '../src/model/apply';
import { parseUnit, readUnit, writeUnit, toScreenPoint, fromScreenPoint } from '../src/io/unit';

for (const kind of ['unit', 'apply']) {
  const directory = new URL(`../fixtures/${kind}/`, import.meta.url);
  const files = readdirSync(directory).filter(name => name.endsWith('.json')).sort();
  assert.ok(files.length > 0, `Missing shared ${kind} fixtures`);
  for (const file of files) {
    test(`${kind}: ${file}`, () => {
      const fixture = JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
      const before = structuredClone(fixture);
      if (kind === 'unit') {
        if (fixture.valid) {
          const unit = parseUnit(fixture.input);
          if (fixture.expected) assert.deepEqual(unit, fixture.expected);
          assert.deepEqual(readUnit(writeUnit(unit)), unit);
        } else assert.throws(() => parseUnit(fixture.input));
      } else if (fixture.error) {
        assert.throws(() => apply(fixture.baseline, fixture.changes));
      } else {
        const result = apply(fixture.baseline, fixture.changes);
        assert.deepEqual(result, fixture.expected);
        // Returned nested objects must not retain aliases to the input.
        if (result.walls?.length) result.walls[0].a.x.value_mm += 1;
      }
      assert.deepEqual(fixture, before, 'Input was mutated');
    });
  }
}

test('example roundtrip preserves measurement provenance and screen axes', () => {
  const unit = readUnit(readFileSync(new URL('../examples/accessibility-unit.json', import.meta.url), 'utf8'));
  assert.deepEqual(readUnit(writeUnit(unit)), unit);
  const point = unit.baseline.walls![0].b;
  assert.deepEqual(fromScreenPoint(toScreenPoint(point)), { x: point.x.value_mm, y: point.y.value_mm });
  assert.equal(toScreenPoint(point).y, -point.y.value_mm);
});

test('non-JSON numbers and malformed JSON are rejected', () => {
  const data = JSON.parse(readFileSync(new URL('../examples/accessibility-unit.json', import.meta.url), 'utf8'));
  for (const value of [NaN, Infinity, -Infinity]) {
    data.baseline.walls[0].thickness.value_mm = value;
    assert.throws(() => parseUnit(data));
  }
  assert.throws(() => readUnit('{'));
});
