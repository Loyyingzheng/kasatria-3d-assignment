import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { buildLayoutTargets } from './layouts.js';
import { smoothstep } from './animationMath.js';
import { HelixGuides } from './helixGuides.js';
import { createPersonCard, updatePersonCard } from '../ui/personCard.js';
import { APP_CONFIG } from '../config/appConfig.js';

/**
 * Buildless Three.js CSS3D scene, tuned for 200 DOM cards.
 * Data and target transforms are preprocessed and cached. One animation timeline
 * writes to reusable interpolation buffers; no permanent RAF while idle.
 */
export class PeopleVisualizer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 1, 20000);
    this.camera.position.z = APP_CONFIG.cameraDistance;
    this.renderer = new CSS3DRenderer();
    this.renderer.domElement.className = 'css3d-canvas';
    this.guides = new HelixGuides(container);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 500;
    this.controls.maxDistance = 15000;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.5;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.12;

    this.objects = [];
    this.targetCache = new Map();
    this.targets = {};
    this.layout = 'table';
    this.transition = null;
    this.positionBuffer = [];
    this.rotationBuffer = [];
    this._startCamera = new THREE.Vector3();
    this._endCamera = new THREE.Vector3();
    this._startTarget = new THREE.Vector3();
    this._center = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._orientationHelper = new THREE.Object3D();
    this._facing = new THREE.Vector3();
    this.needsRender = true;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.idleFrames = 0;
    this.controlsActive = false;
    this.destroyed = false;
    this.animationId = null;

    this._animate = this.animate.bind(this);
    this._resize = this.resize.bind(this);
    this._onControlChange = () => { this.requestRender(); this.idleFrames = 0; };
    this._onControlStart = () => { this.controlsActive = true; this.requestRender(); };
    this._onControlEnd = () => { this.controlsActive = false; this.idleFrames = 0; this.requestRender(); };
    this._onVisibility = () => { if (!document.hidden) this.requestRender(); };
    this.controls.addEventListener('change', this._onControlChange);
    this.controls.addEventListener('start', this._onControlStart);
    this.controls.addEventListener('end', this._onControlEnd);
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('resize', this._resize);
    this.resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(this._resize) : null;
    this.resizeObserver?.observe(this.container);
    this.resize();
  }

  /** Layout positions AND card-facing quaternions are calculated only once per size. */
  getTargets(count) {
    if (this.targetCache.has(count)) return this.targetCache.get(count);
    const targets = buildLayoutTargets(count);
    for (const group of Object.values(targets)) {
      for (const target of group) {
        const { x, y, z } = target.position;
        target.position = new THREE.Vector3(x, y, z);
        target.quaternion = new THREE.Quaternion();
        if (target.faceOutward) {
          this._orientationHelper.position.copy(target.position);
          this._orientationHelper.lookAt(this._facing.set(
            x * 2, target.horizontalFacing ? y : y * 2, z * 2,
          ));
          target.quaternion.copy(this._orientationHelper.quaternion);
        }
      }
    }
    this.targetCache.set(count, targets);
    return targets;
  }

  /** Refresh existing cards in place. DOM nodes/images survive when the count is stable. */
  setData(people) {
    if (this.destroyed) return;
    const previousCount = this.objects.length;
    const count = people.length;
    const structureChanged = previousCount !== count;
    if (structureChanged) this.finishTransition();
    this.targets = this.getTargets(count);

    for (let i = 0; i < count; i++) {
      const existing = this.objects[i];
      if (existing) {
        updatePersonCard(existing.element, people[i]);
        continue;
      }
      const object = new CSS3DObject(createPersonCard(people[i]));
      object.position.set(
        (Math.random() - 0.5) * 5000,
        (Math.random() - 0.5) * 3300,
        (Math.random() - 0.5) * 5000,
      );
      this.scene.add(object);
      this.objects.push(object);
    }
    while (this.objects.length > count) {
      const object = this.objects.pop();
      this.scene.remove(object);
      object.element.remove();
    }
    while (this.positionBuffer.length < count) {
      this.positionBuffer.push(new THREE.Vector3());
      this.rotationBuffer.push(new THREE.Quaternion());
    }

    if (!count) {
      this.layout = 'table';
      this.guides.setVisible(false);
      this.requestRender();
      return;
    }
    if (structureChanged) {
      this.layout = 'table';
      this.changeLayout('table', APP_CONFIG.initialAnimationMs, true);
    } else {
      // A Google Sheet refresh should not unexpectedly restart the user's orbit.
      this.guides.setVisible(this.layout === 'helix' && !this.transition);
      this.requestRender();
    }
  }

  finishTransition() {
    this.transition = null;
    this.container.classList.remove('is-animating');
    this.guides.setVisible(false);
  }

  changeLayout(layout, duration = APP_CONFIG.animationMs, force = false) {
    if (this.destroyed || !this.targets[layout] || !this.objects.length) return;
    if (!force && this.layout === layout && !this.transition) return;
    this.finishTransition();
    this.layout = layout;
    for (let i = 0; i < this.objects.length; i++) {
      this.positionBuffer[i].copy(this.objects[i].position);
      this.rotationBuffer[i].copy(this.objects[i].quaternion);
    }
    this._startCamera.copy(this.camera.position);
    this._startTarget.copy(this.controls.target);
    this._direction.subVectors(this.camera.position, this.controls.target);
    if (this._direction.lengthSq() < 1) this._direction.set(0, 0, 1);
    this._endCamera.copy(this._direction.normalize())
      .multiplyScalar(APP_CONFIG.cameraDistances[layout]);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.transition = {
      startedAt: null,
      duration: reducedMotion ? 1 : Math.max(1, duration),
      targets: this.targets[layout],
    };
    this.container.classList.add('is-animating');
    this.idleFrames = 0;
    this.requestRender();
  }

  requestRender() {
    if (this.destroyed) return;
    this.needsRender = true;
    if (this.animationId === null && !document.hidden) {
      this.animationId = requestAnimationFrame(this._animate);
    }
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    if (width === this.lastWidth && height === this.lastHeight) return;
    this.lastWidth = width;
    this.lastHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.controls.handleResize();
    this.requestRender();
  }

  animate(time) {
    this.animationId = null;
    if (this.destroyed || document.hidden) return;
    if (this.transition) {
      const t = this.transition;
      if (t.startedAt === null) t.startedAt = time;
      const progress = Math.min((time - t.startedAt) / t.duration, 1);
      const eased = smoothstep(progress);
      for (let i = 0; i < this.objects.length; i++) {
        const target = t.targets[i];
        this.objects[i].position.lerpVectors(this.positionBuffer[i], target.position, eased);
        this.objects[i].quaternion.slerpQuaternions(this.rotationBuffer[i], target.quaternion, eased);
      }
      this.camera.position.lerpVectors(this._startCamera, this._endCamera, eased);
      this.controls.target.lerpVectors(this._startTarget, this._center, eased);
      this.needsRender = true;
      if (progress === 1) {
        this.transition = null;
        this.container.classList.remove('is-animating');
        this.guides.setVisible(this.layout === 'helix');
      }
    }

    // Controls emits 'change' while momentum/damping is active; keep rendering
    // until a few frames pass with no movement, then STOP the RAF completely.
    this.idleFrames++;
    this.controls.update();
    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera);
      this.guides.update(this.camera, this.targets.helix, this.lastWidth, this.lastHeight);
      this.needsRender = false;
    }
    if (this.transition || this.controlsActive || this.idleFrames < APP_CONFIG.idleFramesBeforeSleep) {
      this.requestFrameOnly();
    }
  }

  requestFrameOnly() {
    if (!this.destroyed && !document.hidden && this.animationId === null) {
      this.animationId = requestAnimationFrame(this._animate);
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.transition = null;
    this.container.classList.remove('is-animating');
    window.removeEventListener('resize', this._resize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.resizeObserver?.disconnect();
    this.controls.removeEventListener('change', this._onControlChange);
    this.controls.removeEventListener('start', this._onControlStart);
    this.controls.removeEventListener('end', this._onControlEnd);
    this.controls.dispose();
    for (const object of this.objects) {
      this.scene.remove(object);
      object.element.remove();
    }
    this.objects = [];
    this.guides.destroy();
    this.renderer.domElement.remove();
    this.targetCache.clear();
  }
}
