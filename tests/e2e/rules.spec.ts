import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('advisory rules appear when a change or selection touches them and never block editing', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Rules UI is desktop-first');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const panel = page.locator('#panel'), notices = page.locator('#noticeList');

  await page.goto('/');
  await page.locator('#fileIn').setInputFiles({ name: 'accessibility-unit.json', mimeType: 'application/json',
    buffer: await readFile(join(process.cwd(), 'examples/accessibility-unit.json')) });
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.locator('#fit').click(); await page.locator('#zoomOut').click();
  await expect(notices).toContainText('Ei huomioita');

  // Selecting the bathroom door shows its own checks with the statute, even when they pass.
  await page.locator('#gOpen [data-opening="o2"]').click();
  const doorRule = panel.locator('.rules [data-rule="esteettomyys.oven_vapaa_leveys"]');
  await expect(doorRule).toContainText('täyttyy');
  await expect(doorRule.locator('a')).toHaveAttribute('href', 'https://www.finlex.fi/fi/lainsaadanto/2017/241');
  await expect(doorRule).toContainText('4 § 2 mom.');

  // Narrowing it below the guidance is still saved: the rule informs, it does not block.
  await panel.locator('#oClear').fill('700');
  await panel.locator('[data-edit="modifyOpening"]').click();
  await expect.poll(async () => (await saved()).unit.changes.length).toBe(1);
  await expect(doorRule).toContainText('Suositus');
  await expect(doorRule).toContainText('700 mm');

  // The overview now lists what the change touches: notice, wet room, the door and the WC in that bathroom.
  await page.locator('[data-edit="back"]').click();
  for (const rule of ['muutostyo.ilmoitus', 'muutostyo.markatila', 'esteettomyys.oven_vapaa_leveys', 'esteettomyys.wc_sivutila'])
    await expect(notices.locator(`[data-rule="${rule}"]`)).toHaveCount(1);
  await expect(notices.locator('[data-rule="muutostyo.ilmoitus"] a')).toHaveAttribute('href', /2009\/1599/);
  await notices.locator('[data-rule="esteettomyys.oven_vapaa_leveys"]').click();
  await expect(panel).toContainText('Ovi');
  await expect(panel).toContainText('o2');
  await page.locator('[data-edit="back"]').click();

  // The accessibility profile surfaces every failing recommendation; it is unit metadata, not a change.
  await panel.locator('#profileAccess').check();
  await expect.poll(async () => (await saved()).unit.profiles).toContain('esteettomyys');
  expect((await saved()).unit.changes).toHaveLength(1);
  await panel.locator('#profileAccess').uncheck();
  await expect.poll(async () => (await saved()).unit.profiles).not.toContain('esteettomyys');

  // A selected bathroom shows its largest free circle in 2D.
  await panel.locator('tr[data-room="r2"]').click();
  await expect(page.locator('[data-role="freeCircle"] text')).toHaveText('Ø 1950 mm');
  await expect(panel.locator('[data-rule="esteettomyys.pesutila_vapaa_tila"]')).toContainText('täyttyy');
  await mkdir(join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots'), { recursive: true });
  await page.screenshot({ path: join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots/v14-desktop-rules.png') });
  expect(errors).toEqual([]);
});
