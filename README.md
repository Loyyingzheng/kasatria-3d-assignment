# Kasatria 3D People Explorer

An interactive 3D people-data visualization developed for the **Kasatria Technologies — Junior Software Developer Preliminary Assignment**.

The application adapts the official [Three.js CSS3D Periodic Table example](https://threejs.org/examples/css3d_periodictable.html) to display up to 200 people from a Google Sheet. Users authenticate with Google, explore four animated 3D arrangements, and select individual cards to read a full profile.

**Live demo:** https://loyyingzheng.github.io/kasatria-3d-assignment/

## Features

- **Google authentication:** Uses Google Identity Services (OAuth 2.0) to request read-only access to the spreadsheet.
- **Live Google Sheets data:** Fetches and validates records from the Google Sheets API; includes an explicit Refresh action.
- **Person cards:** Displays a photo, name, age, country, interest, and net worth, with an expanded detail view for readability.
- **Net-worth categories:** Red for values below $100,000; orange for $100,000 to below $200,000; green for $200,000 and above.
- **Four animated 3D layouts:**
  - **Table:** 20 columns × 10 rows.
  - **Sphere:** Positions cards across a spherical surface.
  - **Double Helix:** Two intertwined strands of 100 cards each, offset by 180°.
  - **Grid:** 5 columns × 4 rows × 10 depth layers.
- **Camera controls:** Pointer-centered zoom, panning, rotation, layout-specific default views, and a Reset View button.
- **Card focus:** Select a card for an enlarged profile; close it or press `Esc` to return to the previous camera position, viewing angle, and zoom level.
- **Local preview:** Optional fictional sample data for development; the public site does not silently replace failed Google Sheets requests with preview data.

## Technology Stack

| Area | Technology |
| --- | --- |
| Web interface | HTML5, CSS3 / modern CSS, vanilla JavaScript (ES Modules) |
| 3D visualization | Three.js `CSS3DRenderer`, `CSS3DObject`, `OrbitControls` |
| Authentication | Google Identity Services, OAuth 2.0 token flow |
| Data source | Google Sheets API v4 |
| Hosting | GitHub Pages |
| Automated testing | Node.js built-in test runner (`node --test`) |

This is a **static, client-side application**: it does not use React, Vite, a custom backend, or a build step. The browser imports Three.js **v0.181.0** and its matching addons through a version-pinned CDN import map.

## Architecture

```text
Google Sign-In
     |
     v
Google OAuth access token
     |
     v
Google Sheets API (read-only)
     |
     v
Data parsing and validation
     |
     v
PeopleVisualizer (Three.js / CSS3DRenderer)
     |
     +-- Table / Sphere / Double Helix / Grid
     +-- Camera navigation and focus / restore
     +-- Person cards and detailed profiles
```

The code is organized by responsibility:

```text
index.html                  Page structure and external script loading
config.js                   Public OAuth client and spreadsheet configuration
src/main.js                 Application orchestration and user actions
src/config/appConfig.js     Layout, camera, and net-worth constants
src/services/googleApi.js  Google OAuth and Sheets API integration
src/services/peopleMapper.js Data validation and normalization
src/scene/layouts.js       Four 3D layout algorithms
src/scene/PeopleVisualizer.js CSS3D scene, controls, and transitions
src/scene/cameraFraming.js Camera fit and focus calculations
src/scene/cameraHistory.js Camera snapshot and restoration
src/state/sessionStore.js  Client-side session state
src/ui/                     Reusable UI, cards, and expanded profiles
src/styles/                 Visual styling and design tokens
tests/                      Automated unit and integration-style tests
```

Layout calculations and data transformation are separated from browser rendering so they can be tested independently.

## Data Format

Import the assignment's CSV into Google Sheets with the following header columns:

| Name | Photo | Age | Country | Interest | Net Worth |
| --- | --- | --- | --- | --- | --- |
| Person name | HTTPS image URL | Integer age | Country | Interest | Numeric amount (e.g., `$125,000`) |

Column headers are normalized before mapping, and invalid records produce validation errors. The visualization supports a maximum of **200 records**, matching the required 20 × 10 Table and 5 × 4 × 10 Grid. Do not commit the assignment CSV or private spreadsheet content to this public repository.

## Google Cloud and Google Sheets Setup

1. Create a Google Sheet and import the provided CSV. Share it with the required reviewer as **Editor** according to the assignment instructions; grant any Google account used to test the app at least read access.
2. In Google Cloud Console, enable the **Google Sheets API** for the project.
3. Configure the **Google Auth Platform** consent screen and create an **OAuth 2.0 Web application client**. If the application is in Testing mode, add intended sign-in accounts under **Test users**.
4. Add the authorized JavaScript origins for the environments you use:
   - Local example: `http://localhost:5500`
   - GitHub Pages: `https://loyyingzheng.github.io`
5. Update the *public* browser configuration in `config.js`:

   ```js
   window.KASATRIA_CONFIG = Object.freeze({
     googleClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
     spreadsheetId: 'YOUR_SPREADSHEET_ID',
     sheetRange: 'A:F',
   });
   ```

6. Sign in from the webpage and approve the requested Google Sheets **read-only** permission. Verify that 200 records load from the actual Sheet.

**Security:** `config.js` is public in the browser. OAuth Web Client IDs and spreadsheet IDs are identifiers, **not secrets**; never include a client secret, service-account key, password, or long-lived access token. Google sign-in and spreadsheet sharing are separate access controls. The application requests `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/spreadsheets.readonly` scopes.

## Run Locally

Serve the repository root using a local HTTP server, for example:

```bash
py -m http.server 5500
```

Then visit **http://localhost:5500/**. Do not open `index.html` directly through `file://`; browser module imports should run over HTTP or HTTPS. Internet access is required for the Three.js and Google Identity Services scripts.

For local UI exploration without Google login, use **Preview with fictional sample data**. Preview is available on `localhost` / `127.0.0.1`, or when explicitly enabled using `?preview=1`. Preview data does not satisfy the assignment's live Google Sheets requirement.

## Interaction Guide

| Action | Table | Sphere / Double Helix / Grid |
| --- | --- | --- |
| Mouse wheel | Zoom toward cursor | Zoom toward cursor |
| Left drag | Pan | Rotate |
| Right drag | Rotate | Pan |
| Click a card | Focus and show full profile | Focus and show full profile |
| Close / `Esc` | Restore the pre-focus view | Restore the pre-focus view |
| Layout button / Reset View | Restore the layout's default view | Restore the layout's default view |

For browser diagnostics, append `?debug=1` to the page URL and inspect the browser Console. Debug helpers are intended for development, not the standard user workflow.

## Testing

Run automated tests with a recent Node.js version:

```bash
npm test
```

Tests cover data parsing and numeric boundaries, layout dimensions and coordinates, Google Sheets request construction with mocks, camera framing and restoration, and card-related interaction logic.

Automated tests do **not** replace manual browser testing. Before submission, verify Google OAuth with an authorized account, live Sheet access, images, all four layouts, card selection, camera restore, and the deployed URL in Chrome.

## Deployment

This repository is designed for **GitHub Pages** without a build pipeline:

1. Push `index.html`, `config.js`, `src/`, `tests/`, and the other project files to the GitHub repository.
2. Open **Repository → Settings → Pages**.
3. Set **Source: Deploy from a branch**, **Branch: `main`**, **Folder: `/(root)`**.
4. Confirm that the site opens at the live demo URL above and that the Google OAuth authorized JavaScript origin matches its domain.

The `.nojekyll` file is intentionally retained to bypass Jekyll processing on GitHub Pages.

## Attribution

The 3D visualization is based on the [official Three.js CSS3D Periodic Table example](https://github.com/mrdoob/three.js/blob/master/examples/css3d_periodictable.html). The assignment-specific data integration, person-card interface, layout variations, and camera interactions are implemented in this project. Three.js is distributed under the [MIT License](https://github.com/mrdoob/three.js/blob/master/LICENSE).
