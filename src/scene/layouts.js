/**
 * All layouts must preserve a one-to-one relation with the cards.
 * Table: 20 columns × 10 rows; Grid: 5 columns × 4 rows × 10 layers.
 */
import { LAYOUT_SETTINGS } from '../config/appConfig.js';
export const TABLE_COLUMNS = LAYOUT_SETTINGS.table.columns;
export const TABLE_ROWS = LAYOUT_SETTINGS.table.rows;
export const GRID_COLUMNS = LAYOUT_SETTINGS.grid.columns;
export const GRID_ROWS = LAYOUT_SETTINGS.grid.rows;
export const GRID_LAYERS = LAYOUT_SETTINGS.grid.layers;

export function buildLayoutTargets(count) {
  const targets = { table: [], sphere: [], helix: [], grid: [] };
  const sphereRadius = LAYOUT_SETTINGS.sphere.radius;
  const helixRadius = LAYOUT_SETTINGS.helix.radius;

  for (let i = 0; i < count; i++) {
    // TABLE — strict 20 across and 10 down for the 200-row assignment.
    const table = { position: {
      x: (i % TABLE_COLUMNS - (TABLE_COLUMNS - 1) / 2) * LAYOUT_SETTINGS.table.spacingX,
      y: ((TABLE_ROWS - 1) / 2 - Math.floor(i / TABLE_COLUMNS)) * LAYOUT_SETTINGS.table.spacingY,
      z: 0,
    } };
    targets.table.push(table);

    // SPHERE — near-uniform Fibonacci distribution; face away from center.
    const phi = Math.acos(-1 + (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const sphere = { position: {
      x: sphereRadius * Math.sin(phi) * Math.sin(theta),
      y: sphereRadius * Math.cos(phi),
      z: sphereRadius * Math.sin(phi) * Math.cos(theta),
    }, faceOutward: true };
    targets.sphere.push(sphere);

    // DOUBLE HELIX — alternates strands, with a PI phase shift (180 degrees).
    const strand = i % 2;
    const step = Math.floor(i / 2);
    const strandLength = Math.ceil(count / 2);
    const angle = step * LAYOUT_SETTINGS.helix.angularStep + strand * Math.PI;
    const helix = { position: {
      x: Math.sin(angle) * helixRadius,
      y: (strandLength / 2 - step) * LAYOUT_SETTINGS.helix.rowSpacing,
      z: Math.cos(angle) * helixRadius,
    }, faceOutward: true, horizontalFacing: true };
    targets.helix.push(helix);

    // GRID — 5 wide, 4 tall, and 10 deep = 200 positions.
    const col = i % GRID_COLUMNS;
    const row = Math.floor(i / GRID_COLUMNS) % GRID_ROWS;
    const depth = Math.floor(i / (GRID_COLUMNS * GRID_ROWS));
    const grid = { position: {
      x: (col - (GRID_COLUMNS - 1) / 2) * LAYOUT_SETTINGS.grid.spacingX,
      y: ((GRID_ROWS - 1) / 2 - row) * LAYOUT_SETTINGS.grid.spacingY,
      z: (depth - (GRID_LAYERS - 1) / 2) * LAYOUT_SETTINGS.grid.spacingZ,
    } };
    targets.grid.push(grid);
  }
  return targets;
}
