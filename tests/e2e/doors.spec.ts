import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('doors are dragged from the library onto walls, slid, turned, removed and restored', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop-first');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const changes = async () => (await saved()).unit.changes;
  const panel = page.locator('#panel'), preview = page.locator('[data-role="openingPreview"]');
  const client = (x: number, y: number) => page.evaluate(([x, y]) => {
    const svg = document.querySelector('#plan') as SVGSVGElement, pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    const r = pt.matrixTransform(svg.getScreenCTM()!); return { x: r.x, y: r.y };
  }, [x, y]);
  const dragFromLibrary = async (key: string, x: number, y: number, inspect?: () => Promise<void>) => {
    const box = (await page.locator(`.item[data-key="${key}"]`).boundingBox())!, to = await client(x, y);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });
    if (inspect) await inspect();
    await page.mouse.up();
  };
  const dragOnPlan = async (from: [number, number], to: [number, number]) => {
    const a = await client(...from), b = await client(...to);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 10 }); await page.mouse.up();
  };

  await page.goto('/');
  await page.locator('#fileIn').setInputFiles({ name: 'accessibility-unit.json', mimeType: 'application/json',
    buffer: await readFile(join(process.cwd(), 'examples/accessibility-unit.json')) });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.locator('#fit').click(); await page.locator('#zoomOut').click();
  await expect(page.locator('#lib h4').first()).toHaveText('Ovet ja aukot');

  // Drag a 900 mm door onto the bearing wall: the preview sits in the wall with its distances to both ends.
  await dragFromLibrary('o:1', 3000, -30, async () => {
    await expect(preview).toHaveAttribute('data-ok', 'true');
    await expect(page.locator('#gMeasure')).toContainText('2550 mm | 550 mm');
    await mkdir(join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots'), { recursive: true });
    await page.screenshot({ path: join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots/v15-desktop-door-drag.png') });
  });
  await expect.poll(async () => (await changes()).length).toBe(1);
  const door = (await changes())[0];
  expect(door).toMatchObject({ op: 'add_opening', opening: { id: 'o-new-1', kind: 'door', host_wall: 'w1', swing: 'left',
    along_wall: { value_mm: 2550, status: 'assumed' }, width: { value_mm: 900 }, clear_width: { value_mm: 800 } } });
  expect((await saved()).unit.schema_version).toBe('unit-v2');
  await expect(preview).toHaveCount(0);
  await expect(panel).toContainText('Uusi (muutos)');
  await expect(page.locator('#gOpen polygon[stroke="#c9443a"]')).toHaveCount(1);

  // Slide it along the wall; the change is updated, not duplicated.
  await dragOnPlan([3000, 0], [2000, 0]);
  await expect.poll(async () => (await changes())[0].opening.along_wall.value_mm).toBe(1550);
  expect(await changes()).toHaveLength(1);

  // Overlapping the existing door or dropping on the floor is refused with a reason.
  await dragFromLibrary('o:1', 950, -30, async () => { await expect(preview).toHaveAttribute('data-ok', 'false'); });
  await expect(page.locator('#toast')).toContainText('päällekkäin');
  await dragFromLibrary('o:1', 2000, -1000);
  await expect(page.locator('#toast')).toContainText('seinän kohdalle');
  expect(await changes()).toHaveLength(1);

  // Turn it to open the other way from the panel.
  await page.evaluate(() => (window as any).select({ kind: 'opening', id: 'o-new-1' }));
  await panel.locator('#oSwing').selectOption('right');
  await panel.locator('[data-edit="modifyOpening"]').click();
  await expect.poll(async () => (await changes()).at(-1)).toEqual({ op: 'modify_opening', target: 'o-new-1', set: { swing: 'right' } });

  // The bearing wall raises a check note; it never blocks.
  await page.locator('[data-edit="back"]').click();
  await expect(page.locator('#noticeList [data-rule="muutostyo.kantava"]')).toContainText('w1');

  // Delete closes the existing bathroom door (yellow ghost); selecting the ghost restores it.
  await page.evaluate(() => (window as any).select({ kind: 'opening', id: 'o2' }));
  await page.keyboard.press('Delete');
  await expect.poll(async () => (await changes()).at(-1)).toEqual({ op: 'remove_opening', target: 'o2' });
  await expect(page.locator('#gOpen [data-removed-opening="o2"]')).toHaveCount(1);
  await page.evaluate(() => (window as any).select({ kind: 'opening', id: 'o2' }));
  await panel.locator('[data-edit="restoreOpening"]').click();
  await expect.poll(async () => (await changes()).some((c: any) => c.op === 'remove_opening')).toBe(false);

  // A double door draws two leaves.
  await dragFromLibrary('o:3', 3300, -2030);
  await expect.poll(async () => (await changes()).at(-1)?.opening?.swing).toBe('double');
  const id = (await changes()).at(-1).opening.id;
  await expect(page.locator(`#gOpen polygon[data-opening="${id}"]`)).toHaveCount(2);

  // 3D shows the new openings in red; the bearing-wall door has its own object.
  await page.locator('[data-view="3d"]').click();
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  expect((await page.evaluate(() => (window as any).View3D.inspect().changed)).sort()).toEqual(['opening:o-new-1:added', `opening:${id}:added`].sort());
  expect(await page.evaluate(() => !!(window as any).View3D.model.opening('o-new-1'))).toBe(true);
  expect(errors).toEqual([]);
});
