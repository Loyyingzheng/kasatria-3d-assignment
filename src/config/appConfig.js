/** Shared product, rendering and layout controls. Modify visual constants here. */
export const APP_CONFIG = Object.freeze({
  maxRecords: 200,
  animationMs: 1000,
  initialAnimationMs: 1150,
  cameraDistance: 4200,
  cameraDistances: Object.freeze({ table: 4200, sphere: 5250, helix: 7400, grid: 5800 }),
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
  // 2.65 turns (not 5+); ~44px rise/pair gives a visible double helix, not a cylinder.
  helix: Object.freeze({ radius: 900, turns: 2.65, rowSpacing: 44 }),
});

export const LAYOUT_LABELS = Object.freeze({
  table: 'TABLE', sphere: 'SPHERE', helix: 'DOUBLE HELIX', grid: 'GRID',
});
