import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Desktop first: the change layer is edited by selecting model elements in 2D and as Three.js objects in 3D.
test('walls, openings, thresholds and fixtures are changed as element objects in 2D and 3D', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Change editing is desktop-first');
  const errors: string[] = [], screenshots = join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots');
  const shot = async (name: string) => { await mkdir(screenshots, { recursive: true }); await page.screenshot({ path: join(screenshots, `v13-desktop-${name}.png`) }); };
  page.on('pageerror', error => errors.push(error.message));
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const changes = async () => (await saved()).unit.changes;
  const panel = page.locator('#panel');
  const planned = (value_mm: number, ref: string) => ({ value_mm, status: 'assumed', method: 'assumption', source_refs: [`design:${ref}`], confidence_mm: null });

  await page.goto('/');
  await expect(page.locator('#gWalls polygon').first()).toBeVisible();
  await page.locator('#fileIn').setInputFiles({ name: 'accessibility-unit.json', mimeType: 'application/json',
    buffer: await readFile(join(process.cwd(), 'examples/accessibility-unit.json')) });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.locator('#fit').click(); await page.locator('#zoomOut').click();
  const baseline = (await saved()).unit.baseline;
  await expect(panel.locator('#changeList')).toContainText('Ei muutoksia');

  // 2D: a bearing wall explains why it stays; a partition is demolished and drawn as a yellow ghost.
  await page.locator('#gWalls [data-wall="w1"]').last().click();
  await expect(panel).toContainText('Kantava');
  await expect(panel.locator('[data-edit="demolishWall"]')).toBeDisabled();
  await page.locator('#gWalls [data-wall="w2"]').first().click();
  await expect(panel).toContainText('Väliseinä');
  await panel.locator('[data-edit="demolishWall"]').click();
  await expect.poll(changes).toEqual([{ op: 'demolish_wall', target: 'w2' }]);
  await expect(page.locator('#gWalls [data-wall="w2"]')).toHaveAttribute('fill', 'rgba(232,197,71,.38)');
  await expect(panel.locator('[data-edit="restoreWall"]')).toBeVisible();
  await page.locator('#undo').click();
  await expect.poll(changes).toEqual([]);

  // 2D: the narrow door with a threshold is widened and the threshold removed, each as planned values.
  await page.locator('#gOpen [data-opening="o1"]').click();
  await expect(panel).toContainText('Kynnys t1');
  await expect(panel).toContainText('mitattu · mittanauha');
  await panel.locator('[data-edit="removeThreshold"]').click();
  await panel.locator('#oWidth').fill('1000');
  await panel.locator('#oClear').fill('900');
  await panel.locator('[data-edit="modifyOpening"]').click();
  await expect.poll(changes).toEqual([{ op: 'remove_threshold', target: 't1' },
    { op: 'modify_opening', target: 'o1', set: { width: planned(1000, 'o1/width'), clear_width: planned(900, 'o1/clear_width') } }]);
  await expect(panel).toContainText('900 mm');
  await expect(panel).toContainText('oletus · suunnitelma');
  await expect(page.locator('#gOpen polygon[stroke="#c9443a"]')).toHaveCount(1);
  await shot('2d-opening-change');
  // An impossible plan is refused and leaves the change layer as it was.
  await panel.locator('#oClear').fill('1200');
  await panel.locator('[data-edit="modifyOpening"]').click();
  await expect(page.locator('#toast')).toContainText('hylättiin');
  expect(await changes()).toHaveLength(2);

  // The overview lists the change layer; one change can be reverted on its own.
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).select(null));
  await expect(panel.locator('#changeList tr')).toHaveCount(2);
  await panel.locator('[data-revert="0"]').click();
  await expect.poll(async () => (await changes()).map((c: any) => c.op)).toEqual(['modify_opening']);

  // 3D: the same elements are Three.js objects; clicking selects, panel and methods edit the model.
  await page.locator('[data-view="3d"]').click();
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await page.locator('#vTop').click();
  await page.waitForTimeout(1200);
  const canvasBox = (await page.locator('#view3d canvas').boundingBox())!;
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 400);
  await page.waitForTimeout(800);
  const clickElement = async (kind: string, id: string) => {
    const p = await page.evaluate(([kind, id]) => (window as any).View3D.model[kind](id).screenPosition(), [kind, id]);
    expect(p.x).toBeGreaterThan(canvasBox.x); expect(p.x).toBeLessThan(canvasBox.x + canvasBox.width);
    await page.mouse.click(p.x, p.y);
  };
  expect(await page.evaluate(() => (window as any).View3D.inspect().changed)).toEqual(['opening:o1:modified']);
  await clickElement('wall', 'w2');
  await expect(panel).toContainText('Väliseinä');
  await panel.locator('[data-edit="demolishWall"]').click();
  await expect.poll(async () => (await changes()).at(-1)).toEqual({ op: 'demolish_wall', target: 'w2' });
  await expect.poll(() => page.evaluate(() => (window as any).View3D.inspect().ghosts)).toEqual(['w2']);
  expect(await page.evaluate(() => (window as any).View3D.model.wall('w2').changeState)).toBe('demolished');
  expect(await page.evaluate(() => (window as any).View3D.model.opening('o2'))).toBeUndefined();

  // Methods on the objects themselves: replace a fixture and add a grab bar.
  expect(await page.evaluate(() => (window as any).View3D.model.fixture('f2')
    .replaceWith({ kind: 'sink', x: 1300, y: 2600, width: 500, depth: 400 }))).toBe(true);
  expect(await page.evaluate(() => (window as any).View3D.model.addFixture({ kind: 'grab_bar', x: 300, y: 2300, width: 600, depth: 80 }))).toBe(true);
  await expect.poll(async () => (await changes()).slice(-2).map((c: any) => c.op)).toEqual(['replace_fixture', 'add_fixture']);
  await expect.poll(() => page.evaluate(() => (window as any).View3D.inspect().changed.sort()))
    .toEqual(['fixture:f-new-1:added', 'fixture:f2:modified', 'opening:o1:modified']);
  await page.waitForTimeout(400);
  await shot('3d-changes');
  await clickElement('fixture', 'f2');
  await expect(panel).toContainText('Kiintokaluste');
  await expect(panel).toContainText('500 mm');

  // The yellow ghost is selectable and restores the wall; undo/redo walk the same history.
  await clickElement('wall', 'w2');
  await expect(panel.locator('[data-edit="restoreWall"]')).toBeVisible();
  await panel.locator('[data-edit="restoreWall"]').click();
  await expect.poll(async () => (await changes()).some((c: any) => c.op === 'demolish_wall')).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as any).View3D.inspect().ghosts)).toEqual([]);
  await page.locator('#undo').click();
  await expect.poll(() => page.evaluate(() => (window as any).View3D.inspect().ghosts)).toEqual(['w2']);
  await page.locator('#redo').click();
  await expect.poll(() => page.evaluate(() => (window as any).View3D.inspect().ghosts)).toEqual([]);

  // The survey baseline never changed; the change layer survives a reload.
  const final = await saved();
  expect(final.unit.baseline).toEqual(baseline);
  await page.reload();
  expect((await saved()).unit).toEqual(final.unit);
  expect(errors).toEqual([]);
});
