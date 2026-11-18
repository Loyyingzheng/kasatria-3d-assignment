import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const visualizer = fs.readFileSync(new URL('../src/scene/PeopleVisualizer.js', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('mouse-centered zoom uses OrbitControls across all four layouts', () => {
  assert.match(visualizer, /new OrbitControls\(/);
  assert.match(visualizer, /controls\.zoomToCursor\s*=\s*true/);
  assert.match(visualizer, /controls\.mouseButtons\s*=\s*layout === 'table'/);
  assert.match(visualizer, /THREE\.MOUSE\.PAN/);
  assert.match(visualizer, /THREE\.MOUSE\.ROTATE/);
  assert.doesNotMatch(visualizer, /TrackballControls/);
});

test('card clicks and keyboard activation have a focus & reset path', () => {
  assert.match(visualizer, /this\.activateCard\(Number\(card\.dataset\.cardIndex\)\)/);
  assert.match(visualizer, /this\.activateCard\(press\.index\)/);
  assert.match(visualizer, /this\._pendingFocusIndex = index/);
  assert.match(visualizer, /this\.objects\[this\.focusedIndex\]/);
  assert.match(visualizer, /camera\.up\.set\(0, 1, 0\)/);
  assert.match(entry, /reset-view-btn/);
  assert.match(entry, /visualizer\.clearFocus\(\)/);
  assert.match(visualizer, /showFocusedCard\(object\.element, this\.people\[index\]\)/);
  assert.match(visualizer, /hideFocusedCard\(this\.objects\[this\.focusedIndex\]\?\.element\)/);
});
