/** Monotonic easing with zero velocity at the start and end. */
export function smoothstep(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}
