import test from 'node:test';
import assert from 'node:assert/strict';
import { isCardTap } from '../src/scene/pointerActivation.js';

const start = { pointerId: 4, x: 200, y: 120, index: 18 };

test('tap can select a card even if OrbitControls retargets pointerup to its root', () => {
  const end = { pointerId: 4, clientX: 202, clientY: 121, button: 0, target: { className: 'css3d-canvas' } };
  assert.equal(isCardTap(start, end), true);
});

test('dragging to pan or orbit does not select a card', () => {
  assert.equal(isCardTap(start, { pointerId: 4, clientX: 250, clientY: 122, button: 0 }), false);
  assert.equal(isCardTap(start, { pointerId: 4, clientX: 202, clientY: 121, button: 0 }, true), false);
});

test('different pointer, right click, cancellation cannot select', () => {
  assert.equal(isCardTap(start, { pointerId: 9, clientX: 200, clientY: 120, button: 0 }), false);
  assert.equal(isCardTap(start, { pointerId: 4, clientX: 200, clientY: 120, button: 2 }), false);
  assert.equal(isCardTap(start, null), false);
});
