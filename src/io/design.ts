import { apply } from '../model/apply';
import type { UnitInputs } from '../model/unit-input-v1';
import { parseUnit } from './unit';
import { validateBackground, type Background } from './background';

export const DEFAULT_STORE = 'kodin-design-v2';
export const LEGACY_STORE = 'huxing-design-v1';
const materials = new Set(['wood', 'walnut', 'tile800', 'tile600', 'marble', 'antislip', 'terrazzo', 'carpet']);

export interface EditorFurniture {
  id: string;
  type: string;
  name: string;
  cx: number;
  cy: number;
  w: number;
  d: number;
  rot: number;
  color: string;
  [key: string]: unknown;
}
export interface Design {
  schema_version: 'kodin-design-v2';
  unit: UnitInputs;
  furniture: EditorFurniture[];
  rooms: Record<string, { name: string; mat: string }>;
  measures: { a: { x: number; y: number }; b: { x: number; y: number } }[];
  /** Exact old JSON payload, including fields the editor does not understand. */
  legacy?: unknown;
  /** Local source drawing only; never changes the canonical unit. */
  background?: Background | null;
}
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
type RecordValue = Record<string, unknown>;

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function record(value: unknown): RecordValue {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected an object');
  return value as RecordValue;
}
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function validateEditor(value: RecordValue): void {
  requireValue(Array.isArray(value.furniture), 'Missing furniture list');
  const ids = new Set<string>();
  for (const item of value.furniture) {
    const f = record(item);
    requireValue(text(f.id) && !ids.has(f.id), 'Invalid or duplicate furniture id');
    ids.add(f.id);
    requireValue(text(f.type) && text(f.name), 'Invalid furniture type or name');
    requireValue(['cx', 'cy', 'w', 'd', 'rot'].every(key => finite(f[key])), 'Invalid furniture dimensions');
    requireValue((f.w as number) > 0 && (f.d as number) > 0, 'Furniture dimensions must be positive');
    requireValue(typeof f.color === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(f.color), 'Invalid furniture color');
  }
  for (const room of Object.values(record(value.rooms))) {
    const r = record(room);
    requireValue(text(r.name) && typeof r.mat === 'string' && materials.has(r.mat), 'Invalid room name or material');
  }
  requireValue(Array.isArray(value.measures), 'Missing measures list');
  for (const measurement of value.measures) {
    const m = record(measurement);
    for (const key of ['a', 'b']) {
      const p = record(m[key]);
      requireValue(finite(p.x) && finite(p.y), 'Invalid measure point');
    }
  }
}

function roomDefaults(unit: UnitInputs): Design['rooms'] {
  return Object.fromEntries((apply(unit.baseline, unit.changes ?? []).rooms ?? []).map(room =>
    [room.id, { name: room.name, mat: materials.has(room.floor ?? '') ? room.floor! : 'wood' }]));
}

/** Validate everything on a detached copy before the editor swaps its live state. */
export function parseDesign(input: unknown, defaults: Design): Design {
  const data = record(structuredClone(input));
  if (data.schema_version === 'unit-v1' || data.schema_version === 'unit-v2') {
    const unit = parseUnit(data);
    return { schema_version: DEFAULT_STORE, unit, furniture: [], rooms: roomDefaults(unit), measures: [] };
  }
  if (data.schema_version === DEFAULT_STORE) {
    const unit = parseUnit(data.unit);
    const rooms = roomDefaults(unit); // Also validates ordered changes with apply.
    validateEditor(data);
    if (Object.hasOwn(data, 'background')) validateBackground(data.background);
    requireValue(Object.keys(record(data.rooms)).every(id => Object.hasOwn(rooms, id)), 'Unknown editor room');
    for (const [id, room] of Object.entries(record(data.rooms))) {
      requireValue((room as Design['rooms'][string]).mat === rooms[id].mat, 'Room material differs from change layer');
    }
    return { ...data, schema_version: DEFAULT_STORE, unit, rooms: { ...rooms, ...record(data.rooms) } } as Design;
  }
  requireValue(data.schema_version === undefined, 'Unknown design version');
  // Old versions allowed missing rooms/measures/demolished. Preserve the exact input
  // separately; defaults fill only fields which were genuinely absent.
  const legacy = structuredClone(data);
  const old: RecordValue = { ...data, rooms: data.rooms === undefined ? {} : data.rooms,
    measures: data.measures === undefined ? [] : data.measures };
  validateEditor(old);
  const unit = parseUnit(defaults.unit);
  unit.changes = [];
  const demolished = data.demolished === undefined ? [] : data.demolished;
  requireValue(Array.isArray(demolished) && demolished.every(text), 'Invalid demolished list');
  requireValue(new Set(demolished).size === demolished.length, 'Duplicate demolished wall');
  for (const id of demolished) {
    requireValue(unit.baseline.walls?.some(wall => wall.id === id), `Unknown demolished wall: ${id}`);
    unit.changes.push({ op: 'demolish_wall', target: id });
  }
  const rooms = roomDefaults(unit);
  for (const [id, value] of Object.entries(record(old.rooms))) {
    requireValue(Object.hasOwn(rooms, id), `Unknown legacy room: ${id}`);
    const room = value as Design['rooms'][string];
    if (room.mat !== rooms[id].mat) unit.changes.push({ op: 'change_finish', room: id, floor: room.mat });
    rooms[id] = room;
  }
  apply(unit.baseline, unit.changes);
  return { schema_version: DEFAULT_STORE, unit, furniture: old.furniture as EditorFurniture[], rooms,
    measures: old.measures as Design['measures'], legacy };
}

/** Never delete or overwrite the original legacy key, even after successful migration. */
export function loadDesign(storage: StoragePort, defaults: Design): Design | null {
  const current = storage.getItem(DEFAULT_STORE);
  if (current !== null) {
    const data = record(JSON.parse(current));
    requireValue(data.schema_version === DEFAULT_STORE, 'Invalid saved design version');
    return parseDesign(data, defaults);
  }
  const legacy = storage.getItem(LEGACY_STORE);
  if (legacy === null) return null;
  const design = parseDesign(JSON.parse(legacy), defaults);
  saveDesign(storage, design);
  return design;
}

export function saveDesign(storage: StoragePort, design: Design): void {
  const checked = parseDesign(design, design);
  storage.setItem(DEFAULT_STORE, JSON.stringify(checked));
}
