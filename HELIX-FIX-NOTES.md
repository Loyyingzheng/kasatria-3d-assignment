# Why the double helix looked like a single one

The mathematical positions in the uploaded ZIP were *already two strands*: 100 pairs separated by PI radians. But the `faceOutward` flag rotated cards tangentially around the center, and `.person-card { backface-visibility: hidden }` hid the backs of the far-side cards. That gave the appearance of only one winding strand after the blue/purple guide lines were removed.

## Targeted repair

- `src/scene/layouts.js`: `faceCamera` helix targets, maintain exact 180-degree phase and paired height; sphere remains outward facing.
- `src/scene/PeopleVisualizer.js`: targets get default facing quaternions; in the original version, cards bill boarded during orbit. The current backface update stops that live rotation and shows the natural mirrored backface when orbiting behind a card.
- `src/config/appConfig.js`: slightly more frontal default camera orientation for helix.
- `tests/acceptance.test.js` and `tests/helix-visibility.test.js`: cover target visibility and pair projection.

## Expected behavior

Both strands appear, with A and B crisscrossing. The tiles retain Net Worth colors. There are **no blue or purple SVG guide lines**. Every layout tab resets its viewpoint.

## Local verification

```powershell
npm test
py -m http.server 5500
# Open http://localhost:5500/ and select Double Helix.
```

Manual browser rendering and real Google OAuth were not tested within this environment; automated tests check the geometry and code.
