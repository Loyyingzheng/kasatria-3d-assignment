# Kasatria — P2 / P3 Acceptance Checklist

This report separates *automated checks* from *manual visual/Google integration testing*.

## Automated checks — PASS

Run `npm test`. All 22 Node tests pass:
- Four layouts contain unique card targets and correct cardinality for 200 records.
- Table is 20×10; Grid is 5×4×10; Sphere targets lie on the expected radius.
- Double Helix has 100 A/B paired levels with opposite phase and 2.25 turns.
- Net Worth values including 99,999.99, 100,000, 199,999.99 and 200,000 map to correct bands.
- Google Sheets A:F response is mapped from realistic headers and formatted currency.
- Mocked Google Sheets API request uses the expected URL and bearer token.
- In-place DOM card update keeps existing image node when the URL is unchanged.
- Smoothstep animation easing clamps progress, is monotonic and reaches the final position.

## P3 architectural checks — implemented, device FPS not measured

| Change | Source file |
| --- | --- |
| Event-driven RAF stops at rest | `src/scene/PeopleVisualizer.js` |
| Layout and quaternion preprocessing/cache | `src/scene/PeopleVisualizer.js` |
| Reused animation buffers | `src/scene/PeopleVisualizer.js` |
| Reused CSS3DObjects on same-count data refresh | `src/scene/PeopleVisualizer.js` |
| Reused photo DOM when URL unchanged | `src/ui/personCard.js` |
| Fewer costly styles during animations | `src/styles/app.css` |
| Precomputed responsive camera framing and automatic view reset | `src/scene/cameraFraming.js`, `src/scene/PeopleVisualizer.js` |
| Centralized layout/camera parameters | `src/config/appConfig.js` |

## Manual browser acceptance — PENDING external verification

- [ ] Google OAuth works on deployed GitHub Pages and the account receives the Sheets readonly scope.
- [ ] The shared Google Sheet loads *real* data without using Preview. Check correct tab/range and that evaluator can read the sheet.
- [ ] 200 cards are displayed; red / orange / green match Net Worth values.
- [ ] Table clearly shows 20 columns and 10 rows.
- [ ] Sphere shows the cards on a sphere and supports drag/zoom.
- [ ] Double Helix visibly forms two intertwined card strands WITHOUT blue/purple SVG guide lines.
- [ ] Grid shows 5 columns, 4 rows and 10 depth layers.
- [ ] Switch repeatedly between all layouts during an animation without abrupt snaps/errors.
- [ ] Reload Google Sheet while on Helix; cards should update in place without rebuilding 200 image elements or restarting the layout.
- [ ] Chrome DevTools Performance shows little/no scripting or rendering work when the view is idle.
- [ ] Record animation FPS and frame times on the target computer; compare with the prior ZIP. A 60-FPS claim requires measurements.
- [ ] Test 1280×800, 1920×1080, and narrow laptop/mobile viewports; verify camera resets and no strands are clipped.

### Scope limitation

Automated tests were run in a container that cannot access the Google account or the deployed site through Chromium; browser navigation was blocked by the execution environment. Therefore Google OAuth end-to-end behavior, the actual Google Sheet contents, subjective visual smoothness, and real FPS are **not** marked as verified.
