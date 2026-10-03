import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, randomBytes } from 'node:crypto';
import { sha256Hex } from '../src/io/sha256';

test('the fallback SHA-256 matches node:crypto at block boundaries and for a large input', () => {
  for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 1000, 300_000]) {
    const bytes = new Uint8Array(randomBytes(n));
    assert.equal(sha256Hex(bytes), createHash('sha256').update(bytes).digest('hex'), `length ${n}`);
  }
  assert.equal(sha256Hex(new TextEncoder().encode('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
