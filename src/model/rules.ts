import rulesFile from '../../rules/rules-v1.json';
import { apply } from './apply';
import type { Baseline, Fixture, Opening, Room, UnitInputs, Wall } from './unit-input-v1';

/** Advisory findings only: nothing here blocks an edit. */
export type Severity = 'ilmoitus' | 'tarkista' | 'suositus' | 'info';
export interface Finding {
  rule: string; profile: string; severity: Severity; ok: boolean;
  element?: { kind: 'wall' | 'opening' | 'room' | 'fixture' | 'threshold'; id: string };
  /** The element (or the rule itself) is affected by the change layer. */
  touched: boolean;
  value?: number; limit?: number;
  title: { fi: string; en: string }; message: { fi: string; en: string };
  source: { label: string; url: string; section: string };
  circle?: { x: number; y: number; d: number }; // model mm, y up
}
type Rule = (typeof rulesFile.rules)[number] & { params?: Record<string, unknown> };
export type ParameterKey = keyof typeof rulesFile.parameters;
export const PARAMETERS = rulesFile.parameters;
export const SOURCES = rulesFile.sources;
/** Standard default unless the project overrides it in unit.user. */
export function parameter(unit: Pick<UnitInputs, 'user'>, key: ParameterKey): number {
  const own = unit.user?.[key];
  return typeof own === 'number' && Number.isFinite(own) && own > 0 ? own : PARAMETERS[key].default;
}
type P = readonly [number, number];
type Seg = readonly [P, P];

const WET = new Set(['wet', 'wc', 'sauna']);
const xy = (p: { x: { value_mm: number }; y: { value_mm: number } }): P => [p.x.value_mm, p.y.value_mm];
const poly = (room: Room): P[] => room.polygon.slice(0, -1).map(xy);
const edges = (points: P[]): Seg[] => points.map((p, i) => [p, points[(i + 1) % points.length]] as Seg);

function inside(p: P, points: P[]): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > p[1]) !== (by > p[1]) && p[0] < (bx - ax) * (p[1] - ay) / (by - ay) + ax) hit = !hit;
  }
  return hit;
}
function segDist(p: P, [a, b]: Seg): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
/** Local axes of a fixture: width along x, depth along y, counter-clockwise rotation. */
function frame(f: Fixture) {
  const a = (f.rotation_deg ?? 0) * Math.PI / 180;
  return { c: xy(f) as P, ux: [Math.cos(a), Math.sin(a)] as P, uy: [-Math.sin(a), Math.cos(a)] as P, w: f.width.value_mm, d: f.depth.value_mm };
}
function rectDist(p: P, f: Fixture): number {
  const { c, ux, uy, w, d } = frame(f), vx = p[0] - c[0], vy = p[1] - c[1];
  return Math.hypot(Math.max(Math.abs(vx * ux[0] + vy * ux[1]) - w / 2, 0), Math.max(Math.abs(vx * uy[0] + vy * uy[1]) - d / 2, 0));
}
function rectEdges(f: Fixture): Seg[] {
  const { c, ux, uy, w, d } = frame(f), at = (sx: number, sy: number): P =>
    [c[0] + ux[0] * sx * w / 2 + uy[0] * sy * d / 2, c[1] + ux[1] * sx * w / 2 + uy[1] * sy * d / 2];
  return edges([at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]);
}
function wallEdges(w: Wall): Seg[] {
  const a = xy(w.a), b = xy(w.b), l = Math.hypot(b[0] - a[0], b[1] - a[1]), t = w.thickness.value_mm / 2;
  const nx = -(b[1] - a[1]) / l * t, ny = (b[0] - a[0]) / l * t;
  return edges([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
}
const roomOf = (p: P, rooms: Room[]) => rooms.find(r => inside(p, poly(r)));

/** Largest circle inside the room that clears walls (with thickness) and fixed fixtures. Grid search, then refine. */
export function freeCircle(room: Room, walls: Wall[], fixtures: Fixture[]): { x: number; y: number; d: number } {
  const points = poly(room), border = edges(points);
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const near = walls.filter(w => { const a = xy(w.a), b = xy(w.b), m = w.thickness.value_mm;
    return Math.max(a[0], b[0]) >= box[0] - m && Math.min(a[0], b[0]) <= box[2] + m && Math.max(a[1], b[1]) >= box[1] - m && Math.min(a[1], b[1]) <= box[3] + m; });
  const radius = (p: P) => {
    let r = Infinity;
    for (const e of border) r = Math.min(r, segDist(p, e));
    for (const w of near) r = Math.min(r, segDist(p, [xy(w.a), xy(w.b)]) - w.thickness.value_mm / 2);
    for (const f of fixtures) r = Math.min(r, rectDist(p, f));
    return r;
  };
  let best: P = [box[0], box[1]], br = -1;
  const scan = (x0: number, y0: number, x1: number, y1: number, step: number) => {
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) {
      const p: P = [x, y];
      if (!inside(p, points)) continue;
      const r = radius(p);
      if (r > br) { br = r; best = p; }
    }
  };
  scan(box[0], box[1], box[2], box[3], 50);
  if (br > 0) scan(best[0] - 50, best[1] - 50, best[0] + 50, best[1] + 50, 10);
  if (br > 0) scan(best[0] - 10, best[1] - 10, best[0] + 10, best[1] + 10, 1);
  // ponytail: coarse-to-fine grid search; switch to a polylabel-style search if rooms get large.
  return { x: best[0], y: best[1], d: Math.max(0, Math.floor(2 * br / 10) * 10) };
}

/** Free distance beside a WC: rays from both sides at three depths; the freer side counts. */
export function wcSideSpace(wc: Fixture, room: Room | undefined, walls: Wall[], fixtures: Fixture[]): number {
  const { c, ux, uy, w, d } = frame(wc);
  const obstacles = [...(room ? edges(poly(room)) : []), ...walls.flatMap(wallEdges), ...fixtures.filter(f => f.id !== wc.id).flatMap(rectEdges)];
  const cast = (o: P, dir: P) => {
    let t = 3000;
    for (const [a, b] of obstacles) {
      const ex = b[0] - a[0], ey = b[1] - a[1], den = dir[0] * ey - dir[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      const s = ((a[0] - o[0]) * ey - (a[1] - o[1]) * ex) / den, u = ((a[0] - o[0]) * dir[1] - (a[1] - o[1]) * dir[0]) / den;
      if (s >= -1e-6 && u >= 0 && u <= 1) t = Math.min(t, Math.max(0, s));
    }
    return t;
  };
  const side = (sign: number) => Math.min(...[-d / 2 + 20, 0, d / 2 - 20].map(f => cast(
    [c[0] + ux[0] * sign * w / 2 + uy[0] * f, c[1] + ux[1] * sign * w / 2 + uy[1] * f], [ux[0] * sign, ux[1] * sign])));
  return Math.round(Math.max(side(1), side(-1)));
}

function openingSides(o: Opening, walls: Wall[]): P[] {
  const w = walls.find(w => w.id === o.host_wall); if (!w) return [];
  const a = xy(w.a), b = xy(w.b), l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l;
  const t = o.along_wall.value_mm + o.width.value_mm / 2, off = w.thickness.value_mm / 2 + 100;
  const m: P = [a[0] + ux * t, a[1] + uy * t];
  return [[m[0] - uy * off, m[1] + ux * off], [m[0] + uy * off, m[1] - ux * off]];
}

export function evaluate(unit: UnitInputs, rules: Rule[] = rulesFile.rules as Rule[]): Finding[] {
  const changes = unit.changes ?? [], target: Baseline = apply(unit.baseline, changes);
  const walls = target.walls ?? [], rooms = target.rooms ?? [], openings = target.openings ?? [], fixtures = target.fixtures ?? [];
  const thresholds = target.thresholds ?? [];
  const roomName = (id: string) => rooms.find(r => r.id === id)?.name ?? id;
  // What the change layer touches: targets, added elements and rooms they sit in.
  const touched = new Set<string>();
  for (const c of changes) {
    if ('target' in c) touched.add(c.target);
    if (c.op === 'add_wall') touched.add(c.wall.id);
    if (c.op === 'add_fixture') touched.add(c.fixture.id);
    if (c.op === 'add_opening') touched.add(c.opening.id);
    if (c.op === 'change_finish') touched.add(c.room);
  }
  for (const f of fixtures) if (touched.has(f.id)) { const r = roomOf(xy(f), rooms); if (r) touched.add(r.id); }
  for (const w of walls) if (touched.has(w.id)) {
    const a = xy(w.a), b = xy(w.b), r = roomOf([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rooms); if (r) touched.add(r.id);
  }
  for (const o of openings) if (touched.has(o.id)) for (const p of openingSides(o, walls)) { const r = roomOf(p, rooms); if (r) touched.add(r.id); }

  const out: Finding[] = [];
  for (const rule of rules) {
    const source = { ...rulesFile.sources[rule.source as keyof typeof rulesFile.sources], section: rule.section };
    const params = (rule as { params?: Record<string, unknown> }).params ?? {};
    const push = (f: Partial<Finding> & { ok: boolean; touched: boolean }, label = '') => {
      const fill = (s: string) => s.replace('{element}', label).replace('{kind}', String(f.value ?? '')).replace('{value}', String(f.value ?? '')).replace('{limit}', String(f.limit ?? ''));
      out.push({ rule: rule.id, profile: rule.profile, severity: rule.severity as Severity, source,
        title: { fi: rule.title_fi, en: rule.title_en }, message: { fi: fill(rule.message_fi), en: fill(rule.message_en) }, ...f });
    };
    switch (rule.check) {
      case 'any_change':
        if (changes.length) push({ ok: false, touched: true });
        break;
      case 'change_ops':
        if (changes.some(c => (params.ops as string[]).includes(c.op))) push({ ok: false, touched: true });
        break;
      case 'structural_wall_change': {
        const kinds = params.kinds as string[], seen = new Set<string>();
        const names: Record<string, [string, string]> = { load_bearing: ['kantava', 'load-bearing'], external: ['ulkoseinä', 'external'], party: ['huoneistojen välinen', 'party wall'] };
        for (const c of changes) {
          const wallId = c.op === 'demolish_wall' ? c.target : c.op === 'add_opening' ? c.opening.host_wall
            : c.op === 'remove_opening' ? unit.baseline.openings?.find(o => o.id === c.target)?.host_wall : undefined;
          const wall = wallId && (unit.baseline.walls?.find(w => w.id === wallId) ?? walls.find(w => w.id === wallId));
          if (!wall || !kinds.includes(wall.kind) || seen.has(wall.id)) continue;
          seen.add(wall.id);
          const [fi, en] = names[wall.kind];
          out.push({ rule: rule.id, profile: rule.profile, severity: rule.severity as Severity, source, ok: false, touched: true,
            element: { kind: 'wall', id: wall.id }, title: { fi: rule.title_fi, en: rule.title_en },
            message: { fi: rule.message_fi.replace('{element}', wall.id).replace('{value}', fi), en: rule.message_en.replace('{element}', wall.id).replace('{value}', en) } });
        }
        break;
      }
      case 'demolish_unverified_wall':
        for (const c of changes) if (c.op === 'demolish_wall') {
          const wall = unit.baseline.walls?.find(w => w.id === c.target);
          const evidence = (wall?.source_refs ?? []).filter(r => !/^assum/i.test(r.trim()));
          if (wall && !evidence.length) push({ ok: false, touched: true, element: { kind: 'wall', id: wall.id } }, wall.id);
        }
        break;
      case 'wet_room_change': {
        const wet = new Set<string>();
        const mark = (p: P) => { const r = roomOf(p, rooms); if (r && WET.has(r.kind)) wet.add(r.id); };
        for (const c of changes) {
          if (c.op === 'change_finish') { const r = rooms.find(r => r.id === c.room); if (r && WET.has(r.kind)) wet.add(r.id); }
          if (c.op === 'add_fixture' || c.op === 'replace_fixture') { const f = fixtures.find(f => f.id === (c.op === 'add_fixture' ? c.fixture.id : c.target)); if (f) mark(xy(f)); }
          if (c.op === 'modify_opening' || c.op === 'add_opening') { const o = openings.find(o => o.id === (c.op === 'add_opening' ? c.opening.id : c.target)); if (o) openingSides(o, walls).forEach(mark); }
          if (c.op === 'remove_opening') { const o = unit.baseline.openings?.find(o => o.id === c.target); if (o) openingSides(o, unit.baseline.walls ?? []).forEach(mark); }
          if (c.op === 'remove_fixture') { const f = unit.baseline.fixtures?.find(f => f.id === c.target); if (f) mark(xy(f)); }
          if (c.op === 'remove_threshold') {
            const t = unit.baseline.thresholds?.find(t => t.id === c.target), o = t?.at_opening && unit.baseline.openings?.find(o => o.id === t.at_opening);
            if (o) openingSides(o, unit.baseline.walls ?? []).forEach(mark);
            t?.between_rooms?.forEach(id => { const r = rooms.find(r => r.id === id); if (r && WET.has(r.kind)) wet.add(r.id); });
          }
        }
        for (const id of wet) push({ ok: false, touched: true, element: { kind: 'room', id } }, roomName(id));
        break;
      }
      case 'accessibility_change':
        if (changes.some(c => c.op === 'remove_threshold' || (c.op === 'modify_opening' && (c.set.clear_width || c.set.width)) ||
          ((c.op === 'add_fixture' || c.op === 'replace_fixture') && c.fixture.kind === 'grab_bar'))) push({ ok: true, touched: true });
        break;
      case 'door_clear_width':
        for (const o of openings) if (o.kind !== 'window') {
          const value = Math.round((o.clear_width ?? o.width).value_mm), limit = parameter(unit, params.param as ParameterKey);
          push({ ok: value >= limit, value, limit, touched: touched.has(o.id), element: { kind: 'opening', id: o.id } }, o.id);
        }
        break;
      case 'threshold_height':
        for (const t of thresholds) {
          const value = Math.round(t.height.value_mm), limit = parameter(unit, params.param as ParameterKey);
          push({ ok: value <= limit, value, limit, touched: touched.has(t.id) || (!!t.at_opening && touched.has(t.at_opening)),
            element: { kind: 'threshold', id: t.id } }, t.id);
        }
        break;
      case 'free_circle':
        for (const r of rooms) if ((params.rooms as string[]).includes(r.kind)) {
          const circle = freeCircle(r, walls, fixtures);
          const limit = parameter(unit, params.param as ParameterKey);
          push({ ok: circle.d >= limit, value: circle.d, limit, circle, touched: touched.has(r.id), element: { kind: 'room', id: r.id } }, r.name);
        }
        break;
      case 'wc_side_space':
        for (const f of fixtures) if (f.kind === 'wc') {
          const room = roomOf(xy(f), rooms), value = wcSideSpace(f, room, walls, fixtures), limit = parameter(unit, params.param as ParameterKey);
          push({ ok: value >= limit, value, limit, touched: touched.has(f.id) || (!!room && touched.has(room.id)), element: { kind: 'fixture', id: f.id } }, f.id);
        }
        break;
    }
  }
  return out;
}

/** Findings worth surfacing without a selection: notices, and failed checks that a change touches or an active profile asks for. */
export function surfaced(findings: Finding[], profiles: string[] = []): Finding[] {
  return findings.filter(f => !f.element ? true : !f.ok && (f.touched || profiles.includes(f.profile) || f.profile === 'muutostyo'));
}
