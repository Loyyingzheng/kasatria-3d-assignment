import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { enforceCanonicalCameraView } from '../src/scene/cameraReset.js';
import { buildLayoutTargets } from '../src/scene/layouts.js';
import { getLayoutCameraFrame } from '../src/scene/cameraFraming.js';

function vector(x = 0, y = 0, z = 0) {
  return {
    x, y, z,
    set(a,b,c) {this.x=a;this.y=b;this.z=c;return this;},
    copy(v) {return this.set(v.x,v.y,v.z);},
  };
}
function fakeCamera() {
  const camera = {
    up: vector(1,0,0), position: vector(100,50,900),
    quaternion: {
      x:0.9,y:0.1,z:0.8,w:0.3,
      identity() { this.x=0;this.y=0;this.z=0;this.w=1; },
    },
    lookAt(target) { this.lastLookAt = { ...target }; },
  };
  return camera;
}
function fakeControls(camera) {
  return {
    target: vector(10,20,30),enableDamping:true,updates:0,saves:0,
    update() {this.updates++; assert.equal(this.enableDamping,false);
      // A simulated controls.update can perturb orientation; Table must end exact.
      camera.quaternion.z=0.1;
    },
    saveState(){this.saves++;},
  };
}

test('Table reset is strictly upright and camera centered after previous oblique orbit', () => {
  const camera = fakeCamera(), controls = fakeControls(camera);
  const frame=getLayoutCameraFrame('table', buildLayoutTargets(200).table, 1280,720);
  enforceCanonicalCameraView(camera,controls,'table', frame.position,frame.target);
  assert.deepEqual([camera.position.x,camera.position.y],[0,0]);
  assert.equal(camera.position.z,frame.position.z);
  assert.deepEqual([controls.target.x, controls.target.y,controls.target.z],[0,0,0]);
  assert.deepEqual([camera.up.x,camera.up.y,camera.up.z],[0,1,0]);
  assert.deepEqual([camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w],[0,0,0,1]);
  assert.equal(controls.enableDamping,true);
  assert.equal(controls.updates,1);
  assert.equal(controls.saves,1);
});

test('other views retain their layout camera framing without a forced Table identity pose',()=>{
  const camera=fakeCamera(),controls=fakeControls(camera);
  const frame=getLayoutCameraFrame('grid',buildLayoutTargets(200).grid,1280,720);
  enforceCanonicalCameraView(camera,controls,'grid',frame.position,frame.target);
  assert.notEqual(camera.position.x,0);
  assert.ok(camera.lastLookAt);
  assert.equal(controls.enableDamping,true);
});

test('person cards have two visible sides instead of CSS backface culling',()=>{
  const css=fs.readFileSync(new URL('../src/styles/app.css',import.meta.url),'utf8');
  const html=fs.readFileSync(new URL('../src/scene/PeopleVisualizer.js',import.meta.url),'utf8');
  assert.match(css,/\.person-card\s*\{[^}]*backface-visibility:\s*visible/);
  assert.doesNotMatch(css,/backface-visibility:\s*hidden/);
  assert.match(html,/enforceCanonicalCameraView\(/);
  assert.doesNotMatch(html,/syncHelixBillboards/);
  assert.match(html,/\.applyQuaternion\(object\.quaternion\)/);
});

test('the Table has 200 unrotated positions; Double Helix has 2 intact strands',()=>{
  const all=buildLayoutTargets(200);
  assert.ok(all.table.every(row=>row.position.z===0));
  assert.equal(all.helix.filter(row=>row.strand===0).length,100);
  assert.equal(all.helix.filter(row=>row.strand===1).length,100);
});

// Regression: finishing a Table layout switch must not leave a camera roll,
// and no per-orbit billboard logic should overwrite stable card rotations.
test('Table reset is re-applied on viewport resize, with no orbit-time billboarding', () => {
  const code=fs.readFileSync(new URL('../src/scene/PeopleVisualizer.js',import.meta.url),'utf8');
  assert.ok((code.match(/enforceCanonicalCameraView\(/g)??[]).length >= 2);
  assert.doesNotMatch(code,/syncHelixBillboards\(/);
});
