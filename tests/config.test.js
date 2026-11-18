import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_CONFIG, LAYOUT_SETTINGS, WEALTH_BANDS, LAYOUT_LABELS } from '../src/config/appConfig.js';
import { createSessionStore } from '../src/state/sessionStore.js';

test('config dimensions cover exactly 200 unique records', () => {
  assert.equal(LAYOUT_SETTINGS.table.columns * LAYOUT_SETTINGS.table.rows, APP_CONFIG.maxRecords);
  assert.equal(LAYOUT_SETTINGS.grid.columns * LAYOUT_SETTINGS.grid.rows * LAYOUT_SETTINGS.grid.layers, APP_CONFIG.maxRecords);
  assert.deepEqual(Object.keys(LAYOUT_LABELS).sort(), ['grid', 'helix', 'sphere', 'table']);
  assert.ok(WEALTH_BANDS.orangeMin < WEALTH_BANDS.greenMin);
});

test('session state stays encapsulated, and can be reset', () => {
  const store = createSessionStore();
  const original = store.get();
  store.set({ accessToken: 'in-memory', busy: true });
  assert.equal(store.get().accessToken, 'in-memory');
  assert.equal(original.accessToken, '');
  store.reset();
  assert.equal(store.get().accessToken, '');
  assert.equal(store.get().busy, false);
});
