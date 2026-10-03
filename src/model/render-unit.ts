import { toScreenAngle, toScreenPoint, toScreenVector } from '../io/unit';
import { apply } from './apply';
import type { Opening, UnitInputs, Wall } from './unit-input-v1';
import { demoLowWallIds, demoOpeningPresentation, demoRoomPresentation } from './demo-presentation';

export type ScreenPoint = [number, number];
export interface ProjectedWallSegment { a: ScreenPoint; b: ScreenPoint; polygon: ScreenPoint[] }
export interface ProjectedRoom {
  id: string; name: string; poly: ScreenPoint[]; mat?: string; at?: ScreenPoint; counted?: boolean;
}
export interface ProjectedWall {
  id: string; a: ScreenPoint; b: ScreenPoint; thickness: number; kind: Wall['kind'];
  polygon: ScreenPoint[]; segments: ProjectedWallSegment[]; height?: number;
}
export interface ProjectedOpening {
  id: string; host_wall: string; kind: Opening['kind']; a: ScreenPoint; b: ScreenPoint;
  polygon: ScreenPoint[]; thickness: number; width: number; height?: number; sill?: number;
  swing?: Opening['swing']; h?: ScreenPoint; c?: ScreenPoint; o?: ScreenPoint; entry?: boolean; name?: string;
}
export interface ProjectedFixture {
  id: string; kind: string; x: number; y: number; width: number; depth: number;
  rotation_deg: number; height?: number;
}
export interface ProjectedUnit {
  rooms: ProjectedRoom[]; walls: ProjectedWall[]; openings: ProjectedOpening[];
  fixtures: ProjectedFixture[]; demolishedWalls: ProjectedWall[];
  /** Survey elements a change removes (shown yellow); openings only while their wall stays. */
  removedOpenings: ProjectedOpening[]; removedFixtures: ProjectedFixture[];
  bounds: { x: number; y: number; w: number; h: number };
}

const point = (p: { x: { value_mm: number }; y: { value_mm: number } }): ScreenPoint => {
  const screen = toScreenPoint(p as Parameters<typeof toScreenPoint>[0]);
  return [screen.x, screen.y === 0 ? 0 : screen.y];
};
const measurementPoint = (x: number, y: number): ScreenPoint => {
  const screen = toScreenVector({ x, y });
  return [screen.x, screen.y];
};
const vector = (x: number, y: number): ScreenPoint => [x === 0 ? 0 : x, y === 0 ? 0 : y];

function quad(a: ScreenPoint, b: ScreenPoint, thickness: number): ScreenPoint[] {
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
  if (!length) throw new Error('Wall endpoints must differ');
  const nx = -dy / length * thickness / 2, ny = dx / length * thickness / 2;
  return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny],
    [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
}

function projectWall(wall: Wall, openings: Opening[], isDemo: boolean): ProjectedWall {
  const a = point(wall.a), b = point(wall.b), thickness = wall.thickness.value_mm;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const cuts = openings.filter(o => o.host_wall === wall.id)
    .map(o => [o.along_wall.value_mm, o.along_wall.value_mm + o.width.value_mm] as const)
    .sort((x, y) => x[0] - y[0]);
  let cursor = 0;
  const intervals: [number, number][] = [];
  for (const [start, end] of cuts) {
    if (start > cursor) intervals.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < length) intervals.push([cursor, length]);
  const segment = (start: number, end: number): ProjectedWallSegment => {
    const from: ScreenPoint = [a[0] + (b[0] - a[0]) * start / length, a[1] + (b[1] - a[1]) * start / length];
    const to: ScreenPoint = [a[0] + (b[0] - a[0]) * end / length, a[1] + (b[1] - a[1]) * end / length];
    return { a: from, b: to, polygon: quad(from, to, thickness) };
  };
  return {
    id: wall.id, a, b, thickness, kind: wall.kind, polygon: quad(a, b, thickness),
    segments: intervals.map(([start, end]) => segment(start, end)),
    ...(isDemo && demoLowWallIds.has(wall.id) ? { height: 1000 } : {}),
  };
}

function projectOpening(opening: Opening, wallById: Map<string, Wall>, isDemo: boolean): ProjectedOpening {
  const wall = wallById.get(opening.host_wall);
  if (!wall) throw new Error(`Unknown host_wall: ${opening.host_wall}`);
  const a = point(wall.a), b = point(wall.b), length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const start = opening.along_wall.value_mm, end = start + opening.width.value_mm;
  const at = (distance: number): ScreenPoint => [a[0] + (b[0] - a[0]) * distance / length, a[1] + (b[1] - a[1]) * distance / length];
  const from = at(start), to = at(end), presentation = isDemo ? demoOpeningPresentation[opening.id] : undefined;
  const ux = (b[0] - a[0]) / length, uy = (b[1] - a[1]) / length;
  const nx = -uy, ny = ux;
  const door = opening.kind === 'door';
  const hingeAt = presentation?.hinge === 'end' ? to : from;
  const hingeSide = presentation?.hingeSide ?? 1;
  const closeAlong = presentation?.closeAlong ?? 1;
  const openNormal = opening.swing === 'left' ? 1 : opening.swing === 'right' ? -1 : presentation?.openNormal ?? 1;
  return {
    id: opening.id, host_wall: opening.host_wall, kind: opening.kind, a: from, b: to,
    polygon: quad(from, to, wall.thickness.value_mm), thickness: wall.thickness.value_mm,
    width: opening.width.value_mm,
    ...(opening.height ? { height: opening.height.value_mm } : {}),
    ...(opening.sill_z ? { sill: opening.sill_z.value_mm } : {}),
    ...(opening.swing ? { swing: opening.swing } : {}),
    ...(door ? { h: [hingeAt[0] + nx * hingeSide * wall.thickness.value_mm / 2,
      hingeAt[1] + ny * hingeSide * wall.thickness.value_mm / 2] as ScreenPoint } : {}),
    ...(door ? { c: vector(ux * closeAlong, uy * closeAlong) } : {}),
    ...(door ? { o: vector(nx * openNormal, ny * openNormal) } : {}),
    ...(presentation?.entry ? { entry: true } : {}),
    ...(presentation?.name ? { name: presentation.name } : {}),
  };
}

function boundsOf(polygons: ScreenPoint[][]): ProjectedUnit['bounds'] {
  const points = polygons.flat();
  if (!points.length) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Project the apply target state to display millimetres without changing the source unit. */
export function projectUnit(unit: UnitInputs): ProjectedUnit {
  const isDemo = unit.project.id === 'demo-unit' && unit.survey.data_origin === 'regression_baseline';
  const baseline = unit.baseline;
  const target = apply(baseline, unit.changes ?? []);
  const sourceWalls = baseline.walls ?? [], sourceOpenings = baseline.openings ?? [];
  const targetWalls = target.walls ?? [], targetOpenings = target.openings ?? [];
  const targetWallIds = new Set(targetWalls.map(w => w.id));
  const walls = targetWalls.map(w => projectWall(w, targetOpenings, isDemo));
  const originalDeleted = sourceWalls.filter(w => !targetWallIds.has(w.id));
  const demolishedWalls = originalDeleted.map(w => projectWall(w, sourceOpenings.filter(o => o.host_wall === w.id), isDemo));
  const wallById = new Map(targetWalls.map(w => [w.id, w]));
  const rooms = (target.rooms ?? []).map(room => {
    const poly = room.polygon.map(point);
    const presentation = isDemo ? demoRoomPresentation[room.id] : undefined;
    const center = poly.slice(0, -1).reduce((sum, p) => [sum[0] + p[0] / (poly.length - 1), sum[1] + p[1] / (poly.length - 1)] as ScreenPoint, [0, 0]);
    return { id: room.id, name: room.name, poly, ...(room.floor ? { mat: room.floor } : {}),
      ...(presentation ? presentation.at ? { at: measurementPoint(...presentation.at) } : {} : { at: center }),
      ...(presentation?.counted === false ? { counted: false } : {}) };
  });
  const openings = targetOpenings.map(o => projectOpening(o, wallById, isDemo));
  const projectFixture = (f: NonNullable<typeof target.fixtures>[number]): ProjectedFixture => {
    const [x, y] = measurementPoint(f.x.value_mm, f.y.value_mm);
    return { id: f.id, kind: f.kind, x, y,
    width: f.width.value_mm, depth: f.depth.value_mm, rotation_deg: toScreenAngle(f.rotation_deg ?? 0),
    ...(f.height ? { height: f.height.value_mm } : {}),
  }; };
  const fixtures = (target.fixtures ?? []).map(projectFixture);
  const targetOpeningIds = new Set(targetOpenings.map(o => o.id)), targetFixtureIds = new Set((target.fixtures ?? []).map(f => f.id));
  const removedOpenings = sourceOpenings.filter(o => !targetOpeningIds.has(o.id) && wallById.has(o.host_wall))
    .map(o => projectOpening(o, wallById, isDemo));
  const removedFixtures = (baseline.fixtures ?? []).filter(f => !targetFixtureIds.has(f.id)).map(projectFixture);
  return { rooms, walls, openings, fixtures, demolishedWalls, removedOpenings, removedFixtures,
    bounds: boundsOf([...rooms.map(r => r.poly), ...walls.flatMap(w => [w.polygon]), ...openings.map(o => o.polygon)]) };
}
