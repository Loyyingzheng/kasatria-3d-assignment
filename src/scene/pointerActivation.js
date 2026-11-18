/** Determine whether a pointer gesture was a deliberate card selection rather than orbit/pan. */
export function isCardTap(start, end, alreadyMoved = false, thresholdPx = 7) {
  return Boolean(
    start && end &&
    start.pointerId === end.pointerId &&
    end.button === 0 &&
    !alreadyMoved &&
    Math.hypot(end.clientX - start.x, end.clientY - start.y) <= thresholdPx
  );
}
