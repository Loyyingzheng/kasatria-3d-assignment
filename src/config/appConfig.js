/** Shared product, rendering and layout controls. Modify visual constants here. */
export const APP_CONFIG = Object.freeze({
  maxRecords: 200,
  animationMs: 1000,
  initialAnimationMs: 1150,
  cameraDistance: 4200,
  // Per-view canonical camera direction. Clicking any layout (even the active one)
  // returns to this default angle; fitted distance adapts to screen aspect ratio.
  cameraDirections: Object.freeze({
    table: Object.freeze({ x: 0, y: 0, z: 1 }),
    sphere: Object.freeze({ x: 0, y: 0, z: 1 }),
    helix: Object.freeze({ x: 0.22, y: 0.08, z: 1 }),
    grid: Object.freeze({ x: 0.8, y: 0.32, z: 1 }),
  }),
  cameraDistances: Object.freeze({ table: 4200, sphere: 5250, helix: 7400, grid: 5800 }),
  framingFillRatio: 0.82,
  focusAnimationMs: 720,
  focusedCardFill: Object.freeze({ width: 0.52, height: 0.62 }),
  // Native CSS3D transforms are expensive; avoid running RAFs while idle.
  idleFramesBeforeSleep: 4,
});

export const WEALTH_BANDS = Object.freeze({
  orangeMin: 100_000,
  greenMin: 200_000,
});

export const LAYOUT_SETTINGS = Object.freeze({
  table: Object.freeze({ columns: 20, rows: 10, spacingX: 172, spacingY: 216 }),
  grid: Object.freeze({ columns: 5, rows: 4, layers: 10, spacingX: 210, spacingY: 258, spacingZ: 350 }),
  sphere: Object.freeze({ radius: 1450 }),
  // True 180°-offset strands. Camera-facing cards keep BOTH strands legible; no guide lines.
  helix: Object.freeze({ radius: 1100, turns: 2.25, rowSpacing: 47 }),
});

export const LAYOUT_LABELS = Object.freeze({
  table: 'TABLE', sphere: 'SPHERE', helix: 'DOUBLE HELIX', grid: 'GRID',
});
