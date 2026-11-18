import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { buildLayoutTargets } from './layouts.js';
import { createPersonCard } from '../ui/personCard.js';
import { APP_CONFIG } from '../config/appConfig.js';

export class PeopleVisualizer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 1, 10000);
    this.camera.position.z = APP_CONFIG.cameraDistance;
    this.renderer = new CSS3DRenderer();
    this.renderer.domElement.className = 'css3d-canvas';
    this.container.appendChild(this.renderer.domElement);
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 450;
    this.controls.maxDistance = 7600;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.5;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.12;
    this.objects = [];
    this.targets = {};
    this.layout = 'table';
    this.tweens = new TWEEN.Group();
    this._animate = this.animate.bind(this);
    this._resize = this.resize.bind(this);
    window.addEventListener('resize', this._resize);
    this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(this._resize) : null;
    this.resizeObserver?.observe(this.container);
    this.resize();
    this.animationId = requestAnimationFrame(this._animate);
  }

  setData(people) {
    this.tweens.removeAll();
    for (const item of this.objects) {
      this.scene.remove(item);
      item.element.remove();
    }
    this.objects = [];
    this.targets = buildLayoutTargets(people.length);
    for (const person of people) {
      const object = new CSS3DObject(createPersonCard(person));
      object.position.set((Math.random() - 0.5) * 6000, (Math.random() - 0.5) * 4200, (Math.random() - 0.5) * 6000);
      this.scene.add(object);
      this.objects.push(object);
    }
    this.changeLayout('table', APP_CONFIG.initialAnimationMs);
  }

  changeLayout(layout, duration = APP_CONFIG.animationMs) {
    if (!this.targets[layout]) return;
    this.layout = layout;
    this.tweens.removeAll();
    const targets = this.targets[layout];
    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      const target = targets[i];
      const targetRotation = new THREE.Object3D();
      targetRotation.position.set(target.position.x, target.position.y, target.position.z);
      if (target.faceOutward) {
        const p = target.position;
        targetRotation.lookAt(new THREE.Vector3(p.x * 2, target.horizontalFacing ? p.y : p.y * 2, p.z * 2));
      }
      const time = duration + Math.random() * (duration * 0.35);
      new TWEEN.Tween(object.position, this.tweens)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, time)
        .easing(TWEEN.Easing.Exponential.InOut).start();
      new TWEEN.Tween(object.rotation, this.tweens)
        .to({ x: targetRotation.rotation.x, y: targetRotation.rotation.y, z: targetRotation.rotation.z }, time)
        .easing(TWEEN.Easing.Exponential.InOut).start();
    }
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.controls.handleResize();
  }

  animate(time) {
    this.animationId = requestAnimationFrame(this._animate);
    this.tweens.update(time);
    this.controls.update();
    if (!document.hidden) this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this._resize);
    this.resizeObserver?.disconnect();
    this.controls.dispose();
    this.renderer.domElement.remove();
  }
}
