import { fromScreenPoint, toScreenVector } from './unit';

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const MAX_RENDER_PIXELS = 4_000_000;
export const MAX_IMAGE_PIXELS = 20_000_000;
export const MAX_PDF_PAGES = 100;
export type Point = { x: number; y: number };
export interface AttachmentSource {
  id: string; // SHA-256 of the unchanged original bytes.
  name: string;
  mime: 'application/pdf' | 'image/png' | 'image/jpeg';
  size: number;
  data: string; // Base64, without a data URL prefix.
}
export interface AttachmentPage {
  number: number; count: number;
  width: number; height: number; // Oriented image pixels or rotated PDF points (scale=1).
  rotation: number; // Original PDF page rotation; JPEG orientation is applied by the decoder.
}
export interface Background {
  source: AttachmentSource;
  page: AttachmentPage;
  transform: { x: number; y: number; rotation: number; mmPerUnit: number }; // Model mm, y up, CCW degrees.
  opacity: number;
  visible: boolean;
  locked: boolean;
  calibration: null | {
    a: Point; b: Point; // Attachment coordinates, y down.
    value_mm: number;
    status: 'inferred'; method: 'archive_drawing';
    source_refs: string[];
  };
}

export function sourceReference(background: Pick<Background, 'source' | 'page'>): string {
  return `attachment:${background.source.id}/page:${background.page.number}`;
}

export function attachmentToModel(p: Point, background: Background): Point {
  const t = background.transform, angle = (t.rotation % 360) * Math.PI / 180;
  const x = p.x * t.mmPerUnit, y = -p.y * t.mmPerUnit;
  return { x: t.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: t.y + x * Math.sin(angle) + y * Math.cos(angle) };
}

export function attachmentToScreen(p: Point, background: Background): Point {
  return toScreenVector(attachmentToModel(p, background));
}

export function screenToAttachment(p: Point, background: Background): Point {
  const model = fromScreenPoint(p), t = background.transform, angle = (t.rotation % 360) * Math.PI / 180;
  const x = model.x - t.x, y = model.y - t.y;
  return { x: (x * Math.cos(angle) + y * Math.sin(angle)) / t.mmPerUnit,
    y: (x * Math.sin(angle) - y * Math.cos(angle)) / t.mmPerUnit };
}

export function backgroundMatrix(background: Background): string {
  const o = attachmentToScreen({ x: 0, y: 0 }, background);
  const x = attachmentToScreen({ x: 1, y: 0 }, background), y = attachmentToScreen({ x: 0, y: 1 }, background);
  return `matrix(${x.x-o.x} ${x.y-o.y} ${y.x-o.x} ${y.y-o.y} ${o.x} ${o.y})`;
}

export function createBackground(source: AttachmentSource, page: AttachmentPage,
  bounds: { x: number; y: number; w: number; h: number }): Background {
  return { source, page, transform: { x: bounds.x, y: fromScreenPoint(bounds).y, rotation: 0,
    mmPerUnit: Math.min(bounds.w / page.width, bounds.h / page.height) },
  opacity: .65, visible: true, locked: true, calibration: null };
}

export function calibrateBackground(background: Background, a: Point, b: Point, distance: number): Background {
  const points = [a, b];
  if (!Number.isFinite(distance) || distance <= 0 || points.some(p =>
    !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0 ||
    p.x > background.page.width || p.y > background.page.height)) throw new Error('Kalibroinnin pisteet tai etäisyys ovat virheelliset');
  const length = Math.hypot(b.x-a.x, b.y-a.y), scale = distance / length;
  if (!(length > 0) || !Number.isFinite(scale) || scale <= 0) throw new Error('Valitse kaksi eri pistettä ja positiivinen etäisyys millimetreinä');
  const anchor = attachmentToModel(a, background), next = structuredClone(background);
  next.transform.mmPerUnit = scale;
  const moved = attachmentToModel(a, next);
  next.transform.x += anchor.x - moved.x; next.transform.y += anchor.y - moved.y;
  next.calibration = { a: { ...a }, b: { ...b }, value_mm: distance, status: 'inferred', method: 'archive_drawing', source_refs: [sourceReference(next)] };
  return next;
}

/** Synchronous envelope validation; decoding and the digest/page check precede a UI import. */
export function validateBackground(value: unknown): asserts value is Background | null {
  if (value === null) return;
  const fail = () => { throw new Error('Virheellinen pohjakuvan tallennus'); };
  const obj = (v: unknown, keys: string[]): Record<string, any> => {
    if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k => !keys.includes(k))) return fail();
    return v as Record<string, any>;
  };
  const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  const bg = obj(value, ['source', 'page', 'transform', 'opacity', 'visible', 'locked', 'calibration']);
  const s = obj(bg.source, ['id', 'name', 'mime', 'size', 'data']);
  if (typeof s.id !== 'string' || !/^[a-f0-9]{64}$/.test(s.id) || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 255 ||
    !['application/pdf', 'image/png', 'image/jpeg'].includes(s.mime) || !Number.isInteger(s.size) || s.size <= 0 || s.size > MAX_ATTACHMENT_BYTES ||
    typeof s.data !== 'string' || s.data.length !== 4 * Math.ceil(s.size / 3) || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s.data)) fail();
  let bytes: string;
  try { bytes = atob(s.data); } catch { return fail(); }
  if (bytes.length !== s.size ||
    (s.mime === 'application/pdf' && !bytes.startsWith('%PDF-')) ||
    (s.mime === 'image/png' && !bytes.startsWith('\x89PNG\r\n\x1a\n')) ||
    (s.mime === 'image/jpeg' && !bytes.startsWith('\xff\xd8\xff'))) fail();
  const p = obj(bg.page, ['number', 'count', 'width', 'height', 'rotation']);
  if (!Number.isInteger(p.count) || p.count < 1 || p.count > MAX_PDF_PAGES || !Number.isInteger(p.number) || p.number < 1 || p.number > p.count ||
    !finite(p.width) || p.width <= 0 || !finite(p.height) || p.height <= 0 || ![0, 90, 180, 270].includes(p.rotation) ||
    (s.mime !== 'application/pdf' && (p.count !== 1 || p.number !== 1 || p.rotation !== 0 || p.width * p.height > MAX_IMAGE_PIXELS))) fail();
  const t = obj(bg.transform, ['x', 'y', 'rotation', 'mmPerUnit']);
  if (![t.x, t.y, t.rotation, t.mmPerUnit].every(finite) || t.mmPerUnit <= 0 ||
    !finite(t.mmPerUnit * Math.hypot(p.width, p.height) + Math.abs(t.x) + Math.abs(t.y)) ||
    !finite(bg.opacity) || bg.opacity < 0 || bg.opacity > 1 || typeof bg.visible !== 'boolean' || typeof bg.locked !== 'boolean') fail();
  if (bg.calibration !== null) {
    const c = obj(bg.calibration, ['a', 'b', 'value_mm', 'status', 'method', 'source_refs']);
    for (const key of ['a', 'b']) {
      const point = obj(c[key], ['x', 'y']);
      if (!finite(point.x) || !finite(point.y) || point.x < 0 || point.y < 0 || point.x > p.width || point.y > p.height) fail();
    }
    const scale = c.value_mm / Math.hypot(c.a.x-c.b.x, c.a.y-c.b.y);
    if (!finite(c.value_mm) || c.value_mm <= 0 || !finite(scale) || scale <= 0 || Math.abs(scale-t.mmPerUnit) > scale * 1e-9 ||
      c.status !== 'inferred' || c.method !== 'archive_drawing' || !Array.isArray(c.source_refs) ||
      c.source_refs.length !== 1 || c.source_refs[0] !== sourceReference(bg as Background)) fail();
  }
}
