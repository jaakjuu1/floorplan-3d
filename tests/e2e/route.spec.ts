import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('wheelchair route, editable design parameters and wheelchair walking', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop-first');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const click = async (x: number, y: number) => {
    const p = await page.evaluate(([x, y]) => {
      const svg = document.querySelector('#plan') as SVGSVGElement, pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
      const r = pt.matrixTransform(svg.getScreenCTM()!); return { x: r.x, y: r.y };
    }, [x, y]);
    await page.mouse.click(p.x, p.y);
  };
  const result = page.locator('#routeResult');

  await page.goto('/');
  await page.locator('#fileIn').setInputFiles({ name: 'accessibility-unit.json', mimeType: 'application/json',
    buffer: await readFile(join(process.cwd(), 'examples/accessibility-unit.json')) });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.locator('#fit').click(); await page.locator('#zoomOut').click();

  // Hall → bathroom: the door is the narrowest point and meets the 800 mm standard default.
  await page.keyboard.press('u');
  await click(2000, -1000); await click(2800, -3000);
  await expect(result).toContainText('täyttyy');
  await expect(result).toContainText('ovella o2: 800 mm, vaatimus 800 mm');
  await expect(result.locator('a').first()).toHaveAttribute('href', /finlex\.fi\/fi\/lainsaadanto\/2017\/241/);
  await expect(page.locator('[data-role="route"]')).toHaveAttribute('stroke', '#2f7d4f');
  await page.screenshot({ path: join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots/v14-desktop-route.png') });

  // A stricter project value is unit metadata, recomputes the route and turns it into a recommendation.
  await page.locator('.params summary').click();
  const door = page.locator('[data-param="door_clear_width_mm"]');
  await expect(door).toHaveAttribute('placeholder', '800');
  await door.fill('900'); await door.press('Tab');
  await expect.poll(async () => (await saved()).unit.user.door_clear_width_mm).toBe(900);
  await expect(result).toContainText('vaatimus 900 mm');
  await expect(page.locator('[data-role="route"]')).toHaveAttribute('stroke', '#c9443a');
  expect((await saved()).unit.changes).toEqual([]);
  await page.locator('[data-param="door_clear_width_mm"]').fill(''); await page.locator('[data-param="door_clear_width_mm"]').press('Tab');
  await expect.poll(async () => (await saved()).unit.user.door_clear_width_mm).toBeUndefined();
  await expect(result).toContainText('vaatimus 800 mm');
  await page.locator('#routeClear').click();
  await expect(page.locator('[data-role="route"]')).toHaveCount(0);

  // 3D walking in wheelchair mode uses the wheelchair width (700 mm → 0.35 m radius) and seated eye height.
  await page.locator('[data-view="3d"]').click();
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  expect(await page.evaluate(() => (window as any).View3D.inspect().walkRadius)).toBe(.22);
  await page.locator('[data-t="chair"]').click();
  expect(await page.evaluate(() => (window as any).View3D.inspect())).toMatchObject({ walkRadius: .35, eyeHeight: 1.2 });
  // The door gap (800 mm clear) still lets a 700 mm wheelchair through; its frame jamb does not.
  expect(await page.evaluate(() => (window as any).View3D.inspect([1950, -2000]).blocked)).toBe(false);
  expect(errors).toEqual([]);
});
