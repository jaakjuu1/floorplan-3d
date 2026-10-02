import { attachmentToModel, sourceReference, type Background, type Point } from '../io/background';
import { accept as acceptEdit, nextId, type Edited } from './edit';
import type { Measurement, Point2D, Room, UnitInputs, Wall } from './unit-input-v1';

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
