import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const screenshots = join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots');
const legacy = JSON.parse(readFileSync(new URL('../../fixtures/editor/legacy-huxing-design-v1.json', import.meta.url), 'utf8'));

test('pristine canonical demo matches the former home layout', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#gWalls polygon.wall').first()).toBeVisible();
  await expect(page.locator('#gFurn .furn').first()).toBeVisible();
  if (testInfo.project.name === 'phone') {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: join(screenshots, 'v0-model-phone-demo-2d.png'), fullPage: false });
  }
});

test('canonical model preserves editor flows, migration and diagonal 2D/3D geometry', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    (window as any).__webglDrawCalls = 0;
    for (const proto of [WebGLRenderingContext.prototype, globalThis.WebGL2RenderingContext?.prototype]) {
      if (!proto) continue;
      for (const name of ['drawArrays', 'drawElements']) {
        const original = (proto as any)[name];
        if (typeof original !== 'function' || original.__smokeWrapped) continue;
        const wrapped = function (this: WebGLRenderingContext, ...args: unknown[]) {
          (window as any).__webglDrawCalls++;
          return original.apply(this, args);
        };
        (wrapped as any).__smokeWrapped = true;
        (proto as any)[name] = wrapped;
      }
    }
  });
  await page.addInitScript(data => localStorage.setItem('huxing-design-v1', JSON.stringify(data)), legacy);
  await page.goto('/');

  const phone = testInfo.project.name === 'phone';
  const suffix = phone ? 'phone' : 'desktop';
  const phase = process.env.E2E_PHASE ?? 'integrated';
  const activate = async (locator: ReturnType<typeof page.locator>) => phone ? locator.tap() : locator.click();
  const tapPosition = async (locator: ReturnType<typeof page.locator>, position: { x: number; y: number }) =>
    phone ? locator.tap({ position }) : locator.click({ position });
  const shot = async (name: string) => {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: join(screenshots, `v0-${phase}-${suffix}-${name}.png`), fullPage: false });
  };
  const readSaved = () => page.evaluate(() => localStorage.getItem('kodin-design-v2'));
  const upload = async (name: string, contents: Buffer) => page.locator('#fileIn').setInputFiles({ name, mimeType: 'application/json', buffer: contents });
  const stored = async () => JSON.parse((await readSaved())!);

  const furniture = page.locator('#gFurn .furn');
  const migratedCount = legacy.furniture.length;
  await expect(furniture).toHaveCount(migratedCount);
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('kodin-design-v2') !== null)).toBe(true);
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('huxing-design-v1'))).toBe(JSON.stringify(legacy));
  expect((await stored()).unit.changes).toContainEqual({ op: 'demolish_wall', target: 'w26' });
  if (phone) await shot('2d-before');

  if (phone) await activate(page.locator('#tgLib'));
  await activate(page.locator('#lib .item').first());
  await expect(furniture).toHaveCount(migratedCount + 1);
  await activate(page.locator('#undo'));
  await expect(furniture).toHaveCount(migratedCount);
  await activate(page.locator('#redo'));
  await expect(furniture).toHaveCount(migratedCount + 1);
  if (phone) await activate(page.locator('#tgLib'));

  if (phone && !await page.locator('aside.right').evaluate(el => el.classList.contains('open'))) await activate(page.locator('#tgPanel'));
  await activate(page.locator('#panel tr[data-room="master"]'));
  await activate(page.locator('#panel .mat[data-mat="carpet"]'));
  await expect.poll(async () => (await stored()).rooms.master?.mat === 'carpet').toBe(true);
  await expect.poll(async () => (await stored()).unit.changes.some((c: any) => c.op === 'change_finish' && c.floor === 'carpet')).toBe(true);
  if (phone) await activate(page.locator('#tgPanel'));

  await activate(page.locator('[data-tool="measure"]'));
  const planBox = await page.locator('#plan').boundingBox();
  expect(planBox).not.toBeNull();
  const measuresBefore = (await stored()).measures.length;
  await tapPosition(page.locator('#plan'), { x: planBox!.width * .24, y: planBox!.height * .48 });
  await tapPosition(page.locator('#plan'), { x: planBox!.width * .34, y: planBox!.height * .48 });
  await expect.poll(async () => (await stored()).measures.length).toBe(measuresBefore + 1);
  await activate(page.locator('[data-tool="select"]'));

  const targetWall = page.locator('#gWalls polygon.wall[fill="#a7a195"]').first();
  await expect(targetWall).toBeVisible();
  const originalWall = await targetWall.getAttribute('data-wall');
  await activate(page.locator('[data-tool="demolish"]'));
  await activate(targetWall);
  await expect.poll(async () => (await stored()).unit.changes.some((c: any) => c.op === 'demolish_wall' && c.target === originalWall)).toBe(true);

  const downloadPromise = page.waitForEvent('download');
  await activate(page.locator('details.menu').locator('summary'));
  await activate(page.locator('#exportJson'));
  const download = await downloadPromise;
  const exportedPath = join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(exportedPath);
  const exported = JSON.parse(await readFile(exportedPath, 'utf8'));
  expect(exported.schema_version).toBe('kodin-design-v2');
  expect(exported.furniture).toHaveLength(migratedCount + 1);
  expect(exported.unit.changes).toContainEqual({ op: 'demolish_wall', target: originalWall });

  const menu = page.locator('details.menu');
  if (!await menu.evaluate(el => (el as HTMLDetailsElement).open)) await activate(menu.locator('summary'));
  const pngPromise = page.waitForEvent('download');
  await activate(page.locator('#exportPng'));
  const pngDownload = await pngPromise;
  const pngPath = join(testInfo.outputDir, pngDownload.suggestedFilename());
  await pngDownload.saveAs(pngPath);
  const pngBytes = await readFile(pngPath);
  expect(pngBytes.byteLength).toBeGreaterThan(4096);
  expect([...pngBytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  const beforeInvalidImport = await readSaved();
  const malformed = Buffer.from(JSON.stringify({ ...exported, furniture: [{ ...exported.furniture[0], w: '1800' }] }));
  await upload('invalid-plan.json', malformed);
  await expect(page.locator('#toast')).toContainText('Virheellinen');
  await expect.poll(readSaved).toBe(beforeInvalidImport);
  await expect(furniture).toHaveCount(migratedCount + 1);

  await upload(download.suggestedFilename(), await readFile(exportedPath));
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await expect(furniture).toHaveCount(migratedCount + 1);
  await expect.poll(readSaved).toBe(beforeInvalidImport);
  if (phone) {
    await activate(page.locator('[data-tool="select"]'));
    await expect(page.locator('#toast')).not.toHaveClass(/show/);
    await shot('2d-after');
  }

  const legacyRaw = await page.evaluate(() => localStorage.getItem('huxing-design-v1'));
  const savedRaw = await readSaved();
  await page.reload();
  await expect(furniture).toHaveCount(migratedCount + 1);
  expect(await page.evaluate(() => localStorage.getItem('huxing-design-v1'))).toBe(legacyRaw);
  expect(await readSaved()).toBe(savedRaw);

  if (phone) await shot('3d-before');
  await activate(page.locator('[data-view="3d"]'));
  const canvas = page.locator('#view3d canvas').first();
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await expect.poll(async () => canvas.evaluate(el => {
    const c = el as HTMLCanvasElement;
    return c.width > 0 && c.height > 0 && !!(c.getContext('webgl2') || c.getContext('webgl'));
  }), { timeout: 60_000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__webglDrawCalls), { timeout: 30_000 }).toBeGreaterThan(0);
  await expect(page.locator('#roomList button').first()).toBeVisible();
  await activate(page.locator('[data-mode="walk"]'));
  await expect.poll(() => page.evaluate(() => (window as any).View3D.walking())).toBe(true);
  if (phone) {
    await activate(page.locator('#walkOverlay'));
    await expect(page.locator('#joy')).toBeVisible();
  }
  await activate(page.locator('[data-mode="orbit"]'));
  await expect.poll(() => page.evaluate(() => (window as any).View3D.walking())).toBe(false);
  if (phone) await expect(page.locator('#joy')).toBeHidden();
  const demoGeometry = await page.evaluate(() => (window as any).View3D.inspect());
  expect(demoGeometry.walls.length).toBeGreaterThan(0);
  if (phone) await activate(page.locator('#tgLib'));
  if (phone) await expect(page.locator('aside.lib')).toHaveClass(/open/);
  await activate(page.locator('#roomList button').first());
  if (phone) await activate(page.locator('#tgLib'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  if (phone) await shot('3d-after');
  await activate(page.locator('[data-view="2d"]'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await expect(canvas).not.toBeVisible();

  await activate(page.locator('details.menu').locator('summary'));
  await activate(page.locator('#importJson'));
  await upload('diagonal-unit-v1.json', await readFile(new URL('../../fixtures/editor/diagonal-unit-v1.json', import.meta.url)));
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  const wallParts = page.locator('#gWalls polygon.wall[data-wall="w1"]');
  await expect(wallParts).toHaveCount(2);
  const points = await wallParts.first().getAttribute('points');
  const coords = points!.trim().split(/\s+/).map(value => value.split(',').map(Number));
  const slopes = coords.map((p, i) => {
    const q = coords[(i + 1) % coords.length];
    return Math.abs((q[1] - p[1]) / (q[0] - p[0]));
  }).filter(Number.isFinite);
  expect(slopes.some(slope => Math.abs(slope - .75) < .05)).toBe(true);
  await expect(page.locator('#gOpen [data-opening="o1"]')).toHaveCount(1);
  const diagonalSaved = await stored();
  expect(diagonalSaved.furniture).toEqual([]);
  expect(diagonalSaved.unit.survey.data_origin).toBe('regression_baseline');
  await expect(page.locator('#gFurn [data-fixture]')).toHaveCount(diagonalSaved.unit.baseline.fixtures.length);

  await activate(page.locator('[data-view="3d"]'));
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  const diagonalGeometry = await page.evaluate(() => (window as any).View3D.inspect());
  const diagonalWall = diagonalGeometry.walls.find((wall: any) => wall.id === 'w1');
  expect(diagonalWall.segments).toHaveLength(2);
  expect(diagonalWall.length).toBeCloseTo(4.1, 1);
  for (const segment of diagonalWall.segments) expect(segment.rotationY).toBeCloseTo(Math.atan2(3000, 4000), 2);
  expect(diagonalGeometry.fixtures.sort()).toEqual(diagonalSaved.unit.baseline.fixtures.map((fixture: any) => fixture.id).sort());
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  // Query the same collision function used by walking at the diagonal opening centre.
  expect(await page.evaluate(() => (window as any).View3D.inspect([1160, -870]).blocked)).toBe(false);
  const raisedOpening = structuredClone(diagonalSaved.unit);
  const opening = raisedOpening.baseline.openings.find((o: any) => o.id === 'o1');
  opening.kind = 'opening';
  opening.sill_z = { value_mm: 1000, status: 'assumed', method: 'assumption', source_refs: ['test:raised-opening'], confidence_mm: null };
  await activate(page.locator('[data-view="2d"]'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await upload('raised-opening.json', Buffer.from(JSON.stringify(raisedOpening)));
  await expect.poll(async () => (await stored()).unit.baseline.openings[0].kind).toBe('opening');
  await activate(page.locator('[data-view="3d"]'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await activate(page.locator('[data-mode="walk"]'));
  expect(await page.evaluate(() => (window as any).View3D.inspect([1160, -870]).blocked)).toBe(true);

  // Empty unit-v1 is valid: fitting, zooming and adding furniture must remain usable.
  await activate(page.locator('[data-view="2d"]'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  const empty = { ...raisedOpening, baseline: { walls: [], openings: [], rooms: [], fixtures: [], thresholds: [], measurements: [] }, changes: [] };
  await upload('empty-unit.json', Buffer.from(JSON.stringify(empty)));
  await expect.poll(async () => (await stored()).unit.baseline.walls.length).toBe(0);
  const viewBox = (await page.locator('#plan').getAttribute('viewBox'))!.split(/\s+/).map(Number);
  expect(viewBox.every(Number.isFinite)).toBe(true);
  expect(viewBox[2]).toBeGreaterThan(0);
  expect(viewBox[3]).toBeGreaterThan(0);
  if (phone && !await page.locator('aside.lib').evaluate(el => el.classList.contains('open'))) await activate(page.locator('#tgLib'));
  await activate(page.locator('#lib .item').first());
  await expect(furniture).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('corrupt v2 storage survives edits until a validated import recovers saving', async ({ page }, testInfo) => {
  const corrupt = '{ not valid json';
  await page.addInitScript(value => localStorage.setItem('kodin-design-v2', value), corrupt);
  await page.goto('/');
  const phone = testInfo.project.name === 'phone';
  const activate = async (locator: ReturnType<typeof page.locator>) => phone ? locator.tap() : locator.click();
  await expect(page.locator('#toast')).toContainText('Tallennus on virheellinen');
  if (phone) await activate(page.locator('#tgLib'));
  await activate(page.locator('#lib .item').first());
  if (phone) await activate(page.locator('#tgLib'));
  expect(await page.evaluate(() => localStorage.getItem('kodin-design-v2'))).toBe(corrupt);

  await activate(page.locator('details.menu').locator('summary'));
  await activate(page.locator('#importJson'));
  await page.locator('#fileIn').setInputFiles({
    name: 'demo-unit.json', mimeType: 'application/json',
    buffer: await readFile(new URL('../../examples/demo-unit.json', import.meta.url)),
  });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  const recovered = await page.evaluate(() => localStorage.getItem('kodin-design-v2'));
  expect(JSON.parse(recovered!).schema_version).toBe('kodin-design-v2');
  if (phone) await activate(page.locator('#tgPanel'));
  await activate(page.locator('#panel tr[data-room="master"]'));
  await activate(page.locator('#panel .mat[data-mat="carpet"]'));
  expect(await page.evaluate(() => localStorage.getItem('kodin-design-v2'))).not.toBe(recovered);
});
