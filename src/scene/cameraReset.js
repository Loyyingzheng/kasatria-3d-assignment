/**
 * Converge an animated camera back to a true canonical view.
 * This function is intentionally Three.js-agnostic to make its state changes
 * testable without a browser/CDN dependency.
 */
export function enforceCanonicalCameraView(camera, controls, layout, position, target) {
  camera.up.set(0, 1, 0);
  camera.position.copy(position);
  controls.target.copy(target);
  if (layout === 'table') {
    // Strict front view: eliminates residual roll and perspective skew.
    camera.position.set(0, 0, Math.max(1, position.z));
    controls.target.set(0, 0, 0);
    camera.quaternion.identity();
  } else {
    camera.lookAt(controls.target);
  }
  // Flushing orbit deltas without damping avoids a post-transition rotation.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  try {
    controls.update();
  } finally {
    controls.enableDamping = damping;
  }
  if (layout === 'table') camera.quaternion.identity();
  controls.saveState?.();
}
