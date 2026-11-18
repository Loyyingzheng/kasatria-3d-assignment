import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { captureCameraView, restoreCameraView } from '../src/scene/cameraHistory.js';

function vec(x, y, z) {
  return { x, y, z, clone() { return vec(this.x,this.y,this.z); },
    copy(other) { this.x=other.x; this.y=other.y; this.z=other.z; return this; },
    set(a,b,c) { this.x=a; this.y=b; this.z=c; return this; } };
}
function quaternion() {
  return { x:0, y:0, z:0, w:1,
    clone() { const v=quaternion(); v.copy(this); return v; },
    copy(q) { Object.assign(this,{x:q.x,y:q.y,z:q.z,w:q.w}); return this; } };
}
function setup() {
  const camera = { position:vec(120,-75,850), up:vec(0,1,0), quaternion:quaternion(), zoom:1.25,
    updateProjectionMatrix(){this.projectionUpdated=true;},
    lookAt(){this.quaternion.x=.5;} };
  const controls = { target:vec(-20,30,15), enableDamping:true,
    update(){assert.equal(this.enableDamping,false);this.updated=true;camera.quaternion.y=.6;} };
  return {camera,controls};
}
test('camera snapshot preserves position, orbit target, orientation, and zoom independently',()=>{
  const {camera,controls}=setup();
  const old=captureCameraView(camera,controls);
  camera.position.set(0,0,100);
  controls.target.set(0,0,0);
  camera.zoom=2;
  camera.quaternion.w=0;
  assert.deepEqual([old.position.x,old.position.y,old.position.z],[120,-75,850]);
  assert.deepEqual([old.target.x,old.target.y,old.target.z],[-20,30,15]);
  assert.equal(old.zoom,1.25);
  assert.equal(old.quaternion.w,1);
});
test('restore reinstates the pre-focus view and clears residual damping',()=>{
  const {camera,controls}=setup();
  const old=captureCameraView(camera,controls);
  camera.position.set(1000,100,1000);
  controls.target.set(30,0,400);
  camera.zoom=3;
  restoreCameraView(camera,controls,old);
  assert.deepEqual([camera.position.x,camera.position.y,camera.position.z],[120,-75,850]);
  assert.deepEqual([controls.target.x,controls.target.y,controls.target.z],[-20,30,15]);
  assert.equal(camera.zoom,1.25);
  assert.deepEqual([camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w],
    [old.quaternion.x,old.quaternion.y,old.quaternion.z,old.quaternion.w]);
  assert.equal(controls.enableDamping,true);
  assert.equal(controls.updated,true);
  assert.equal(camera.projectionUpdated,true);
});
test('close profile restores prior view instead of resetting layout',()=>{
  const code=fs.readFileSync(new URL('../src/scene/PeopleVisualizer.js',import.meta.url),'utf8');
  const close=code.slice(code.indexOf('  clearFocus('),code.indexOf('  resetView()'));
  assert.match(close,/const savedView = this.preFocusView/);
  assert.match(close,/kind: 'restore'/);
  assert.doesNotMatch(close,/this.changeLayout\(/);
  assert.match(code,/restoreCameraView\(this.camera, this.controls, t.view\)/);
  assert.match(code,/if \(this.focusedIndex === null\) \{\s*this.preFocusView = captureCameraView/);
  assert.match(code,/this.clearFocus\(false\)/);
});
