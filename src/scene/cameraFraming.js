/**
 * Frame layouts consistently on any screen without importing Three.js.
 * Camera looks toward the origin; returns a canonical position for each view.
 * Preprocessed once per layout switch/viewport resize, never in the render loop.
 */
import { APP_CONFIG } from '../config/appConfig.js';

export function getLayoutCameraFrame(layout, targets, width, height, fovDegrees = 46) {
  const preset = APP_CONFIG.cameraDirections[layout];
  if (!preset) throw new Error(`Unknown layout: ${layout}`);
  const length = Math.hypot(preset.x, preset.y, preset.z);
  const dir = { x: preset.x / length, y: preset.y / length, z: preset.z / length };
  const flatLength = Math.hypot(dir.x, dir.z);
  const right = { x: dir.z / flatLength, y: 0, z: -dir.x / flatLength };
  const up = {
    x: -dir.y * right.x,
    y: flatLength,
    z: -dir.y * right.z,
  };
  const tanV = Math.tan((fovDegrees * Math.PI / 180) / 2);
  const tanH = tanV * Math.max(1, width) / Math.max(1, height);
  const fill = APP_CONFIG.framingFillRatio;
  let distance = APP_CONFIG.cameraDistances[layout];
  // Allow space for the cards' face dimensions (142×198 pixels in CSS3D units).
  const halfWidth = 100;
  const halfHeight = 125;
  for (const target of targets ?? []) {
    const p = target.position;
    const depth = p.x * dir.x + p.y * dir.y + p.z * dir.z;
    const h = Math.abs(p.x * right.x + p.y * right.y + p.z * right.z) + halfWidth;
    const v = Math.abs(p.x * up.x + p.y * up.y + p.z * up.z) + halfHeight;
    distance = Math.max(distance, depth + h / (tanH * fill), depth + v / (tanV * fill));
  }
  return {
    distance,
    direction: dir,
    position: { x: dir.x * distance, y: dir.y * distance, z: dir.z * distance },
    target: { x: 0, y: 0, z: 0 },
  };
}

/**
 * Fit the expanded in-world profile, rather than zooming in on the tiny
 * 142×198 overview tile. Perspective projection is computed in CSS3D units.
 * The card must fit within both viewport dimensions without being clipped.
 */
export function getCardFocusDistance(width, height, fovDegrees = 46) {
  const h = Math.max(1, height);
  const w = Math.max(1, width);
  const tanHalfFov = Math.tan(fovDegrees * Math.PI / 360);
  const aspect = w / h;
  const { width: fractionW, height: fractionH } = APP_CONFIG.focusedCardFill;
  const { width: cardW, height: cardH } = APP_CONFIG.focusCard;
  const requiredForHeight = cardH / (2 * tanHalfFov * fractionH);
  const requiredForWidth = cardW / (2 * tanHalfFov * aspect * fractionW);
  return Math.max(380, requiredForHeight, requiredForWidth);
}
