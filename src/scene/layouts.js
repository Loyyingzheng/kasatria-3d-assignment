/** Pure layout preprocessing; testable without a browser or Three.js dependency. */
import { LAYOUT_SETTINGS } from '../config/appConfig.js';
export const TABLE_COLUMNS = LAYOUT_SETTINGS.table.columns;
export const TABLE_ROWS = LAYOUT_SETTINGS.table.rows;
export const GRID_COLUMNS = LAYOUT_SETTINGS.grid.columns;
export const GRID_ROWS = LAYOUT_SETTINGS.grid.rows;
export const GRID_LAYERS = LAYOUT_SETTINGS.grid.layers;

export function buildLayoutTargets(count) {
  if (!Number.isSafeInteger(count) || count < 0 || count > TABLE_COLUMNS * TABLE_ROWS) {
    throw new RangeError('Layout count must be an integer between 0 and 200.');
  }
  const targets = { table: [], sphere: [], helix: [], grid: [] };
  const sphereRadius = LAYOUT_SETTINGS.sphere.radius;
  const helixRadius = LAYOUT_SETTINGS.helix.radius;
  const pairCount = Math.ceil(count / 2);
  // Both spirals rotate in the same direction, offset by exactly 180 degrees.
  const helixStep = pairCount > 1 ? Math.PI * 2 * LAYOUT_SETTINGS.helix.turns / (pairCount - 1) : 0;

  for (let i = 0; i < count; i++) {
    targets.table.push({ position: {
      x: (i % TABLE_COLUMNS - (TABLE_COLUMNS - 1) / 2) * LAYOUT_SETTINGS.table.spacingX,
      y: ((TABLE_ROWS - 1) / 2 - Math.floor(i / TABLE_COLUMNS)) * LAYOUT_SETTINGS.table.spacingY,
      z: 0,
    } });

    // Fibonacci sphere, including endpoints without singular positions.
    const phi = Math.acos(-1 + (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    targets.sphere.push({ position: {
      x: sphereRadius * Math.sin(phi) * Math.sin(theta),
      y: sphereRadius * Math.cos(phi),
      z: sphereRadius * Math.sin(phi) * Math.cos(theta),
    }, faceOutward: true });

    const strand = i % 2; // 0=A; 1=B
    const step = Math.floor(i / 2);
    const angle = step * helixStep + strand * Math.PI;
    targets.helix.push({ position: {
      x: Math.sin(angle) * helixRadius,
      y: ((pairCount - 1) / 2 - step) * LAYOUT_SETTINGS.helix.rowSpacing,
      z: Math.cos(angle) * helixRadius,
    }, faceOutward: true, horizontalFacing: true, strand, step });

    const col = i % GRID_COLUMNS;
    const row = Math.floor(i / GRID_COLUMNS) % GRID_ROWS;
    const depth = Math.floor(i / (GRID_COLUMNS * GRID_ROWS));
    targets.grid.push({ position: {
      x: (col - (GRID_COLUMNS - 1) / 2) * LAYOUT_SETTINGS.grid.spacingX,
      y: ((GRID_ROWS - 1) / 2 - row) * LAYOUT_SETTINGS.grid.spacingY,
      z: (depth - (GRID_LAYERS - 1) / 2) * LAYOUT_SETTINGS.grid.spacingZ,
    } });
  }
  return targets;
}
