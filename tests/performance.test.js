import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothstep } from '../src/scene/animationMath.js';

test('smoothstep clamps out-of-range progress to [0, 1]', () => {
  assert.equal(smoothstep(-100), 0);
  assert.equal(smoothstep(10), 1);
});

test('smoothstep starts and ends at exact target values', () => {
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(0.5), 0.5);
  assert.equal(smoothstep(1), 1);
});

test('smoothstep always increases from 0 to 1', () => {
  let previous = -1;
  for (let i = 0; i <= 100; i++) {
    const value = smoothstep(i / 100);
    assert.ok(value >= previous, `smoothstep not monotonic at ${i}`);
    previous = value;
  }
});
