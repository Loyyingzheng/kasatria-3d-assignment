import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLayoutTargets } from '../src/scene/layouts.js';
import { getLayoutCameraFrame } from '../src/scene/cameraFraming.js';
import { APP_CONFIG } from '../src/config/appConfig.js';

function projectBounds(layout, width, height) {
  const targets = buildLayoutTargets(200)[layout];
  const frame = getLayoutCameraFrame(layout, targets, width, height);
  const d = frame.direction;
  const fl = Math.hypot(d.x, d.z);
  const right = { x: d.z / fl, y: 0, z: -d.x / fl };
  const up = { x: -d.y * right.x, y: fl, z: -d.y * right.z };
  const tanV = Math.tan(46 * Math.PI / 360);
  const tanH = tanV * width / height;
  for (const target of targets) {
    const p = target.position;
    const depth = frame.distance - (p.x * d.x + p.y * d.y + p.z * d.z);
    const h = Math.abs(p.x * right.x + p.y * right.y + p.z * right.z) + 100;
    const v = Math.abs(p.x * up.x + p.y * up.y + p.z * up.z) + 125;
    assert.ok(h <= depth * tanH * APP_CONFIG.framingFillRatio + 1e-6, `horizontal crop: ${layout}`);
    assert.ok(v <= depth * tanV * APP_CONFIG.framingFillRatio + 1e-6, `vertical crop: ${layout}`);
  }
  return frame;
}

test('camera fit keeps all four layouts within the viewport including a narrow screen', () => {
  for (const name of ['table','sphere','helix','grid']) {
    projectBounds(name, 1280, 650);
    projectBounds(name, 320, 650);
  }
});

test('camera view is canonical per layout and independent of previous user orbit', () => {
  const targets = buildLayoutTargets(200).helix;
  const a = getLayoutCameraFrame('helix', targets, 960, 640);
  const b = getLayoutCameraFrame('helix', targets, 960, 640);
  assert.deepEqual(a, b);
  assert.deepEqual(a.target, {x:0,y:0,z:0});
  assert.notDeepEqual(a.direction, getLayoutCameraFrame('table', targets, 960, 640).direction);
});

test('camera adapts to smaller widths without changing layout data', () => {
  const targets = buildLayoutTargets(200).helix;
  const wide = getLayoutCameraFrame('helix', targets, 1440, 720);
  const narrow = getLayoutCameraFrame('helix', targets, 320, 720);
  assert.ok(narrow.distance >= wide.distance);
  const extraNarrow = getLayoutCameraFrame('helix', targets, 220, 720);
  assert.ok(extraNarrow.distance > wide.distance);
  assert.equal(targets.length, 200);
});

test('Table and Sphere open straight-on with no camera tilt or roll', () => {
  const targets = buildLayoutTargets(200);
  for (const layout of ['table', 'sphere']) {
    const camera = getLayoutCameraFrame(layout, targets[layout], 1024, 650);
    assert.equal(camera.direction.x, 0);
    assert.equal(camera.direction.y, 0);
    assert.equal(camera.direction.z, 1);
    assert.equal(camera.position.x, 0);
    assert.equal(camera.position.y, 0);
    assert.ok(camera.position.z > 0);
  }
  assert.ok(targets.table.every(t => t.position.z === 0));
});

test('focus camera fits the complete expanded profile in the available viewport', async () => {
  const { getCardFocusDistance } = await import('../src/scene/cameraFraming.js');
  for (const [w, h] of [[1400, 780], [900, 540], [320, 560]]) {
    const distance = getCardFocusDistance(w, h, 46);
    const focal = h / (2 * Math.tan(46 * Math.PI / 360));
    const projectedW = APP_CONFIG.focusCard.width * focal / distance;
    const projectedH = APP_CONFIG.focusCard.height * focal / distance;
    assert.ok(projectedW <= w * APP_CONFIG.focusedCardFill.width + 1);
    assert.ok(projectedH <= h * APP_CONFIG.focusedCardFill.height + 1);
    assert.ok(projectedW > 110, 'Readable minimum profile width');
    assert.ok(projectedH > 180, 'Readable minimum profile height');
    assert.ok(distance >= 380 && distance <= 1500);
  }
});
