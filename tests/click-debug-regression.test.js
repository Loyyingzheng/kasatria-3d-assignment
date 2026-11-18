import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const code = readFileSync(new URL('../src/scene/PeopleVisualizer.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('card pointerdown is captured before controls can retarget pointerup', () => {
  assert.match(code, /document\.addEventListener\('pointerdown', this\._onPointerDown, \{ capture: true/);
  assert.match(code, /window\.addEventListener\('pointerup', this\._onPointerUp/);
  assert.match(code, /this\.activateCard\(press\.index\)/);
});

test('click focus renders the actual profile instead of an empty enlarged tile', () => {
  assert.match(code, /showFocusedCard\(object\.element, this\.people\[index\]\)/);
  assert.match(code, /hideFocusedCard\(this\.objects\[this\.focusedIndex\]\?\.element\)/);
  assert.match(code, /if \(event\.target\.closest\?\.\('\.focus-close'\)\)/);
});

test('opt-in diagnostics report state and support a direct camera focus test', () => {
  assert.match(code, /window\.__kasatriaDebug = Object\.freeze/);
  assert.match(code, /focus: \(index = 0\) => this\.activateCard\(index\)/);
  assert.match(code, /this\.debug\('pointerdown'/);
  assert.match(code, /this\.debug\('pointerup'/);
  assert.match(app, /new PeopleVisualizer/);
});
