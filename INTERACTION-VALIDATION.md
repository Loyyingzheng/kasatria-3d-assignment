# Kasatria — camera / interaction verification

## Implemented

- `OrbitControls` with `zoomToCursor=true` on Table, Sphere, Double Helix and Grid.
- Table at canonical front view (camera +Z, target origin, up +Y); left drag pans.
- Sphere at canonical front view (camera +Z, up +Y); left drag orbits.
- Helix and Grid retain their 3D cameras and left-drag orbit.
- All fields in every person card share click and keyboard selection.
- Selected-person camera flight fits the full 320×454 in-scene profile (photo, name, age, country, interest, net worth) against the current viewport.
- Only the chosen CSS3D card dynamically mounts the complete profile. Close × / Escape / Reset View returns to overview; no separate fixed sidebar is needed.
- Layout changes clear focus and restore the per-layout default camera.
- Cached 3D layout targets, DOM reuse and event-driven rendering retained.

## Automated verification

Run `npm test`. This covers spatial layouts, net-worth rules, API mapping,
canonical Table/Sphere camera directions, focus sizing and card DOM semantics.

## Manual browser acceptance (not simulated)

- In Table, click Table again after right-dragging it: all 20 columns appear front-facing, not tilted.
- Hover over a far-side card and scroll: zoom should move toward the cursor, not only screen center.
- Left-drag Table to pan; switch to Sphere, Helix, Grid and left-drag to orbit.
- On each layout, click a visible card *text or photo*: focus it at screen center, zoom in and show readable details.
- Right-drag Grid/Sphere/Helix to pan, and confirm that wheel zoom still follows the cursor.
- Drag across card: must not open details as an accidental click.
- Click the focused profile’s ×, Reset View or Escape to return to overview.
- Switch layout after focusing: previous expanded profile closes; default layout camera returns.
- Ensure Google Sheet data remains live and no fictional data is used on the public URL.

Real-browser visual/FPS acceptance is outstanding: Chromium was unable to open
the local test server in this environment (`ERR_BLOCKED_BY_ADMINISTRATOR`).
