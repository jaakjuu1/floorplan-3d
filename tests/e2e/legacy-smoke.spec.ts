import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

const screenshots = join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots');

test('legacy editor keeps its main workflows in Chromium', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  if (process.env.E2E_PHASE === 'baseline') {
    // This environment blocks outbound HTTPS. Serve the app's exact importmap version locally.
    await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', async route => {
      const relative = new URL(route.request().url()).pathname.split('/three@0.160.0/')[1];
      const root = resolve(process.cwd(), 'node_modules/three');
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep)) return route.abort();
      await route.fulfill({ path: file, contentType: 'text/javascript' });
    });
  }
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
  await page.goto('/');
  const furniture = page.locator('#gFurn .furn');
  const beforeCount = await furniture.count();
  expect(beforeCount).toBeGreaterThan(0);
  await page.waitForFunction(() => typeof (window as any).View3D?.enter === 'function', null, { timeout: 60_000 });

  const phone = testInfo.project.name === 'phone';
  const suffix = phone ? 'phone' : 'desktop';
  const phase = process.env.E2E_PHASE ?? 'integrated';
  const activate = async (locator: ReturnType<typeof page.locator>) => phone ? locator.tap() : locator.click();
  const shot = async (name: string) => {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: join(screenshots, `v0-${phase}-${suffix}-${name}.png`), fullPage: false });
  };

  if (phone) await shot('2d-before');
  if (phone) await activate(page.locator('#tgLib'));
  await activate(page.locator('#lib .item').first());
  await expect(furniture).toHaveCount(beforeCount + 1);

  await activate(page.locator('[data-tool="demolish"]'));
  const targetWall = page.locator('#gWalls [data-wall][fill="#a7a195"]').first();
  await expect(targetWall).toBeVisible();
  const originalWall = await targetWall.getAttribute('data-wall');
  await activate(targetWall);
  await expect(page.locator(`#gWalls [data-wall="${originalWall}"]`)).toHaveAttribute('fill', 'rgba(198,91,58,.12)');

  const downloadPromise = page.waitForEvent('download');
  await activate(page.locator('details.menu').locator('summary'));
  await activate(page.locator('#exportJson'));
  const download = await downloadPromise;
  const exportedPath = join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(exportedPath);
  const exported = JSON.parse(await readFile(exportedPath, 'utf8'));
  expect(exported.furniture).toHaveLength(beforeCount + 1);
  expect(exported.demolished).toContain(originalWall);

  if (phone) await activate(page.locator('#tgLib'));
  await activate(page.locator('#lib .item').nth(1));
  await expect(furniture).toHaveCount(beforeCount + 2);
  await activate(page.locator('details.menu').locator('summary'));
  await activate(page.locator('#importJson'));
  await page.locator('#fileIn').setInputFiles({
    name: download.suggestedFilename(),
    mimeType: 'application/json',
    buffer: await readFile(exportedPath),
  });
  await expect(furniture).toHaveCount(beforeCount + 1);
  await expect(page.locator(`#gWalls [data-wall="${originalWall}"]`)).toHaveAttribute('fill', 'rgba(198,91,58,.12)');
  if (phone) await shot('2d-after');

  await page.reload();
  await expect(furniture).toHaveCount(beforeCount + 1);
  await expect(page.locator(`#gWalls [data-wall="${originalWall}"]`)).toHaveAttribute('fill', 'rgba(198,91,58,.12)');

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
  if (phone) await activate(page.locator('#tgLib'));
  await activate(page.locator('#roomList button').first());
  if (phone) await activate(page.locator('#tgLib'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  if (phone) await shot('3d-after');
  await activate(page.locator('[data-view="2d"]'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await expect(canvas).not.toBeVisible();
  if (phone) await shot('2d-after');
  expect(pageErrors).toEqual([]);
});
