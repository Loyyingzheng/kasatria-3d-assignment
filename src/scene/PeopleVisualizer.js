import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildLayoutTargets } from './layouts.js';
import { smoothstep } from './animationMath.js';
import { getLayoutCameraFrame, getCardFocusDistance } from './cameraFraming.js';
import { enforceCanonicalCameraView } from './cameraReset.js';
import { captureCameraView, restoreCameraView } from './cameraHistory.js';
import { createPersonCard, updatePersonCard, showFocusedCard, hideFocusedCard } from '../ui/personCard.js';
import { APP_CONFIG } from '../config/appConfig.js';
import { isCardTap } from './pointerActivation.js';

/**
 * Cached CSS3D card transforms + event-driven rendering.
 * OrbitControls provides zoomToCursor across all layouts. The actual cards are
 * clickable (including nested text/photo) and fly to a readable camera focus.
 */
export class PeopleVisualizer {
  constructor(container, { onSelectPerson = () => {}, onClearSelection = () => {} } = {}) {
    this.container = container;
    this.onSelectPerson = onSelectPerson;
    this.onClearSelection = onClearSelection;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 1, 20000);
    this.camera.up.set(0, 1, 0); // No roll. The default Table is front-facing, never tilted.
    this.camera.position.set(0, 0, APP_CONFIG.cameraDistance);
    this.renderer = new CSS3DRenderer();
    this.renderer.domElement.className = 'css3d-canvas';
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.zoomToCursor = true;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.085;
    this.controls.rotateSpeed = 0.52;
    this.controls.zoomSpeed = 1;
    this.controls.panSpeed = 0.7;
    this.controls.minDistance = 280;
    this.controls.maxDistance = 17000;
    this.configureControlMode('table');
    this.controls.update();

    this.people = [];
    this.objects = [];
    this.targetCache = new Map();
    this.targets = {};
    this.layout = 'table';
    this.focusedIndex = null;
    // Snapshot of the user's orbit/pan/zoom before opening the first profile.
    this.preFocusView = null;
    this.transition = null;
    this.positionBuffer = [];
    this.rotationBuffer = [];
    this._startCamera = new THREE.Vector3();
    this._endCamera = new THREE.Vector3();
    this._startTarget = new THREE.Vector3();
    this._endTarget = new THREE.Vector3();
    this._orientationHelper = new THREE.Object3D();
    this._facing = new THREE.Vector3();
    this.needsRender = true;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.idleFrames = 0;
    this.controlsActive = false;
    this.destroyed = false;
    this.animationId = null;
    this._pointerStart = null;
    this._pointerMoved = false;
    this._pendingFocusIndex = null;
    // Opt-in browser diagnostics: add ?debug=1 to the site URL, then open Console.
    this._debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';
    if (this._debugEnabled) {
      window.__kasatriaDebug = Object.freeze({
        status: () => ({
          cards: this.objects.length,
          layout: this.layout,
          focusedIndex: this.focusedIndex,
          transition: this.transition?.kind ?? null,
          controlsEnabled: this.controls.enabled,
          camera: this.camera.position.toArray(),
          target: this.controls.target.toArray(),
          hasSavedView: Boolean(this.preFocusView),
        }),
        focus: (index = 0) => this.activateCard(index),
        reset: () => this.resetView(),
      });
      console.info('[Kasatria] Debug enabled. Try __kasatriaDebug.status() or __kasatriaDebug.focus(0).');
    }

    this._animate = this.animate.bind(this);
    this._resize = this.resize.bind(this);
    this._onControlChange = () => { this.idleFrames = 0; this.requestRender(); };
    this._onControlStart = () => { this.controlsActive = true; this.requestRender(); };
    this._onControlEnd = () => { this.controlsActive = false; this.requestRender(); };
    this._onVisibility = () => { if (!document.hidden) this.requestRender(); };
    // Use document capture for diagnostic visibility even when OrbitControls
    // captures pointerup or the CSS3D browser retargets the synthesized click.
    this._onPointerDown = (event) => {
      const card = this.findCard(event);
      if (this._debugEnabled && (card || this.container.contains(event.target))) {
        this.debug('pointerdown', { target: this.describeTarget(event.target), cardIndex: card?.dataset.cardIndex ?? null, button: event.button });
      }
      if (event.button !== 0 || !card || event.target.closest?.('.focus-close')) {
        this._pointerStart = null;
        return;
      }
      this._pointerStart = {
        pointerId: event.pointerId,
        x: event.clientX, y: event.clientY,
        index: Number(card.dataset.cardIndex),
      };
      this._pointerMoved = false;
    };
    this._onPointerMove = (event) => {
      const press = this._pointerStart;
      if (press && event.pointerId === press.pointerId && Math.hypot(
        event.clientX - press.x,
        event.clientY - press.y,
      ) > 7) this._pointerMoved = true;
    };
    this._onPointerUp = (event) => {
      const press = this._pointerStart;
      if (this._debugEnabled && press) this.debug('pointerup', {
        sourceIndex: press.index, moved: this._pointerMoved,
        target: this.describeTarget(event.target), button: event.button,
      });
      if (!press || event.pointerId !== press.pointerId) return;
      this._pointerStart = null;
      if (!isCardTap(press, event, this._pointerMoved)) {
        this._pointerMoved = true;
        return;
      }
      this.activateCard(press.index);
    };
    this._onPointerCancel = (event) => {
      if (this._pointerStart?.pointerId !== event.pointerId) return;
      this._pointerStart = null;
      this._pointerMoved = true;
      this.debug('pointercancel');
    };
    // Delegated click fallback handles keyboard-initiated clicks and synthetic
    // clicks from accessibility tools. Never interpret the close button as a card.
    this._onClick = (event) => {
      if (event.target.closest?.('.focus-close')) {
        this.debug('close clicked');
        this._pointerStart = null;
        this.clearFocus();
        return;
      }
      const card = this.findCard(event);
      if (this._debugEnabled && (card || this.container.contains(event.target))) {
        this.debug('click', { target: this.describeTarget(event.target), cardIndex: card?.dataset.cardIndex ?? null });
      }
      if (!card || this._pointerMoved) return;
      this.activateCard(Number(card.dataset.cardIndex));
    };
    this._onKeyDown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest?.('.focus-close')) return;
      const card = this.findCard(event);
      if (!card) return;
      event.preventDefault();
      if (event.repeat) return;
      this.activateCard(Number(card.dataset.cardIndex));
    };

    this.controls.addEventListener('change', this._onControlChange);
    this.controls.addEventListener('start', this._onControlStart);
    this.controls.addEventListener('end', this._onControlEnd);
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('resize', this._resize);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('pointerup', this._onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this._onPointerCancel, { passive: true });
    const element = this.renderer.domElement;
    document.addEventListener('pointerdown', this._onPointerDown, { capture: true, passive: true });
    document.addEventListener('click', this._onClick, true);
    element.addEventListener('keydown', this._onKeyDown);
    this.resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(this._resize) : null;
    this.resizeObserver?.observe(this.container);
    this.resize();
  }


  debug(label, detail = '') {
    if (this._debugEnabled) console.debug(`[Kasatria] ${label}`, detail);
  }

  describeTarget(target) {
    return target?.tagName ? `${target.tagName.toLowerCase()}${target.className && typeof target.className === 'string' ? '.' + target.className.trim().replace(/\s+/g, '.') : ''}` : String(target);
  }

  findCard(event) {
    const path = event.composedPath?.() ?? [];
    const card = path.find(node => node?.classList?.contains?.('person-card'))
      ?? event.target?.closest?.('.person-card');
    return card && this.renderer.domElement.contains(card) ? card : null;
  }

  configureControlMode(layout) {
    // Table behaves like a 2D data wall. The other three retain 3D orbit controls.
    this.controls.touches = layout === 'table'
      ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }
      : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.mouseButtons = layout === 'table' ? {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    } : {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  /** Precompute all target positions and rotations once for each record count. */
  getTargets(count) {
    if (this.targetCache.has(count)) return this.targetCache.get(count);
    const targets = buildLayoutTargets(count);
    for (const group of Object.values(targets)) {
      for (const target of group) {
        const { x, y, z } = target.position;
        target.position = new THREE.Vector3(x, y, z);
        target.quaternion = new THREE.Quaternion();
        if (target.faceCamera) {
          // Fixed default-view orientation: do not rotate cards every time the camera moves.
          // With visible backfaces, the reverse side can be seen as a natural mirror image.
          const dir = APP_CONFIG.cameraDirections.helix;
          this._orientationHelper.position.set(0, 0, 0);
          this._orientationHelper.lookAt(this._facing.set(dir.x, dir.y, dir.z));
          target.quaternion.copy(this._orientationHelper.quaternion);
        } else if (target.faceOutward) {
          this._orientationHelper.position.copy(target.position);
          this._orientationHelper.lookAt(this._facing.set(x * 2, y * 2, z * 2));
          target.quaternion.copy(this._orientationHelper.quaternion);
        }
      }
    }
    this.targetCache.set(count, targets);
    return targets;
  }

  setData(people) {
    if (this.destroyed) return;
    const count = people.length;
    const structureChanged = count !== this.objects.length;
    if (structureChanged) this.finishTransition();
    this.people = people.slice();
    this.targets = this.getTargets(count);
    for (let i = 0; i < count; i++) {
      const existing = this.objects[i];
      if (existing) {
        updatePersonCard(existing.element, people[i]);
      } else {
        const object = new CSS3DObject(createPersonCard(people[i]));
        object.position.set(
          (Math.random() - 0.5) * 5000,
          (Math.random() - 0.5) * 3300,
          (Math.random() - 0.5) * 5000,
        );
        this.scene.add(object);
        this.objects.push(object);
      }
      this.objects[i].element.dataset.cardIndex = String(i);
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
      this.clearFocus(false);
      this.layout = 'table';
      this.requestRender();
      return;
    }
    if (structureChanged) {
      this.clearFocus(false);
      this.layout = 'table';
      this.changeLayout('table', APP_CONFIG.initialAnimationMs);
    } else {
      // Retain the active view on Sheet refresh and refresh selected details.
      if (this.focusedIndex !== null && people[this.focusedIndex]) {
        this.onSelectPerson(people[this.focusedIndex]);
      }
      this.requestRender();
    }
  }

  /** Clear pending orbit inertia before scripted camera interpolation. */
  prepareCameraFlight() {
    this.finishTransition();
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enabled = false;
    this._startCamera.copy(this.camera.position);
    this._startTarget.copy(this.controls.target);
  }

  finishTransition() {
    this.transition = null;
    this.container.classList.remove('is-animating');
    this.controls.enabled = true;
    this.controls.enableDamping = true;
  }

  changeLayout(layout, duration = APP_CONFIG.animationMs) {
    if (this.destroyed || !this.targets[layout] || !this.objects.length) return;
    this._pendingFocusIndex = null;
    this.clearFocus(false);
    this.prepareCameraFlight();
    this.layout = layout;
    this.configureControlMode(layout);
    for (let i = 0; i < this.objects.length; i++) {
      this.positionBuffer[i].copy(this.objects[i].position);
      this.rotationBuffer[i].copy(this.objects[i].quaternion);
    }
    const frame = getLayoutCameraFrame(
      layout, this.targets[layout], this.lastWidth, this.lastHeight, this.camera.fov,
    );
    this._endCamera.set(frame.position.x, frame.position.y, frame.position.z);
    this._endTarget.set(0, 0, 0);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.transition = {
      kind: 'layout', startedAt: null,
      duration: reducedMotion ? 1 : Math.max(1, duration),
      targets: this.targets[layout],
    };
    this.container.classList.add('is-animating');
    this.requestRender();
  }

  /** A click during a layout animation should not be silently discarded. */
  activateCard(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.objects.length) return;
    if (this.transition?.kind === 'layout') {
      this.debug('focus queued until layout animation completes', { index });
      this._pendingFocusIndex = index;
      return;
    }
    this.focusPerson(index);
  }

  /**
   * Focus one person using a camera flight, without moving/rebuilding the cards.
   * Camera approaches the tile's FRONT normal, not an arbitrary world direction.
   */
  focusPerson(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.objects.length) return;
    const object = this.objects[index];
    if (this.focusedIndex === index) return;
    this.debug('focus started', { index, layout: this.layout });
    // When switching directly between profiles, retain the original overview
    // snapshot instead of saving the already-zoomed camera.
    if (this.focusedIndex === null) {
      this.preFocusView = captureCameraView(this.camera, this.controls);
    }
    this.prepareCameraFlight();
    if (this.focusedIndex !== null) hideFocusedCard(this.objects[this.focusedIndex]?.element);
    this.focusedIndex = index;
    showFocusedCard(object.element, this.people[index]);
    this.container.classList.add('is-focused');

    // Fly to the FRONT of the selected card. Backside is intentionally mirrored
    // while orbiting, but close-up focus should present readable, normal text.
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(object.quaternion).normalize();
    const distance = getCardFocusDistance(this.lastWidth, this.lastHeight, this.camera.fov);
    this._endTarget.copy(object.position);
    this._endCamera.copy(object.position).addScaledVector(direction, distance);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.transition = {
      kind: 'focus', startedAt: null,
      duration: reducedMotion ? 1 : APP_CONFIG.focusAnimationMs,
    };
    this.onSelectPerson(this.people[index]);
    this.requestRender();
  }

  clearFocus(restorePreviousView = true) {
    const hadFocus = this.focusedIndex !== null;
    if (hadFocus) hideFocusedCard(this.objects[this.focusedIndex]?.element);
    this.focusedIndex = null;
    this.container.classList.remove('is-focused');
    if (hadFocus) this.onClearSelection();

    // Closing a profile returns to the user's ORIGINAL orbit/zoom/pan, not the
    // canonical layout. Layout buttons and Reset View use changeLayout().
    const savedView = this.preFocusView;
    this.preFocusView = null;
    if (!hadFocus || !restorePreviousView || !savedView || !this.objects.length) return;
    this.debug('restoring previous view', { layout: this.layout });
    this.prepareCameraFlight();
    this._endCamera.copy(savedView.position);
    this._endTarget.copy(savedView.target);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.transition = {
      kind: 'restore', startedAt: null,
      duration: reducedMotion ? 1 : APP_CONFIG.focusAnimationMs,
      view: savedView,
    };
    this.container.classList.add('is-animating');
    this.requestRender();
  }

  resetView() {
    if (this.objects.length) this.changeLayout(this.layout, APP_CONFIG.focusAnimationMs);
  }

  requestRender() {
    if (this.destroyed) return;
    this.needsRender = true;
    if (this.animationId === null && !document.hidden) this.animationId = requestAnimationFrame(this._animate);
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
    if (this.focusedIndex !== null && this.objects[this.focusedIndex]) {
      const distance = getCardFocusDistance(width, height, this.camera.fov);
      const tile = this.objects[this.focusedIndex];
      const direction = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(tile.quaternion).normalize();
      this._endTarget.copy(tile.position);
      this._endCamera.copy(tile.position).addScaledVector(direction, distance);
      if (!this.transition) {
        this.camera.position.copy(this._endCamera);
        this.controls.target.copy(this._endTarget);
      }
    } else {
      const targets = this.targets[this.layout];
      if (targets?.length) {
        const frame = getLayoutCameraFrame(this.layout, targets, width, height, this.camera.fov);
        this._endCamera.set(frame.position.x, frame.position.y, frame.position.z);
        this._endTarget.set(0, 0, 0);
        if (!this.transition) {
          // A viewport resize must preserve the canonical upright overview too.
          enforceCanonicalCameraView(
            this.camera, this.controls, this.layout, this._endCamera, this._endTarget,
          );
        }
      }
    }
    if (!this.transition) this.controls.update();
    this.requestRender();
  }

  animate(time) {
    this.animationId = null;
    if (this.destroyed || document.hidden) return;
    if (this.transition) {
      const t = this.transition;
      if (t.startedAt === null) t.startedAt = time;
      const eased = smoothstep(Math.min((time - t.startedAt) / t.duration, 1));
      if (t.kind === 'layout') {
        for (let i = 0; i < this.objects.length; i++) {
          this.objects[i].position.lerpVectors(this.positionBuffer[i], t.targets[i].position, eased);
          this.objects[i].quaternion.slerpQuaternions(this.rotationBuffer[i], t.targets[i].quaternion, eased);
        }
      }
      this.camera.position.lerpVectors(this._startCamera, this._endCamera, eased);
      this.controls.target.lerpVectors(this._startTarget, this._endTarget, eased);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.controls.target);
      this.needsRender = true;
      if (eased >= 1) {
        if (t.kind === 'layout') {
          // Snap to exact cached transforms; interpolating rotations leaves tiny
          // residual errors that can make a 20×10 Table appear slightly tilted.
          for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].position.copy(t.targets[i].position);
            this.objects[i].quaternion.copy(t.targets[i].quaternion);
          }
          // OrbitControls retains its own spherical state; synchronize it with
          // an exact upright camera before allowing further mouse interaction.
          enforceCanonicalCameraView(
            this.camera, this.controls, this.layout, this._endCamera, this._endTarget,
          );
        } else if (t.kind === 'restore') {
          // Finish on the exact stored pose. OrbitControls' internal state is
          // synchronized without damping, so the view will not drift afterward.
          restoreCameraView(this.camera, this.controls, t.view);
          this.debug('previous view restored');
        } else {
          this.debug('focus animation completed', { index: this.focusedIndex });
          this.camera.position.copy(this._endCamera);
          this.controls.target.copy(this._endTarget);
          this.camera.up.set(0, 1, 0);
          this.camera.lookAt(this.controls.target);
          const damping = this.controls.enableDamping;
          this.controls.enableDamping = false;
          this.controls.update();
          this.controls.enableDamping = damping;
        }
        this.finishTransition();
        if (t.kind === 'layout' && this._pendingFocusIndex !== null) {
          const index = this._pendingFocusIndex;
          this._pendingFocusIndex = null;
          this.activateCard(index);
        }
      }
    }
    this.idleFrames++;
    this.controls.update();
    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera);
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
    this.finishTransition();
    window.removeEventListener('resize', this._resize);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    document.removeEventListener('visibilitychange', this._onVisibility);
    const element = this.renderer.domElement;
    document.removeEventListener('pointerdown', this._onPointerDown, true);
    document.removeEventListener('click', this._onClick, true);
    element.removeEventListener('keydown', this._onKeyDown);
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
    this.renderer.domElement.remove();
    this.targetCache.clear();
    if (this._debugEnabled) delete window.__kasatriaDebug;
  }
}
