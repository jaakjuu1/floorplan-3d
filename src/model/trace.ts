import { attachmentToModel, sourceReference, type Background, type Point } from '../io/background';
import { accept as acceptEdit, nextId, type Edited } from './edit';
import type { Measurement, Opening, Point2D, Room, UnitInputs, Wall } from './unit-input-v1';

export type Traced = Edited;
const accept = (unit: UnitInputs, id: string) => acceptEdit(unit, id, 'Jäljennös');

/** Read from the drawing: never field accuracy or a surveyor's confirmation. */
function drawn(value: number, ref: string): Measurement {
  return { value_mm: Math.round(value) || 0, status: 'inferred', method: 'archive_drawing', source_refs: [ref], confidence_mm: null };
}

function modelPoint(p: Point, background: Background, ref: string): Point2D {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0 || p.x > background.page.width || p.y > background.page.height)
    throw new Error('Jäljennetty piste on pohjakuvan ulkopuolella');
  const m = attachmentToModel(p, background);
  return { x: drawn(m.x, ref), y: drawn(m.y, ref) };
}

function calibratedRef(background: Background | null): string {
  if (!background?.calibration) throw new Error('Kalibroi pohjakuva ennen jäljentämistä');
  return sourceReference(background);
}

/** Existing walls belong to the baseline; tracing is not an add_wall proposal. */
export function traceWall(unit: UnitInputs, background: Background | null, a: Point, b: Point,
  options: { thickness_mm: number; kind: Wall['kind'] }): Traced {
  const ref = calibratedRef(background);
  if (!Number.isFinite(options.thickness_mm) || options.thickness_mm <= 0) throw new Error('Syötä piirustuksesta luettu seinän paksuus millimetreinä');
  const next = structuredClone(unit), id = nextId(next, 'w-trace');
  (next.baseline.walls ??= []).push({ id, a: modelPoint(a, background!, ref), b: modelPoint(b, background!, ref),
    thickness: drawn(options.thickness_mm, ref), kind: options.kind, source_refs: [ref] });
  return accept(next, id);
}

export function traceRoom(unit: UnitInputs, background: Background | null, points: Point[],
  options: { name: string; kind: Room['kind'] }): Traced {
  const ref = calibratedRef(background);
  if (!options.name.trim()) throw new Error('Anna huoneelle nimi');
  if (points.length < 3) throw new Error('Huone tarvitsee vähintään kolme pistettä');
  const next = structuredClone(unit), id = nextId(next, 'r-trace');
  const polygon = points.map(p => modelPoint(p, background!, ref));
  (next.baseline.rooms ??= []).push({ id, name: options.name.trim(), kind: options.kind,
    polygon: [...polygon, structuredClone(polygon[0])] as unknown as Room['polygon'] });
  return accept(next, id);
}

/** The two taps mark the opening's edges; the host is the surveyed wall both lie on (within its thickness + 200 mm). */
export function traceOpening(unit: UnitInputs, background: Background | null, a: Point, b: Point,
  options: { kind: Opening['kind']; clear_width_mm?: number | null }): Traced {
  const ref = calibratedRef(background);
  for (const p of [a, b]) modelPoint(p, background!, ref); // same page bounds check as walls and rooms
  const pa = attachmentToModel(a, background!), pb = attachmentToModel(b, background!);
  let host: { wall: Wall; t1: number; t2: number; score: number } | null = null;
  for (const wall of unit.baseline.walls ?? []) {
    const ax = wall.a.x.value_mm, ay = wall.a.y.value_mm, L = Math.hypot(wall.b.x.value_mm - ax, wall.b.y.value_mm - ay);
    const ux = (wall.b.x.value_mm - ax) / L, uy = (wall.b.y.value_mm - ay) / L;
    const along = (p: Point) => (p.x - ax) * ux + (p.y - ay) * uy, across = (p: Point) => Math.abs(-(p.x - ax) * uy + (p.y - ay) * ux);
    const ta = along(pa), tb = along(pb), score = Math.max(across(pa), across(pb));
    if (score > wall.thickness.value_mm / 2 + 200 || Math.min(ta, tb) < -100 || Math.max(ta, tb) > L + 100) continue;
    if (!host || score < host.score)
      host = { wall, t1: Math.max(0, Math.min(ta, tb)), t2: Math.min(L, Math.max(ta, tb)), score };
  }
  if (!host) throw new Error('Napauta aukon molemmat reunat jäljennetyn seinän kohdalta');
  const along = Math.round(host.t1), width = Math.round(host.t2) - along;
  if (width < 100) throw new Error('Aukko on alle 100 mm leveä');
  const taken = (unit.baseline.openings ?? []).filter(o => o.host_wall === host!.wall.id)
    .some(o => along < o.along_wall.value_mm + o.width.value_mm && o.along_wall.value_mm < along + width);
  if (taken) throw new Error('Aukko menee päällekkäin seinän toisen aukon kanssa');
  const clear = options.clear_width_mm;
  if (clear != null && !(clear > 0 && clear <= width)) throw new Error('Vapaa leveys ei voi ylittää aukon leveyttä');
  const next = structuredClone(unit), id = nextId(next, 'o-trace');
  (next.baseline.openings ??= []).push({ id, kind: options.kind, host_wall: host.wall.id,
    along_wall: drawn(along, ref), width: drawn(width, ref), ...(clear != null ? { clear_width: drawn(clear, ref) } : {}) });
  return accept(next, id);
}
