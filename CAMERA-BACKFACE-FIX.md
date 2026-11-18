# Camera reset & reverse-side visibility fix

## Changes

- On finishing a layout transition, reapply the exact precomputed card positions and quaternions.
- Table camera snaps to `(0, 0, +distance)` with target `(0,0,0)`, canonical +Y up and an identity quaternion. No residual orbit roll or off-axis perspective after switching tabs.
- OrbitControls internal state is updated with damping disabled and a canonical state saved. Re-click the Table tab to restore default orientation.
- Every 3D card has `backface-visibility: visible`: from behind, the card shows its mirrored back instead of disappearing. This is **intentional mirrored text**; for readable text, click the card to focus on its front.
- Double Helix no longer reorients all cards every orbit frame. The two strands keep fixed orientation based on their original default camera, remaining double-sided when viewed from the back.
- Card focus approaches the card's front-facing normal in all four layouts, so details remain readable.
- `src/styles` and `src/scene` changes preserve all existing Google Sheets, OAuth, mouse-centered zoom, layout math, DOM reuse and on-demand rendering.

## Manual acceptance in Chrome

1. Open Table, right-drag to rotate it, click Table again, wait for animation: 20×10 rectangles must be level and aligned with the screen, not diagonal.
2. Rotate around behind Table and Grid. Cards show a horizontal mirror image of text, not blank cards.
3. Orbit around Sphere and Double Helix: the far-side cards remain visible from behind (with mirrored text); overlapping cards can still obscure each other due to natural 3D depth.
4. Click a backside card: it should fly to a readable front view and open person details. Reset View or layout tab restores the overview.
5. Verify 200 cards, net-worth bands, Google Sheets and both helix strands; inspect console for module errors.

Automated checks do not replace browser-based acceptance or FPS measurements.
