import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readAttachment, renderAttachment, renderDimensions } from '../src/io/attachment';

async function fixture(name: string, type = ''): Promise<File> {
  const bytes = await readFile(fileURLToPath(new URL(`../fixtures/background/${name}`, import.meta.url)));
  return new File([bytes], name, { type });
}

test('PNG/JPEG imports preserve original bytes and report their source digest', async () => {
  for (const [name, type] of [['tiny.png', 'image/png'], ['calibration-600x400.png', 'image/png'], ['photo.jpg', 'image/jpeg'],
    ['photo-orientation-6.jpg', 'image/jpeg']] as const) {
    const file = await fixture(name, type), source = await readAttachment(file);
    assert.equal(source.mime, type);
    assert.equal(source.size, file.size);
    assert.match(source.id, /^[0-9a-f]{64}$/);
    assert.deepEqual(Buffer.from(source.data, 'base64'), await file.arrayBuffer().then(Buffer.from));
  }
});

test('extreme aspect ratios and tiny budgets cannot exceed render pixel or long-edge limits', () => {
  for (const [w,h] of [[600,400],[20_000_000,1],[1,20_000_000],[400_000_000,.01]]) {
    for(const max of [1,5000,4_000_000]) {
      const size=renderDimensions(w,h,max);
      assert.ok(size.width*size.height<=max);
      assert.ok(size.width<=8192&&size.height<=8192);
    }
  }
  assert.throws(()=>renderDimensions(0,10,100));
});

test('rejects unsupported, mislabelled and oversized files', async () => {
  await assert.rejects(readAttachment(new File(['nope'], 'bad.png', { type: 'image/png' })), /ei ole tuettu/);
  const png = await fixture('tiny.png', 'image/jpeg');
  await assert.rejects(readAttachment(png), /ei vastaa tiedostotyyppiä/);
  await assert.rejects(readAttachment(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png')),
    /enintään 2 MiB/);
  const hugePng = new Uint8Array(24);
  hugePng.set([137,80,78,71,13,10,26,10], 0); hugePng.set([73,72,68,82], 12);
  new DataView(hugePng.buffer).setUint32(16, 5000); new DataView(hugePng.buffer).setUint32(20, 5000);
  await assert.rejects(readAttachment(new File([hugePng], 'huge.png')), /purkurajan/);
  const oversizedSource = { id: createHash('sha256').update(hugePng).digest('hex'), name: 'huge.png', mime: 'image/png' as const,
    size: hugePng.length, data: Buffer.from(hugePng).toString('base64') };
  await assert.rejects(renderAttachment(oversizedSource), /purkurajan/);
  const unreadable = { name: 'unreadable.png', size: 1, type: 'image/png', arrayBuffer: async () => { throw new Error('disk'); } } as unknown as File;
  await assert.rejects(readAttachment(unreadable), /Tiedoston luku epäonnistui/);
});

test('validates source contents again when reopening and rendering', async () => {
  const source = await readAttachment(await fixture('tiny.png', 'image/png'));
  await assert.rejects(renderAttachment({ ...source, data: source.data.slice(0, -4) }), /tarkistussumma|tallennustiedot/);
  await assert.rejects(renderAttachment(source, 2), /tarkistussumma|vain yksi sivu/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(renderAttachment(source, 1, undefined, abort.signal), /Lataus peruttiin/);
});

test('PDF render reports broken and encrypted files clearly', async () => {
  for (const [name, pattern] of [['broken.pdf', /vioittunut/], ['encrypted.pdf', /Salattua PDF/]] as const) {
    const source = await readAttachment(await fixture(name, 'application/pdf'));
    await assert.rejects(renderAttachment(source), pattern);
  }
});
