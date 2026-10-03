import { apply } from './apply';
import type { UnitInputs } from './unit-input-v1';

export interface XY { x: number; y: number }
export interface Footprint { x: number; y: number; width: number; depth: number; rotation_deg?: number }
export interface RouteInput {
  unit: UnitInputs;
  start: XY; goal: XY;          // model mm, y up
  pathWidth: number;            // corridors
  doorWidth: number;            // at and right beside door openings
  extra?: Footprint[];          // e.g. movable furniture
  step?: number;
}
export interface RouteResult {
  reachable: boolean; ok: boolean; length_mm: number; path: XY[];
  narrowest?: XY & { width: number; required: number; at: 'door' | 'path'; opening?: string };
}

const INF = 1e20;
/** Felzenszwalb–Huttenlocher 1D squared distance transform. */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; }
}
function edt(blocked: Uint8Array, nx: number, ny: number): Float64Array {
  const g = new Float64Array(nx * ny), n = Math.max(nx, ny);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < nx * ny; i++) g[i] = blocked[i] ? 0 : INF;
  for (let x = 0; x < nx; x++) { for (let y = 0; y < ny; y++) f[y] = g[y * nx + x]; edt1d(f, ny, d, v, z); for (let y = 0; y < ny; y++) g[y * nx + x] = d[y]; }
  for (let y = 0; y < ny; y++) { for (let x = 0; x < nx; x++) f[x] = g[y * nx + x]; edt1d(f, nx, d, v, z); for (let x = 0; x < nx; x++) g[y * nx + x] = d[x]; }
  return g;
}

/**
 * Widest-enough route on a grid. A cell is usable when its clearance covers half the required width
 * (door width in a door zone, path width elsewhere). If no route meets that, the route maximising the
 * worst ratio is returned with its narrowest point.
 * ponytail: 20 mm grid, half-width = cell-centre distance (≈ ±step); a wheelchair-shaped sweep would need a configuration space.
 */
export function findRoute(input: RouteInput): RouteResult {
  const step = input.step ?? 20, t = apply(input.unit.baseline, input.unit.changes ?? []);
  const walls = t.walls ?? [], rooms = t.rooms ?? [], openings = t.openings ?? [];
  const pts = [...rooms.flatMap(r => r.polygon), ...walls.flatMap(w => [w.a, w.b])].map(p => [p.x.value_mm, p.y.value_mm]);
  if (!pts.length) return { reachable: false, ok: false, length_mm: 0, path: [] };
  const x0 = Math.min(...pts.map(p => p[0])) - 200, y0 = Math.min(...pts.map(p => p[1])) - 200;
  const nx = Math.ceil((Math.max(...pts.map(p => p[0])) + 200 - x0) / step), ny = Math.ceil((Math.max(...pts.map(p => p[1])) + 200 - y0) / step);
  const N = nx * ny, cx = (i: number) => x0 + (i + .5) * step, cy = (j: number) => y0 + (j + .5) * step;
  const passable = new Uint8Array(N), blocked = new Uint8Array(N), door = new Int32Array(N);
  // Fill cells whose centre satisfies test(x, y) within a model-mm box.
  const fill = (box: number[], test: (x: number, y: number) => boolean, mark: (k: number) => void) => {
    const i0 = Math.max(0, Math.floor((box[0] - x0) / step)), i1 = Math.min(nx - 1, Math.ceil((box[2] - x0) / step));
    const j0 = Math.max(0, Math.floor((box[1] - y0) / step)), j1 = Math.min(ny - 1, Math.ceil((box[3] - y0) / step));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (test(cx(i), cy(j))) mark(j * nx + i);
  };
  const quad = (q: number[][]) => {
    const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
    return { box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], test: (x: number, y: number) => {
      let inside = false;
      for (let a = 0, b = q.length - 1; a < q.length; b = a++)
        if ((q[a][1] > y) !== (q[b][1] > y) && x < (q[b][0] - q[a][0]) * (y - q[a][1]) / (q[b][1] - q[a][1]) + q[a][0]) inside = !inside;
      return inside;
    } };
  };
  const rect = (c: XY, ux: number[], half: [number, number]) => {
    const uy = [-ux[1], ux[0]], at = (sx: number, sy: number) => [c.x + ux[0] * sx * half[0] + uy[0] * sy * half[1], c.y + ux[1] * sx * half[0] + uy[1] * sy * half[1]];
    return quad([at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]);
  };
  for (const r of rooms) { const q = quad(r.polygon.slice(0, -1).map(p => [p.x.value_mm, p.y.value_mm])); fill(q.box, q.test, k => { passable[k] = 1; }); }
  openings.forEach((o, n) => {
    const w = walls.find(w => w.id === o.host_wall); if (!w || o.kind === 'window') return;
    const ax = w.a.x.value_mm, ay = w.a.y.value_mm, L = Math.hypot(w.b.x.value_mm - ax, w.b.y.value_mm - ay);
    const ux = [(w.b.x.value_mm - ax) / L, (w.b.y.value_mm - ay) / L], mid = o.along_wall.value_mm + o.width.value_mm / 2;
    const zone = rect({ x: ax + ux[0] * mid, y: ay + ux[1] * mid }, ux, [o.width.value_mm / 2, w.thickness.value_mm / 2 + input.pathWidth / 2]);
    fill(zone.box, zone.test, k => { passable[k] = 1; door[k] = n + 1; });
  });
  for (let k = 0; k < N; k++) blocked[k] = passable[k] ? 0 : 1;
  for (const w of walls) {
    const ax = w.a.x.value_mm, ay = w.a.y.value_mm, L = Math.hypot(w.b.x.value_mm - ax, w.b.y.value_mm - ay), ux = [(w.b.x.value_mm - ax) / L, (w.b.y.value_mm - ay) / L];
    // Wall pieces outside each door's clear width stay solid, so a gap is exactly its clear width.
    const gaps = openings.filter(o => o.host_wall === w.id && o.kind !== 'window').map(o => {
      const mid = o.along_wall.value_mm + o.width.value_mm / 2, half = (o.clear_width ?? o.width).value_mm / 2;
      return [mid - half, mid + half];
    }).sort((a, b) => a[0] - b[0]);
    let from = 0;
    for (const [s, e] of [...gaps, [L, L]]) {
      if (s > from) { const m = (from + s) / 2, q = rect({ x: ax + ux[0] * m, y: ay + ux[1] * m }, ux, [(s - from) / 2, w.thickness.value_mm / 2]); fill(q.box, q.test, k => { blocked[k] = 1; }); }
      from = Math.max(from, e);
    }
  }
  const solid = (f: Footprint) => { const a = (f.rotation_deg ?? 0) * Math.PI / 180, q = rect(f, [Math.cos(a), Math.sin(a)], [f.width / 2, f.depth / 2]); fill(q.box, q.test, k => { blocked[k] = 1; }); };
  for (const f of t.fixtures ?? []) solid({ x: f.x.value_mm, y: f.y.value_mm, width: f.width.value_mm, depth: f.depth.value_mm, rotation_deg: f.rotation_deg });
  (input.extra ?? []).forEach(solid);

  const d2 = edt(blocked, nx, ny), half = (k: number) => Math.sqrt(d2[k]) * step;
  const required = (k: number) => door[k] ? input.doorWidth : input.pathWidth;
  const ratio = new Float64Array(N);
  for (let k = 0; k < N; k++) ratio[k] = blocked[k] ? 0 : half(k) / (required(k) / 2);
  // Start and goal snap to the roomiest free cell within 300 mm of the click.
  const snap = (p: XY) => {
    const i = Math.floor((p.x - x0) / step), j = Math.floor((p.y - y0) / step), r = Math.ceil(300 / step);
    let best = -1;
    for (let b = Math.max(0, j - r); b <= Math.min(ny - 1, j + r); b++) for (let a = Math.max(0, i - r); a <= Math.min(nx - 1, i + r); a++) {
      const k = b * nx + a; if (!blocked[k] && (best < 0 || ratio[k] > ratio[best])) best = k;
    }
    return best;
  };
  const s = snap(input.start), g = snap(input.goal);
  if (s < 0 || g < 0) return { reachable: false, ok: false, length_mm: 0, path: [] };
  const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  const allowed = (k: number, th: number) => k === s || k === g || (!blocked[k] && ratio[k] >= th);
  const reaches = (th: number) => {
    const seen = new Uint8Array(N), queue = new Int32Array(N); let head = 0, tail = 0;
    queue[tail++] = s; seen[s] = 1;
    while (head < tail) {
      const k = queue[head++]; if (k === g) return true;
      const i = k % nx, j = (k - i) / nx;
      for (const [di, dj] of nb) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue; const m = b * nx + a; if (!seen[m] && allowed(m, th)) { seen[m] = 1; queue[tail++] = m; } }
    }
    return false;
  };
  let th = 1;
  if (!reaches(th)) {
    if (!reaches(1e-9)) return { reachable: false, ok: false, length_mm: 0, path: [] };
    let lo = 1e-9, hi = 1;
    for (let n = 0; n < 14; n++) { const mid = (lo + hi) / 2; if (reaches(mid)) lo = mid; else hi = mid; }
    th = lo;
  }
  // Shortest 8-connected path among usable cells (binary heap Dijkstra).
  const dist = new Float64Array(N).fill(INF), prev = new Int32Array(N).fill(-1), heap: number[] = [], key = new Float64Array(N);
  const push = (k: number) => { heap.push(k); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (key[heap[p]] <= key[heap[c]]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && key[heap[l]] < key[heap[m]]) m = l; if (r < heap.length && key[heap[r]] < key[heap[m]]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  dist[s] = 0; key[s] = 0; push(s);
  while (heap.length) {
    const k = pop(); if (k === g) break; if (key[k] > dist[k]) continue;
    const i = k % nx, j = (k - i) / nx;
    for (const [di, dj, c] of nb) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
      const m = b * nx + a; if (!allowed(m, th)) continue;
      const nd = dist[k] + c * step; if (nd < dist[m]) { dist[m] = nd; prev[m] = k; key[m] = nd; push(m); }
    }
  }
  const cells: number[] = []; for (let k = g; k >= 0; k = prev[k]) cells.unshift(k);
  const at = (k: number): XY => ({ x: cx(k % nx), y: cy(Math.floor(k / nx)) });
  // The narrowest point ignores the first and last 200 mm, where the click itself may sit by a wall.
  const skip = Math.round(200 / step), inner = cells.length > 2 * skip + 1 ? cells.slice(skip, -skip) : cells;
  const worst = inner.reduce((w, k) => ratio[k] < ratio[w] ? k : w, inner[0]);
  const opening = door[worst] ? openings[door[worst] - 1].id : undefined;
  const path = cells.filter((_, n) => n % 5 === 0 || n === cells.length - 1).map(at);
  return { reachable: true, ok: ratio[worst] >= 1 - 1e-9, length_mm: Math.round(dist[g]), path,
    narrowest: { ...at(worst), width: Math.round(2 * half(worst) / 10) * 10, required: required(worst), at: opening ? 'door' : 'path', ...(opening ? { opening } : {}) } };
}
