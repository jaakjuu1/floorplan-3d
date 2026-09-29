import type { UnitInputs, Point2D } from '../model/unit-input-v1';
import { validateUnit } from '../model/validate';

/** Validate a detached copy: importing never changes the caller's baseline. */
export function parseUnit(input: unknown): UnitInputs {
  const data: unknown = structuredClone(input);
  normalizeMethods(data);
  return validateUnit(data);
}

function normalizeMethods(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (typeof record.value_mm === 'number' && typeof record.status === 'string') {
    if (record.method === 'vision_estimate') record.method = 'video';
    if (record.method === 'drawing_assumption') record.method = 'assumption';
  }
  Object.values(record).forEach(normalizeMethods);
}

export function readUnit(json: string): UnitInputs {
  return parseUnit(JSON.parse(json));
}

export function writeUnit(unit: UnitInputs): string {
  return JSON.stringify(parseUnit(unit), null, 2);
}

/** The only unit-model ↔ screen coordinate conversion (millimetres). */
export function toScreenPoint(point: Point2D): { x: number; y: number } {
  return { x: point.x.value_mm, y: -point.y.value_mm };
}

/** Numeric conversion only: recording a Measurement needs its own provenance. */
export function fromScreenPoint(point: { x: number; y: number }): { x: number; y: number } {
  return { x: point.x, y: -point.y };
}
