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

test('a new wall and a grab bar are drawn in 2D as planned changes and appear in 3D', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Change editing is desktop-first');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const changes = async () => (await saved()).unit.changes;
  const planned = (value_mm: number, ref: string) => ({ value_mm, status: 'assumed', method: 'assumption', source_refs: [`design:${ref}`], confidence_mm: null });
  // Click a plan point given in display millimetres (y down).
  const click = async (x: number, y: number) => {
    const p = await page.evaluate(([x, y]) => {
      const svg = document.querySelector('#plan') as SVGSVGElement, pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
      const r = pt.matrixTransform(svg.getScreenCTM()!); return { x: r.x, y: r.y };
    }, [x, y]);
    await page.mouse.click(p.x, p.y);
  };

  await page.goto('/');
  await page.locator('#fileIn').setInputFiles({ name: 'accessibility-unit.json', mimeType: 'application/json',
    buffer: await readFile(join(process.cwd(), 'examples/accessibility-unit.json')) });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.locator('#fit').click(); await page.locator('#zoomOut').click();
  const baseline = (await saved()).unit.baseline;

  // New wall: start on w1's centre line, end on w2's; the second click snaps onto the line.
  await page.keyboard.press('w');
  await expect(page.locator('[data-tool="wall"]')).toHaveClass(/on/);
  await page.locator('#nwThickness').fill('80'); await page.locator('#nwThickness').press('Tab');
  await click(2500, 30);
  await page.mouse.move(10, 10);
  await click(2500, -1980);
  await expect.poll(async () => (await changes()).length).toBe(1);
  await expect(page.locator('[data-role="wallPreview"]')).toHaveCount(0); // chain waits for the next end
  await page.keyboard.press('Escape');
  const wall = (await changes())[0].wall;
  expect(wall).toMatchObject({ id: 'w-new-1', kind: 'partition', thickness: planned(80, 'w-new-1/thickness') });
  expect(wall.a.y).toEqual(planned(0, 'w-new-1/position'));
  expect(wall.b.y).toEqual(planned(2000, 'w-new-1/position'));
  expect(Math.abs(wall.a.x.value_mm - 2500)).toBeLessThan(30);
  await expect(page.locator('#gWalls [data-wall="w-new-1"]').first()).toHaveAttribute('fill', '#c9443a');

  // Grab bar near the bearing wall: flush against its face, parallel to it, then selected for editing.
  await page.keyboard.press('k');
  await expect(page.locator('#nfKind')).toHaveValue('grab_bar');
  await click(3200, -150);
  await expect.poll(async () => (await changes()).length).toBe(2);
  const bar = (await changes())[1].fixture;
  expect(bar).toMatchObject({ id: 'f-new-1', kind: 'grab_bar', rotation_deg: 180,
    y: planned(90, 'f-new-1/position'), width: planned(600, 'f-new-1/size'), depth: planned(80, 'f-new-1/size') });
  expect(Math.abs(bar.x.value_mm - 3200)).toBeLessThan(30);
  await expect(page.locator('[data-tool="select"]')).toHaveClass(/on/);
  await expect(page.locator('#panel')).toContainText('Tukikahva');
  await expect(page.locator('#panel')).toContainText('Uusi (muutos)');
  await page.screenshot({ path: join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots/v13-desktop-2d-new-wall-grab-bar.png') });
  await page.locator('#undo').click();
  await expect.poll(async () => (await changes()).length).toBe(1);
  await page.locator('#redo').click();
  await expect.poll(async () => (await changes()).length).toBe(2);

  // 3D: the planned wall is red and blocks walking; the survey baseline is untouched.
  await page.locator('[data-view="3d"]').click();
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await expect.poll(() => page.evaluate(() => (window as any).View3D.inspect().changed.sort()))
    .toEqual(['fixture:f-new-1:added', 'wall:w-new-1:added']);
  expect(await page.evaluate(() => (window as any).View3D.inspect([2500, -1000]).blocked)).toBe(true);
  expect((await saved()).unit.baseline).toEqual(baseline);
  expect(errors).toEqual([]);
});

test('fixtures move by dragging in 2D and 3D, arrow keys, R and the panel as one planned change', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Change editing is desktop-first');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const changes = async () => (await saved()).unit.changes;
  const pose = async () => { const f = (await changes())[0].fixture; return [f.x.value_mm, f.y.value_mm, f.rotation_deg]; };
  const client = (x: number, y: number) => page.evaluate(([x, y]) => {
    const svg = document.querySelector('#plan') as SVGSVGElement, pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    const r = pt.matrixTransform(svg.getScreenCTM()!); return { x: r.x, y: r.y };
  }, [x, y]);
  const drag2d = async (from: [number, number], to: [number, number]) => {
    const a = await client(...from), b = await client(...to);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
  };
  const near = (value: number, expected: number) => expect(Math.abs(value - expected)).toBeLessThanOrEqual(20);

  await page.goto('/');
  await page.locator('#fileIn').setInputFiles({ name: 'accessibility-unit.json', mimeType: 'application/json',
    buffer: await readFile(join(process.cwd(), 'examples/accessibility-unit.json')) });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.locator('#fit').click(); await page.locator('#zoomOut').click();
  const baseline = (await saved()).unit.baseline;

  // Free move away from walls: grid, rotation kept. The WC becomes a planned replace_fixture.
  await drag2d([500, -2600], [700, -3300]);
  await expect.poll(async () => (await changes()).length).toBe(1);
  expect((await changes())[0]).toMatchObject({ op: 'replace_fixture', target: 'f1', fixture: { kind: 'wc', width: baseline.fixtures[0].width } });
  let [x, y, r] = await pose(); near(x, 700); near(y, 3300); expect(r).toBe(0);
  await expect(page.locator('#panel')).toContainText('Kiintokaluste');

  // Dragged near the partition it snaps flush, back to the wall; still the same single change.
  await drag2d([x, -y], [700, -2300]);
  await expect.poll(async () => (await pose())[1]).toBe(2400);
  [x, y, r] = await pose(); near(x, 700); expect(x % 10).toBe(0); expect(r).toBe(180);
  expect(await changes()).toHaveLength(1);

  // Arrow keys (Shift = 100 mm) and R turn and nudge the selection.
  await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(async () => (await pose())[0]).toBe(x + 100);
  await page.keyboard.press('r');
  await expect.poll(async () => (await pose())[2]).toBe(90);
  // Exact numbers from the panel.
  await page.locator('#xX').fill('500'); await page.locator('#xY').fill('3300'); await page.locator('#xR').fill('0');
  await page.locator('[data-edit="moveFixture"]').click();
  await expect.poll(pose).toEqual([500, 3300, 0]);
  expect(await changes()).toHaveLength(1);
  await page.locator('#undo').click();
  await expect.poll(async () => (await pose())[2]).toBe(90);
  await page.locator('#redo').click();
  await expect.poll(pose).toEqual([500, 3300, 0]);

  // 3D: select the fixture, then drag it on the floor.
  await page.locator('[data-view="3d"]').click();
  await expect(page.locator('#view3d canvas')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await page.locator('#vTop').click(); await page.waitForTimeout(1200);
  const box = (await page.locator('#view3d canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 400);
  await page.waitForTimeout(800);
  const at = await page.evaluate(() => (window as any).View3D.model.fixture('f1').screenPosition());
  await page.mouse.click(at.x, at.y);
  await expect(page.locator('#panel')).toContainText('Kiintokaluste');
  await page.mouse.move(at.x, at.y); await page.mouse.down();
  await page.mouse.move(at.x + 40, at.y, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => (await pose())[0]).toBeGreaterThan(500);
  expect(await changes()).toHaveLength(1);
  expect((await saved()).unit.baseline).toEqual(baseline);
  expect(errors).toEqual([]);
});
