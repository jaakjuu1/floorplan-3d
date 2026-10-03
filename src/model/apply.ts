import type { Baseline, Changes } from './unit-input-v1';
import { validateBaseline, validateChanges } from './validate';

const collections = ['walls', 'openings', 'rooms', 'fixtures', 'thresholds', 'measurements'] as const;

function normalized(input: Baseline): Required<Baseline> {
  const baseline = structuredClone(validateBaseline(input));
  for (const key of collections) baseline[key] ??= [];
  return baseline as Required<Baseline>;
}

function target<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find(item => item.id === id);
  if (!item) throw new Error(`Unknown target: ${id}`);
  return item;
}

/** Ordered target-state projection. The survey baseline and operations stay unchanged. */
export function apply(baseline: Baseline, changes: Changes): Baseline {
  const current = normalized(baseline);
  const operations = structuredClone(validateChanges(changes)!);
  const newId = (id: string) => {
    if (collections.some(key => current[key].some(item => item.id === id))) throw new Error(`Duplicate id: ${id}`);
  };
  const removeMeasurements = (removed: Set<string>) => {
    current.measurements = current.measurements.filter(m => !removed.has(m.from) && !removed.has(m.to));
  };
  for (const change of operations) {
    switch (change.op) {
      case 'demolish_wall': {
        target(current.walls, change.target);
        const removed = new Set([change.target]);
        current.openings.filter(o => o.host_wall === change.target).forEach(o => removed.add(o.id));
        current.thresholds.filter(t => t.at_opening && removed.has(t.at_opening)).forEach(t => removed.add(t.id));
        current.walls = current.walls.filter(w => !removed.has(w.id));
        current.openings = current.openings.filter(o => !removed.has(o.id));
        current.thresholds = current.thresholds.filter(t => !removed.has(t.id));
        removeMeasurements(removed);
        break;
      }
      case 'add_wall':
        newId(change.wall.id);
        current.walls.push(change.wall);
        break;
      case 'modify_opening':
        Object.assign(target(current.openings, change.target), change.set);
        break;
      case 'remove_threshold':
        target(current.thresholds, change.target);
        current.thresholds = current.thresholds.filter(t => t.id !== change.target);
        removeMeasurements(new Set([change.target]));
        break;
      case 'add_fixture':
        newId(change.fixture.id);
        current.fixtures.push(change.fixture);
        break;
      case 'replace_fixture':
        target(current.fixtures, change.target);
        current.fixtures = current.fixtures.map(f => f.id === change.target ? { ...change.fixture, id: change.target } : f);
        break;
      case 'add_opening': {
        newId(change.opening.id);
        const start = change.opening.along_wall.value_mm, end = start + change.opening.width.value_mm;
        const other = current.openings.find(o => o.host_wall === change.opening.host_wall &&
          start < o.along_wall.value_mm + o.width.value_mm && o.along_wall.value_mm < end);
        if (other) throw new Error(`add_opening: ${change.opening.id} overlaps ${other.id}`);
        current.openings.push(change.opening);
        break;
      }
      case 'remove_opening': {
        target(current.openings, change.target);
        const removed = new Set([change.target]);
        current.thresholds.filter(t => t.at_opening === change.target).forEach(t => removed.add(t.id));
        current.openings = current.openings.filter(o => o.id !== change.target);
        current.thresholds = current.thresholds.filter(t => !removed.has(t.id));
        removeMeasurements(removed);
        break;
      }
      case 'remove_fixture':
        target(current.fixtures, change.target);
        current.fixtures = current.fixtures.filter(f => f.id !== change.target);
        removeMeasurements(new Set([change.target]));
        break;
      case 'change_finish': {
        const room = target(current.rooms, change.room);
        if (change.floor != null) room.floor = change.floor;
        if (change.walls != null) room.walls = change.walls;
        break;
      }
    }
  }
  return normalized(current);
}
