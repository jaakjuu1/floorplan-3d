import { parseUnit } from '../io/unit';
import { apply } from './apply';
import type { Changes, Fixture, Measurement, Opening, UnitInputs, Wall } from './unit-input-v1';
import { UNIT_V2_OPS } from './validate';

type Change = Changes[number];
type XY = { x: number; y: number };
export interface Edited { unit: UnitInputs; id: string }

/** A planned value is never a field measurement (§5.6). */
export function designed(value: number, what: string): Measurement {
  return { value_mm: Math.round(value) || 0, status: 'assumed', method: 'assumption', source_refs: [`design:${what}`], confidence_mm: null };
}

export function nextId(unit: UnitInputs, prefix: string): string {
  const b = unit.baseline, used = new Set([b.walls, b.openings, b.rooms, b.fixtures, b.thresholds, b.measurements]
    .flatMap(items => (items ?? []).map(item => item.id)));
  for (const c of unit.changes ?? []) {
    if (c.op === 'add_wall') used.add(c.wall.id);
    if (c.op === 'add_fixture') used.add(c.fixture.id);
    if (c.op === 'add_opening') used.add(c.opening.id);
  }
  let n = 1;
  while (used.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/** Validate a detached candidate, including the ordered change layer, before the editor commits it. */
export function accept(unit: UnitInputs, id: string, label = 'Muutos'): Edited {
  try {
    const checked = parseUnit(unit);
    apply(checked.baseline, checked.changes ?? []);
    return { unit: checked, id };
  } catch (error) {
    throw new Error(`${label} hylättiin: ${(error as Error).message}`);
  }
}

/** Target state (survey + changes) with full measurement provenance. */
export const targetState = (unit: UnitInputs) => apply(unit.baseline, unit.changes ?? []);
const target = targetState;
// The first unit-v2 operation upgrades the file version; plans without them stay unit-v1.
function withChange(unit: UnitInputs, change: Change, id: string): Edited {
  const next = structuredClone(unit);
  next.changes = [...(next.changes ?? []), change];
  if (UNIT_V2_OPS.has(change.op)) next.schema_version = 'unit-v2';
  return accept(next, id);
}
const changeId = (c: Change): string => 'target' in c ? c.target : c.op === 'add_wall' ? c.wall.id
  : c.op === 'add_fixture' ? c.fixture.id : c.op === 'add_opening' ? c.opening.id : c.room;
function find<T extends { id: string }>(items: T[] | undefined, id: string, what: string): T {
  const item = items?.find(item => item.id === id);
  if (!item) throw new Error(`${what} ${id} ei ole tavoitetilassa`);
  return item;
}

/** A person makes the final call: bearing, external and party walls can be demolished; the rules flag them. */
export function demolishWall(unit: UnitInputs, id: string): Edited {
  find(target(unit).walls, id, 'Seinää');
  return withChange(unit, { op: 'demolish_wall', target: id }, id);
}

/** Drop one change; the remaining order must still apply. */
export function revertChange(unit: UnitInputs, index: number): Edited {
  const change = unit.changes?.[index];
  if (!change) throw new Error('Muutosta ei löydy');
  const next = structuredClone(unit);
  next.changes = next.changes!.filter((_, i) => i !== index);
  return accept(next, changeId(change), 'Muutoksen peruminen');
}

export function restoreWall(unit: UnitInputs, id: string): Edited {
  let index = -1;
  (unit.changes ?? []).forEach((c, i) => { if (c.op === 'demolish_wall' && c.target === id) index = i; });
  if (index < 0) throw new Error(`Seinää ${id} ei ole merkitty purettavaksi`);
  return revertChange(unit, index);
}

export function addWall(unit: UnitInputs, a: XY, b: XY, options: { thickness_mm: number; kind?: Exclude<Wall['kind'], 'load_bearing'> }): Edited {
  const id = nextId(unit, 'w-new'), point = (p: XY) => ({ x: designed(p.x, `${id}/position`), y: designed(p.y, `${id}/position`) });
  return withChange(unit, { op: 'add_wall', wall: { id, a: point(a), b: point(b),
    thickness: designed(options.thickness_mm, `${id}/thickness`), kind: options.kind ?? 'partition' } }, id);
}

export function modifyOpening(unit: UnitInputs, id: string,
  set: { width?: number; clear_width?: number; swing?: 'left' | 'right' | 'double' | 'slide' }): Edited {
  find(target(unit).openings, id, 'Aukkoa');
  const values: Record<string, unknown> = {};
  for (const key of ['width', 'clear_width'] as const) if (set[key] != null) values[key] = designed(set[key]!, `${id}/${key}`);
  if (set.swing) values.swing = set.swing;
  if (!Object.keys(values).length) throw new Error('Anna aukolle uusi mitta');
  return withChange(unit, { op: 'modify_opening', target: id, set: values }, id);
}

export function removeThreshold(unit: UnitInputs, id: string): Edited {
  find(target(unit).thresholds, id, 'Kynnystä');
  return withChange(unit, { op: 'remove_threshold', target: id }, id);
}

export function setFloor(unit: UnitInputs, roomId: string, floor: string): Edited {
  find(target(unit).rooms, roomId, 'Huonetta');
  return withChange(unit, { op: 'change_finish', room: roomId, floor }, roomId);
}

export interface PlannedFixture {
  kind: Fixture['kind']; x: number; y: number; width: number; depth: number; rotation_deg?: number; height?: number;
}
function fixtureData(f: PlannedFixture, id: string) {
  return { kind: f.kind, x: designed(f.x, `${id}/position`), y: designed(f.y, `${id}/position`),
    width: designed(f.width, `${id}/size`), depth: designed(f.depth, `${id}/size`), rotation_deg: f.rotation_deg ?? 0,
    ...(f.height != null ? { height: designed(f.height, `${id}/height`) } : {}) };
}

export function addFixture(unit: UnitInputs, fixture: PlannedFixture): Edited {
  const id = nextId(unit, 'f-new');
  return withChange(unit, { op: 'add_fixture', fixture: { id, ...fixtureData(fixture, id) } }, id);
}

export function replaceFixture(unit: UnitInputs, id: string, fixture: PlannedFixture): Edited {
  find(target(unit).fixtures, id, 'Kiintokalustetta');
  return withChange(unit, { op: 'replace_fixture', target: id, fixture: fixtureData(fixture, id) }, id);
}

export interface PlannedOpening {
  kind: Opening['kind']; along_wall: number; width: number; clear_width?: number; height?: number; sill_z?: number;
  swing?: Opening['swing'];
}
function openingData(o: PlannedOpening, id: string) {
  const v = (value: number, key: string) => designed(value, `${id}/${key}`);
  return { along_wall: v(o.along_wall, 'along_wall'), width: v(o.width, 'width'),
    ...(o.clear_width != null ? { clear_width: v(o.clear_width, 'clear_width') } : {}),
    ...(o.height != null ? { height: v(o.height, 'height') } : {}),
    ...(o.sill_z != null ? { sill_z: v(o.sill_z, 'sill_z') } : {}),
    ...(o.swing ? { swing: o.swing } : {}) };
}

/** unit-v2: a planned door, window or opening in a wall of the target state (existing or added). */
export function addOpening(unit: UnitInputs, wallId: string, opening: PlannedOpening): Edited {
  find(target(unit).walls, wallId, 'Seinää');
  const id = nextId(unit, 'o-new');
  return withChange(unit, { op: 'add_opening', opening: { id, kind: opening.kind, host_wall: wallId, ...openingData(opening, id) } }, id);
}

/** unit-v2: close an opening (its thresholds go too); a planned one is simply taken back. */
export function removeOpening(unit: UnitInputs, id: string): Edited {
  find(target(unit).openings, id, 'Aukkoa');
  const index = (unit.changes ?? []).findIndex(c => c.op === 'add_opening' && c.opening.id === id);
  if (index >= 0) return revertChange(unit, index);
  return withChange(unit, { op: 'remove_opening', target: id }, id);
}

/** unit-v2: remove a fixture; a planned one is simply taken back. */
export function removeFixture(unit: UnitInputs, id: string): Edited {
  find(target(unit).fixtures, id, 'Kiintokalustetta');
  const index = (unit.changes ?? []).findIndex(c => c.op === 'add_fixture' && c.fixture.id === id);
  if (index >= 0) return revertChange(unit, index);
  return withChange(unit, { op: 'remove_fixture', target: id }, id);
}

/** Slide an opening along its wall: a planned opening keeps its add_opening, an existing one gets one modify_opening. */
export function moveOpening(unit: UnitInputs, id: string, along: number): Edited {
  find(target(unit).openings, id, 'Aukkoa');
  const next = structuredClone(unit), changes = next.changes ?? [], value = designed(along, `${id}/along_wall`);
  const added = changes.find(c => c.op === 'add_opening' && c.opening.id === id) as Extract<Change, { op: 'add_opening' }> | undefined;
  if (added) { added.opening.along_wall = value; return accept(next, id); }
  const last = changes.length ? changes[changes.length - 1] : undefined;
  if (last?.op === 'modify_opening' && last.target === id && Object.keys(last.set).every(k => k === 'along_wall')) {
    last.set.along_wall = value; return accept(next, id);
  }
  return withChange(unit, { op: 'modify_opening', target: id, set: { along_wall: value } }, id);
}

/** Move or turn a fixture. Repeated moves update the fixture's own planned change instead of piling up:
 *  an added fixture keeps its add_fixture, a surveyed one gets (or reuses) one replace_fixture. */
export function moveFixture(unit: UnitInputs, id: string, pose: { x: number; y: number; rotation_deg?: number }): Edited {
  const current = find(target(unit).fixtures, id, 'Kiintokalustetta');
  const rotation = (((pose.rotation_deg ?? current.rotation_deg ?? 0) % 360) + 360) % 360;
  const position = { x: designed(pose.x, `${id}/position`), y: designed(pose.y, `${id}/position`), rotation_deg: rotation };
  const next = structuredClone(unit), changes = next.changes ?? [];
  let index = -1;
  changes.forEach((c, i) => { if ((c.op === 'add_fixture' && c.fixture.id === id) || (c.op === 'replace_fixture' && c.target === id)) index = i; });
  if (index >= 0) {
    Object.assign((changes[index] as Extract<Change, { fixture: unknown }>).fixture, position);
    next.changes = changes;
    return accept(next, id);
  }
  const { id: _id, ...data } = current;
  next.changes = [...changes, { op: 'replace_fixture', target: id, fixture: { ...data, ...position } }];
  return accept(next, id);
}

/** Survey correction: remove an element traced from the drawing (w-/o-/r-trace-*) from the baseline,
 *  with the openings, thresholds and raw measurements that depend on it. Field-surveyed elements stay. */
export function removeTraced(unit: UnitInputs, id: string): Edited {
  const kind = /^w-trace-/.test(id) ? 'walls' : /^o-trace-/.test(id) ? 'openings' : /^r-trace-/.test(id) ? 'rooms' : null;
  if (!kind || !unit.baseline[kind]?.some(item => item.id === id)) throw new Error('Vain pohjakuvasta jäljennetyn elementin voi poistaa nykytilasta');
  const next = structuredClone(unit), b = next.baseline, removed = new Set([id]);
  if (kind === 'walls') (b.openings ?? []).filter(o => o.host_wall === id).forEach(o => removed.add(o.id));
  (b.thresholds ?? []).filter(t => (t.at_opening && removed.has(t.at_opening)) || t.between_rooms?.some(r => removed.has(r))).forEach(t => removed.add(t.id));
  for (const key of ['walls', 'openings', 'rooms', 'thresholds'] as const) if (b[key]) (b[key] as { id: string }[]) = b[key]!.filter(x => !removed.has(x.id));
  if (b.measurements) b.measurements = b.measurements.filter(m => !removed.has(m.from) && !removed.has(m.to));
  return accept(next, id, 'Jäljennöksen poisto');
}

/** Turn a rule profile on or off; profiles are unit metadata, not part of the change layer. */
export function setProfile(unit: UnitInputs, profile: string, on: boolean): Edited {
  const next = structuredClone(unit), profiles = new Set(next.profiles ?? []);
  if (on) profiles.add(profile); else profiles.delete(profile);
  next.profiles = [...profiles];
  return accept(next, profile);
}

/** Override (or with null, reset) one project dimension parameter; unit.user holds numbers only, never health data. */
export function setUserValue(unit: UnitInputs, key: string, value: number | null): Edited {
  if (value != null && !(Number.isFinite(value) && value > 0)) throw new Error('Anna positiivinen millimetriarvo');
  const next = structuredClone(unit), user = { ...(next.user ?? {}) };
  if (value == null) delete user[key]; else user[key] = Math.round(value);
  next.user = user;
  return accept(next, key);
}

/** Change-drawing classes: new elements in red, changed ones highlighted (§5.6). */
export function changeMarks(unit: UnitInputs): { added: string[]; modified: string[]; removed: string[] } {
  const added = new Set<string>(), modified = new Set<string>(), removed = new Set<string>();
  for (const c of unit.changes ?? []) {
    if (c.op === 'add_wall') added.add(c.wall.id);
    else if (c.op === 'add_fixture') added.add(c.fixture.id);
    else if (c.op === 'add_opening') added.add(c.opening.id);
    else if (c.op === 'modify_opening' || c.op === 'replace_fixture') modified.add(c.target);
    else if (c.op === 'change_finish') modified.add(c.room);
    else if (c.op === 'remove_opening' || c.op === 'remove_fixture') removed.add(c.target);
  }
  return { added: [...added], modified: [...modified].filter(id => !added.has(id)), removed: [...removed] };
}
