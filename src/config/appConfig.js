/** Single source of truth for product labels, data limits and 3D spacing. */
export const APP_CONFIG = Object.freeze({
  maxRecords: 200,
  animationMs: 1400,
  initialAnimationMs: 1600,
  cameraDistance: 4200,
});

export const WEALTH_BANDS = Object.freeze({
  orangeMin: 100_000,
  greenMin: 200_000,
});

export const LAYOUT_SETTINGS = Object.freeze({
  table: Object.freeze({ columns: 20, rows: 10, spacingX: 172, spacingY: 216 }),
  grid: Object.freeze({ columns: 5, rows: 4, layers: 10, spacingX: 210, spacingY: 258, spacingZ: 350 }),
  sphere: Object.freeze({ radius: 1450 }),
  helix: Object.freeze({ radius: 900, angularStep: 0.34, rowSpacing: 24 }),
});

export const LAYOUT_LABELS = Object.freeze({
  table: 'TABLE', sphere: 'SPHERE', helix: 'DOUBLE HELIX', grid: 'GRID',
});
