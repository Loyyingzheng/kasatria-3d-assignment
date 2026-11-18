# Kasatria — Click-to-focus profile update

## Behavior
- Clicking any field of a compact card (photo, name, country, interest, wealth) opens that person's full profile **inside the original CSS3D tile**, not in a separate fixed sidebar.
- The camera travels to the real card position and faces its front normal using a quaternion-slerped flight. The profile is fitted to the browser viewport (320 x 454 CSS3D units).
- Each real profile shows its record number, net-worth band, photo, name, age, country, interest and formatted net worth.
- Other compact tiles are temporarily hidden only during profile focus, improving readability and avoiding visual overlap.
- A visible `×`, Escape, Reset View or any layout tab restores the default overview. The default Table is front-facing.
- Four layout camera framing, `zoomToCursor`, DOM reuse, and the Google Sheets integration are unchanged.
- No demo profile is hardcoded into the selected-card component: it receives the person object produced by the actual Google Sheet parser. Fictional preview remains a separate, explicitly activated development feature.

## Source files changed
- `src/ui/personDetail.js` — on-demand full profile component, no direct HTML injection of Sheet values
- `src/ui/personCard.js` — compact/detail toggle and reuse on data refresh
- `src/scene/PeopleVisualizer.js` — camera flies to real world position and aligns with tile rotation; click/close/reset routing
- `src/scene/cameraFraming.js` and `src/config/appConfig.js` — responsive full-profile fitting
- `src/styles/app.css` — large, readable in-scene profile styles
- `src/main.js`, `index.html` — remove the duplicate fixed sidebar
- `README.md`, `INTERACTION-VALIDATION.md` and tests

## How to test manually in Chrome
1. Run `py -m http.server 5500` inside the project and open `http://localhost:5500/?preview=1`, then select Preview. This uses explicitly labeled fictional sample data only for interaction testing.
2. In **Table**, click a card including its picture/text: it should move to screen center and show all fields; the card should look upright and the background tiles should disappear.
3. Press `Esc` or click `×`: the 20×10 overview should return. Right-drag the view, then click `Table` again to verify the default angle resets.
4. Repeat with **Sphere**, **Double Helix**, and **Grid**, including selecting cards after rotating to the back.
5. Confirm wheel zoom remains cursor-centered on an overview and drag does not accidentally open a profile.
6. Test with real Google login and Sheets data, verifying the expanded values come from your own Sheet, not the preview data.
7. Try narrow browser widths, long country/interest strings, and a missing photograph.

## Verification
`npm test`: 39 passing automated tests. JavaScript syntax and relative import-path checks pass.

Full visual/FPS validation in real Chrome remains necessary; headless Chromium in the execution environment did not produce a screenshot before timing out, so no unverified smoothness or pixel-perfect claim is made.
