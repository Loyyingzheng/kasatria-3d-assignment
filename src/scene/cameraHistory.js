/**
 * Preserve the precise OrbitControls camera pose when a person profile opens.
 * The snapshot is independent of later camera movement or animation, and is
 * restored only on Close/Escape (not on Layout/Reset View actions).
 */
export function captureCameraView(camera, controls) {
  return {
    position: camera.position.clone(),
    target: controls.target.clone(),
    up: camera.up.clone(),
    quaternion: camera.quaternion.clone(),
    zoom: camera.zoom,
  };
}

export function restoreCameraView(camera, controls, view) {
  camera.position.copy(view.position);
  controls.target.copy(view.target);
  camera.up.copy(view.up);
  camera.zoom = view.zoom;
  camera.updateProjectionMatrix();
  // Discard residual orbit damping before restoring the exact orientation.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  try {
    camera.lookAt(controls.target);
    controls.update();
    camera.quaternion.copy(view.quaternion);
  } finally {
    controls.enableDamping = damping;
  }
}
