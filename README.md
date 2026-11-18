# Kasatria 3D Assignment — Static GitHub Pages Edition

**No Vite, no build step.** Native browser ES modules with Three.js (pinned to v0.181.0 on jsDelivr). The app preserves the original modular source structure: `src/scene`, `src/services`, `src/ui`, `src/config`, `src/state`, `src/styles`.

## What was changed

- `index.html` imports `src/styles/*.css` using regular `<link>` tags and loads `./src/main.js` using a **relative** module path (works in a GitHub Pages project subdirectory).
- Added an import map for `three` and `three/addons/`, pinned to **the same version** of Three.js.
- Switched Google client config from `import.meta.env.VITE_*` to `window.KASATRIA_CONFIG` in `config.js`.
- Removed Vite dependencies/scripts. `npm test` remains optional and requires only Node.js.
- Added `.nojekyll` to publish static files directly from the root of the `main` branch.

## Before using Google Login

1. Import Kasatria-provided `Data Template.csv` into **Google Sheets** (do not upload the CSV to public GitHub). Check the sheet contains the required 200 records and headers.
2. Share the sheet with `lisa@kasatria.com` as the assignment requests. Also share with the Google account(s) you will use to test it.
3. Create a Google Cloud project, enable **Google Sheets API**, configure the OAuth consent screen, and create an OAuth 2.0 **Web application** client.
4. For a local VS Code Live Server on port 5500, add `http://localhost:5500` to **Authorized JavaScript origins**. For the deployed site, add exactly `https://loyyingzheng.github.io` (origin, NOT the full path).
5. If OAuth is in **Testing**, add the reviewer to **Test users** as applicable. The reviewer also needs access to the spreadsheet. These are different settings.
6. Edit **`config.js`** and replace the three placeholder values with the **public** Web Client ID, the Google Sheet ID, and the sheet range (`Sheet1!A:F` unless your tab name differs). Do not put any client secret in the browser.
7. Run through Google Sign-In using the deployed page and verify the live sheet actually loads.

> **Privacy / public deployment:** Every file in a GitHub Pages source repository can be seen by the public. Browser-side `config.js` is necessarily public; a Web OAuth Client ID is not a password. The user still must authorize the scopes and have Sheet access. Never place a Google client secret, service account key, or personal information in the public repository.

## Local run (VS Code)

Open the project folder in VS Code and use the **Live Server** extension, or start a simple HTTP server from the repository root:

```powershell
py -m http.server 5500
```

Then visit `http://localhost:5500`. Do not double-click `index.html` using `file://` as browser ES module imports have local-file restrictions. A network connection is needed to load Three.js and Google Identity Services from their CDNs.

## GitHub Pages (one-time setup)

1. Push the static files (`index.html`, `config.js`, `src/`, `.nojekyll`, etc.) to the existing public repository `Loyyingzheng/kasatria-3d-assignment`.
2. GitHub repository **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
3. The site is expected at `https://loyyingzheng.github.io/kasatria-3d-assignment/` after Pages finishes publishing.
4. With the root-source Pages publishing workflow, future code pushes to `main` trigger publishing without needing Vite or a local build.

## Validate

- Preview demo uses **fictional** records only; the final assessment still requires real Sheet data.
- Verify Google sign-in, the full Sheet retrieval, correct 200 card records, the color thresholds, four layouts, Table 20×10, Grid 5×4×10, and the double-helix behavior in the browser.
- Run `npm test` if Node.js is installed; no `npm install` is required.
- This source transformation was checked using static inspections and unit tests, **not** a full browser OAuth end-to-end test.

## Migrating into your existing Git repository

**Keep your existing `.git` folder** and your local backup. Copy the files from this ZIP into the existing project folder and replace matching files. This ZIP intentionally contains **neither `.git` nor the old `.env`**. Do not push `.env`. If you previously created `docs/` as a generated Vite build, you can remove that folder when switching Pages to `main / (root)`.

```powershell
git status
git add .
git commit -m "refactor: migrate to native modules and GitHub Pages"
git push
```


## Performance improvements (November 2026)

- `PeopleVisualizer` uses **one coordinated transition** rather than two Tween objects per card.
- Transitions interpolate position and quaternion orientation; switching layouts partway through an animation does not jump.
- The CSS3D renderer redraws **only when animation, orbit controls, loading, or resizing actually changes the scene**; requestAnimationFrame stops once TrackballControls damping settles.
- Card drop shadows are removed **only while 3D movement is in progress**, and restored at rest. The original design and all 200 cards are retained.
- `showRecords()` no longer starts the initial Table animation twice.
- Transition duration is shorter and no longer randomized per card, improving responsiveness.

**How to verify on your computer:** Open Chrome DevTools → Performance, record 4–6 seconds while switching Table ↔ Sphere, compare before and after. Look for dropped frames and time spent in Rendering/Painting. Test both 200-card Preview and live Google Sheet. The 19-test suite verifies layout/data logic, DOM node reuse, Sheets request construction and animation easing, but no real-browser FPS results were obtained in this environment. If FPS is still low, consider simplifying card visuals further or using a WebGL-based renderer (which is a larger redesign).

## P2 + P3 one-shot update — 18 November 2026

### P2 — verified with automated tests

- Table: 20 columns × 10 rows, 200 distinct card targets.
- Sphere: all targets placed at the configured radius with outward-facing cards.
- Grid: 5 columns × 4 rows × 10 layers = 200 distinct targets.
- **Double Helix**: 100 paired levels, opposite strands separated by 180°, **2.25 turns** per strand, 44 units height per level. The previous configuration used over five turns and only 24 units between levels, visually resembling a cylinder.
- Double Helix uses two opposite-phase **card strands**, without any artificial blue or purple guide rails; 2.25 turns and wider spacing improve readability.
- Every layout tab recenters the camera and restores a canonical viewing angle and zoom, including repeated clicks on the same tab. Default framing adapts to the viewport size.
- Net Worth threshold tests: `< $100K` is red, `$100K–< $200K` is orange, and `≥ $200K` is green (including exact boundaries).
- Realistic A:F Google Sheets values and API request construction are checked using mocks. Actual Google OAuth/Sheet permission and live browser visuals **require user-side testing**.

### P3 — changes designed to reduce browser work

- Precompute positions and facing quaternions for each layout and cache them by record count.
- Preallocate position and quaternion interpolation buffers; one shared animation timeline instead of 400 tweens for 200 cards.
- **Stop requestAnimationFrame while idle**, resume for animation, interaction, damping and resize.
- Reuse existing `CSS3DObject` and DOM card nodes when the spreadsheet is refreshed with the same number of records.
- Do not replace an image element if its URL has not changed; keep async, lazy, low-priority image loading.
- Remove expensive card shadows only during transitions, restore at rest.
- Add appropriate camera distances by layout so the expanded Double Helix remains visible.
- Respect `prefers-reduced-motion` in layout transitions.
- Avoid restarting an in-progress layout animation when the 200-row sheet refreshes.

### Preview is opt-in on public Pages

The fictional-data button now appears automatically only on localhost / 127.0.0.1, or when the URL explicitly includes `?preview=1`. The real Google Sheets flow is unchanged. The public site **does not silently substitute** fictional data when Google Sheets fails.

### Test and deploy

```powershell
npm test
py -m http.server 5500
# open http://localhost:5500/
# Use the Google login or, for local visual testing, the fictional Preview button.
git add .
git commit -m "feat: validate 3D layouts and optimize CSS3D rendering"
git push
```

Retain your existing local `.git` directory; the deliverable ZIP does not include `.git`, `.env`, or a build output. GitHub Pages stays **Deploy from a branch → main → /(root)**, with no Vite step.

**Manual acceptance:** on a desktop Chrome browser test each layout, orbit/zoom, Google login, 200 real Sheet records, visible red/orange/green boundaries, and live data refresh. Record a Chrome DevTools Performance trace before claiming a measurable FPS improvement; the automated tests cannot prove real-device FPS. See `VALIDATION.md`.

## View switching and performance

- The blue/purple helix guide lines have been removed. Double Helix uses two mathematically opposite card strands and preserves the Net Worth color coding.
- Clicking any layout tab — including the current one — restores that layout’s default viewing angle, center and zoom. Camera position adapts to narrow viewports to reduce clipping.
- The CSS3D scene keeps cached layouts, DOM reuse and event-driven rendering; it does not run continuous RAF while idle.
- Manual testing is still required for actual Chrome FPS, image loading and live Google OAuth.

## Double Helix visibility fix (18 November 2026)

- Previous version correctly placed the cards on two 180°-opposed helices, but the `faceOutward` orientation combined with CSS `backface-visibility: hidden` concealed the far-side cards and made the result look like a **single spiral**. Removing blue/purple guide lines had exposed this problem.
- `layouts.js`: Double Helix positions remain 2.25 full turns per strand, 100 cards per strand, shared axis, exact 180° offset. Mark those 200 targets as `faceCamera` instead of `faceOutward`. Sphere cards still face outward.
- `PeopleVisualizer.js`: initial target quaternions face the canonical helix camera; while orbiting, cards keep their original orientation, with the reverse side visible as a mirror image instead of disappearing. The updated renderer does not add decorative guide geometry or constantly run a RAF while idle.
- `appConfig.js`: modestly adjusts the default helix camera direction to make paired strands visible. Clicking the current layout resets the default camera as before.
- `tests/helix-visibility.test.js`: verifies that every target is camera-facing, all 100 A/B pairs exist, and projected horizontal separation is sufficient away from normal crossovers.
- **Manual check needed:** Open local Preview (or Google Sheets), select Double Helix, see two crossing strands with readable cards, drag to orbit, then click Double Helix again to reset the view. Do not judge the result from the geometry tests alone; browser paint/occlusion still depends on the device.

## Interactive camera and person details (Nov 18 update)

The website now uses **OrbitControls** (not TrackballControls). This is still a
buildless static website. The `three/addons/` import map in `index.html` loads
OrbitControls from the same pinned Three.js version as the renderer.

- **Table 20×10:** the default camera looks straight at the `z=0` wall with
  `up=(0,1,0)`, so it is never tilted by default. Left drag pans; right drag rotates.
- **Sphere:** the default camera also looks straight forward. Left drag rotates.
- **Double Helix / Grid:** keep the designed 3D perspective. Left drag rotates.
- **All four layouts:** wheel zooms towards the pointer (`zoomToCursor`), and
  right-drag pans except on Table. Touch gestures are supported.
- **Click any card field:** camera flies to the selected card and zooms to a
  readable scale; the selected 3D tile itself expands to show the complete
  photo, name, age, country, interest and net worth. The other tiles are hidden
  while reading. The overview tiles support keyboard activation (Enter / Space).
- **Return to overview:** click × on the focused profile, press Escape,
  click `Reset View`, or click the active layout button again. Each layout switch restores
  that view's own default camera and zoom.

### In-scene profile focus (no popup or duplicate data source)

The selected person keeps their real `CSS3DObject` position. `focusPerson()`
computes the world-space front normal and flies the camera to that point,
while slerping the camera orientation so the person's card faces the viewer.
Only the selected DOM card mounts a larger `focus-profile` (320×454 CSS3D units).
The other 199 cards do not pay the cost of rendering full profiles. Photo and
fields are populated from the same parsed Google Sheet record as the overview.
Focus distance is calculated from the expanded profile dimensions, not the
small thumbnail dimensions. The camera transition respects reduced-motion
preferences, and every layout switch restores its default camera pose.

The display reads real Google Sheets data after OAuth sign-in; the fictional
preview remains local-only (or explicitly enabled with `?preview=1`). Do not
commit private Google credentials. Public OAuth Web Client IDs are not secrets.

## Canonical Table reset and visible card backfaces

- Clicking any layout returns the scene to the layout's default camera; for Table, the completion phase snaps **exactly** to `(0, 0, +distance)` with identity camera and card rotation and an origin target. Resize also restores the canonical overview.
- All card backfaces are now visible. Orbiting behind a card shows its mirrored reverse rather than a disappearing tile. A click-to-focus camera flight approaches the selected tile's front normal to keep its text readable.
- Double Helix keeps its two opposite strands and fixed card orientations, without decorative lines or continuous billboarding that could hide the actual 3D rotation.
- Verify the result in desktop Chrome; the automated tests do not measure actual rendering/FPS.
