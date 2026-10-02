import { expect, test, type Locator } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const fixture = (name: string) => join(process.cwd(), 'fixtures/background', name);
const screenshots = join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots');

test('a wall chain and a room are traced from a calibrated drawing into the baseline', async ({ page }, info) => {
  const phone = info.project.name === 'phone', errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const activate = (locator: Locator) => phone ? locator.tap() : locator.click();
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const pane = async (open: boolean) => {
    if (phone && await page.locator('aside.right').evaluate(el => el.classList.contains('open')) !== open) await activate(page.locator('#tgPanel'));
    if (phone && !open) await expect.poll(async () => page.evaluate(() => {
      const aside = document.querySelector('aside.right')!;
      return new DOMMatrix(getComputedStyle(aside).transform).m41 / aside.getBoundingClientRect().width;
    })).toBeCloseTo(1.1, 3);
  };
  const pick = async (x: number, y: number) => {
    const p = await page.locator('#gBackground image').evaluate((el, p) =>
      new DOMPoint(p.x, p.y).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!), { x, y });
    if (phone) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  };
  const length = (w: any) => Math.hypot(w.b.x.value_mm - w.a.x.value_mm, w.b.y.value_mm - w.a.y.value_mm);

  await page.goto('/');
  await expect(page.locator('#gWalls polygon').first()).toBeVisible();
  const initial = await page.evaluate(() => (window as any).UnitModel.demoUnit);
  await pane(true);
  const chosen = page.waitForEvent('filechooser');
  await activate(page.locator('#backgroundImport'));
  await (await chosen).setFiles(fixture('calibration-600x400.png'));
  await expect(page.locator('#backgroundConfirm')).toBeEnabled();
  await activate(page.locator('#backgroundConfirm'));
  await expect(page.locator('#gBackground image')).toHaveCount(1);
  await expect(page.locator('#traceWall')).toBeDisabled();
  await expect(page.locator('#traceRoom')).toBeDisabled();

  // Known synthetic marks: 500 source pixels = 4000 mm, so 8 mm per source pixel.
  await activate(page.locator('#backgroundLock'));
  await page.locator('#backgroundDistance').fill('4000');
  await activate(page.locator('[data-action="calibrate"]')); await pane(false);
  await pick(50, 200); await pick(550, 200);
  await expect.poll(async () => (await saved()).background.calibration?.value_mm).toBe(4000);
  const ref = `attachment:${(await saved()).background.source.id}/page:1`;
  const drawn = { status: 'inferred', method: 'archive_drawing', source_refs: [ref], confidence_mm: null };

  await pane(true);
  await expect(page.locator('#traceWall')).toBeEnabled();
  await page.locator('#traceThickness').fill('120');
  await page.locator('#traceWallKind').selectOption('external');
  await activate(page.locator('#traceWall')); await pane(false);
  await pick(100, 100);
  await expect(page.locator('[data-role="traceDraft"] circle')).toHaveCount(1);
  expect((await saved()).unit).toEqual(initial); // A pointer draft is not saved.
  await pick(500, 100); await pick(500, 300);
  await expect.poll(async () => (await saved()).unit.baseline.walls.length).toBe(initial.baseline.walls.length + 2);
  await activate(page.locator('#backgroundMode [data-action="modeCancel"]'));
  const walls = (await saved()).unit.baseline.walls.slice(-2);
  expect(walls.map((w: any) => w.id)).toEqual(['w-trace-1', 'w-trace-2']);
  expect(walls[1].a).toEqual(walls[0].b);
  // Tap rounding is a fraction of a source pixel at this zoom; it never becomes field accuracy.
  expect(Math.abs(length(walls[0]) - 3200)).toBeLessThan(40);
  expect(Math.abs(length(walls[1]) - 1600)).toBeLessThan(40);
  for (const wall of walls) {
    expect(wall).toMatchObject({ kind: 'external', source_refs: [ref], thickness: { value_mm: 120, ...drawn } });
    for (const m of [wall.a.x, wall.a.y, wall.b.x, wall.b.y]) expect(m).toMatchObject(drawn);
  }
  await expect(page.locator('#gWalls [data-wall="w-trace-1"]')).toHaveCount(1);

  await pane(true);
  await page.locator('#traceRoomName').fill('Työhuone');
  await page.locator('#traceRoomKind').selectOption('bedroom');
  await activate(page.locator('#traceRoom')); await pane(false);
  await activate(page.locator("#fit"));
  for (const [x, y] of [[100, 100], [500, 100], [500, 300], [100, 300]]) await pick(x, y);
  await expect(page.locator('[data-role="traceDraft"] circle')).toHaveCount(4);
  if (phone) { await mkdir(screenshots, { recursive: true }); await page.screenshot({ path: join(screenshots, 'v12-phone-trace-room.png') }); }
  await activate(page.locator('#traceDone'));
  await expect(page.locator('#backgroundMode')).not.toBeVisible();
  const afterRoom = await saved(), room = afterRoom.unit.baseline.rooms.at(-1);
  expect(room).toMatchObject({ id: 'r-trace-1', name: 'Työhuone', kind: 'bedroom' });
  expect(room.polygon).toHaveLength(5);
  expect(room.polygon[4]).toEqual(room.polygon[0]);
  for (const p of room.polygon) { expect(p.x).toMatchObject(drawn); expect(p.y).toMatchObject(drawn); }
  expect(afterRoom.rooms['r-trace-1']).toEqual({ name: 'Työhuone', mat: 'wood' });
  await expect(page.locator('#gLabels')).toContainText('Työhuone');

  // Surveyed elements, their provenance and the change layer stay as they were.
  const baseline = afterRoom.unit.baseline;
  expect({ ...baseline, walls: baseline.walls.slice(0, -2), rooms: baseline.rooms.slice(0, -1) }).toEqual(initial.baseline);
  expect(afterRoom.unit.changes).toEqual(initial.changes);

  // One accepted room is one history step.
  await activate(page.locator('#undo'));
  await expect.poll(async () => (await saved()).unit.baseline.rooms.length).toBe(initial.baseline.rooms.length);
  expect((await saved()).unit.baseline.walls.slice(-2)).toEqual(walls);
  await activate(page.locator('#redo'));
  await expect.poll(async () => (await saved()).unit).toEqual(afterRoom.unit);

  await page.reload();
  await expect(page.locator('#gWalls [data-wall="w-trace-2"]')).toHaveCount(1);
  expect((await saved()).unit).toEqual(afterRoom.unit);
  await pane(false); await activate(page.locator('[data-view="3d"]'));
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await activate(page.locator('[data-view="2d"]'));
  expect(errors).toEqual([]);
});
