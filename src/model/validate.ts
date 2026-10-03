import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import schema from '../../schemas/unit-input-v1.schema.json';
import type { Baseline, UnitInputs, Point2D } from './unit-input-v1';

const ajv = new Ajv2020({ allErrors: true, strict: false, strictNumbers: true });
addFormats(ajv);
ajv.addSchema(schema, 'unit');
const unitSchema = ajv.getSchema('unit')!;
const baselineSchema = ajv.compile({ $ref: 'unit#/$defs/Baseline' });
const changesSchema = ajv.compile({ $defs: schema.$defs, type: 'array', items: schema.properties.changes.items });

function requireValid(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// JSON Schema covers shape; these are the Pydantic model's relational validators.
function provenance(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (typeof record.value_mm === 'number' && typeof record.status === 'string') {
    requireValid((record.source_refs as string[]).every(ref => ref.trim()), 'Blank measurement source');
    requireValid(record.status !== 'measured' || ['laser', 'tape', 'derived'].includes(record.method as string),
      'Measured value needs a field measurement or derivation');
  }
  Object.values(record).forEach(provenance);
}

const xy = (p: Point2D) => [p.x.value_mm, p.y.value_mm] as const;
const samePoint = (a: Point2D, b: Point2D) => a.x.value_mm === b.x.value_mm && a.y.value_mm === b.y.value_mm;

function selfIntersects(points: (readonly [number, number])[]): boolean {
  type Point = readonly [number, number];
  const orient = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const onSegment = (a: Point, b: Point, p: Point) => Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    for (let j = i + 1; j < points.length; j++) {
      if (j === (i + 1) % points.length || (j + 1) % points.length === i) continue;
      const c = points[j], d = points[(j + 1) % points.length];
      const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
      if ((o1 === 0 && onSegment(a, b, c)) || (o2 === 0 && onSegment(a, b, d)) ||
        (o3 === 0 && onSegment(c, d, a)) || (o4 === 0 && onSegment(c, d, b)) ||
        ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0))) return true;
    }
  }
  return false;
}

export function validateBaseline(input: unknown): Baseline {
  requireValid(baselineSchema(input), ajv.errorsText(baselineSchema.errors));
  const b = input as Baseline;
  provenance(b);
  const walls = b.walls ?? [], rooms = b.rooms ?? [], openings = b.openings ?? [];
  const fixtures = b.fixtures ?? [], thresholds = b.thresholds ?? [], measurements = b.measurements ?? [];
  const elements = [...walls, ...openings, ...rooms, ...fixtures, ...thresholds];
  const ids = [...elements, ...measurements].map(item => item.id);
  requireValid(new Set(ids).size === ids.length, 'Duplicate baseline id');
  for (const wall of walls) {
    requireValid(!samePoint(wall.a, wall.b) && wall.thickness.value_mm > 0, 'Invalid wall geometry');
    requireValid((wall.source_refs ?? []).every(ref => ref.trim()), 'Blank wall source');
    requireValid(wall.kind !== 'load_bearing' || (wall.source_refs ?? []).some(ref =>
      ref.trim() && !['assumption', 'assumed'].includes(ref.trim().toLowerCase()) && !ref.trim().toLowerCase().startsWith('assumption:')),
    'Load-bearing wall needs evidence');
  }
  for (const opening of openings) {
    const host = walls.find(wall => wall.id === opening.host_wall);
    requireValid(host, `Unknown host_wall: ${opening.host_wall}`);
    requireValid(opening.width.value_mm > 0 && opening.along_wall.value_mm >= 0, 'Invalid opening dimensions');
    requireValid(!opening.clear_width || (opening.clear_width.value_mm > 0 &&
      opening.clear_width.value_mm <= opening.width.value_mm), 'Invalid clear_width');
    requireValid(!opening.height || opening.height.value_mm > 0, 'Invalid opening height');
    requireValid(opening.along_wall.value_mm + opening.width.value_mm <=
      Math.hypot(host.b.x.value_mm - host.a.x.value_mm, host.b.y.value_mm - host.a.y.value_mm), 'Opening outside host wall');
  }
  for (const room of rooms) {
    requireValid(samePoint(room.polygon[0], room.polygon.at(-1)!), 'Unclosed polygon');
    const points = room.polygon.map(xy);
    requireValid(new Set(points.slice(0, -1).map(p => JSON.stringify(p))).size >= 3, 'Too few distinct polygon points');
    const area = points.slice(0, -1).reduce((sum, p, i) => sum + p[0] * points[i + 1][1] - points[i + 1][0] * p[1], 0);
    requireValid(area !== 0, 'Zero-area polygon');
    requireValid(!selfIntersects(points.slice(0, -1)), 'Self-intersecting polygon');
  }
  for (const fixture of fixtures) {
    requireValid(fixture.width.value_mm > 0 && fixture.depth.value_mm > 0 &&
      (!fixture.height || fixture.height.value_mm > 0), 'Invalid fixture dimensions');
  }
  for (const threshold of thresholds) {
    requireValid((threshold.at_opening != null) !== (threshold.between_rooms != null), 'Threshold needs exactly one host');
    requireValid(threshold.height.value_mm >= 0, 'Invalid threshold height');
    requireValid(threshold.height.status !== 'measured' || ['tape', 'derived'].includes(threshold.height.method),
      'Measured threshold height needs tape or derivation');
    if (threshold.at_opening != null) {
      requireValid(openings.some(o => o.id === threshold.at_opening), 'Unknown threshold opening');
    } else {
      const pair = threshold.between_rooms!;
      requireValid(pair[0] !== pair[1] && pair.every(id => id.trim() && rooms.some(r => r.id === id)), 'Invalid threshold room pair');
    }
  }
  for (const measurement of measurements) {
    requireValid(elements.some(e => e.id === measurement.from) && elements.some(e => e.id === measurement.to), 'Unknown raw measurement reference');
  }
  return b;
}

export function validateChanges(input: unknown): UnitInputs['changes'] {
  requireValid(changesSchema(input), ajv.errorsText(changesSchema.errors));
  const changes = input as NonNullable<UnitInputs['changes']>;
  provenance(changes);
  for (const change of changes) {
    if (change.op === 'modify_opening') requireValid(Object.keys(change.set).length, 'Empty opening change');
    if (change.op === 'change_finish') requireValid(change.floor != null || change.walls != null, 'Empty finish change');
    if (change.op === 'add_wall') validateBaseline({ walls: [change.wall] });
    if (change.op === 'add_fixture') validateBaseline({ fixtures: [change.fixture] });
    if (change.op === 'replace_fixture') validateBaseline({ fixtures: [{ ...change.fixture, id: change.target }] });
  }
  return changes;
}

export function validateUnit(input: unknown): UnitInputs {
  requireValid(unitSchema(input), ajv.errorsText(unitSchema.errors));
  const unit = input as UnitInputs;
  validateBaseline(unit.baseline);
  validateChanges(unit.changes ?? []);
  return unit;
}
