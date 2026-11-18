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
