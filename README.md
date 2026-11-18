# Kasatria — Junior Software Developer Preliminary Assignment

A developer-maintained Vite project evolved from the company-provided Three.js CSS3D periodic-table example and an AI-assisted scaffold that uses **Google OAuth + Google Sheets API** to populate a **Three.js CSS3D** visualization with 200 people. It supports **Table (20×10), Sphere, Double Helix, Grid (5×4×10)** and net-worth color bands.

## 1. Requirements

- Node.js 20.19+ or 22.12+ and npm
- Google account and a Google Cloud project
- The CSV file supplied with the assignment (do **not** commit personal data to a public repo)

## 2. Google Sheets data source

1. Open [Google Sheets](https://sheets.google.com/), create a new spreadsheet.
2. **File > Import > Upload**, select the original `Data Template.csv`.
3. Check it has the 6 headers `Name`, `Photo`, `Age`, `Country`, `Interest`, ` Net Worth ` and **200 data rows**. The code normalizes surrounding spaces in the headers.
4. Click **Share**, add `lisa@kasatria.com` with **Viewer** permission unless the recruiter asks for editing access; send the invitation.
5. Copy the **spreadsheet ID** from `https://docs.google.com/spreadsheets/d/<ID>/edit`.
6. Note the tab name (often `Sheet1`). The application reads via Google Sheets API, not from a hardcoded CSV.

> Google Sheets must be shared with the account(s) that will review it. The person signing in must have spreadsheet permission. A Google Cloud OAuth test user allowance and spreadsheet sharing are two separate steps.

## 3. Google Cloud OAuth configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/), **create a project**.
2. Under **APIs & Services > Library**, enable **Google Sheets API**.
3. Under **Google Auth Platform**, configure **Branding**, **Audience**, **Data Access** and **Clients** (Google occasionally changes console labels).
4. For a student evaluation, set the app to **Testing** if available and add your Google account and `lisa@kasatria.com` to **Test users** (where applicable). Request these scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets.readonly`.
5. Create an OAuth **Web application** client with **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - Your actual deployed HTTPS origin, for example `https://your-project.vercel.app` (origin only: no path or trailing `/`).
6. Copy your Web **Client ID** (ends in `.apps.googleusercontent.com`). No client secret is needed in a static browser app; **never expose client secrets**.
7. Create `.env` from `.env.example`, fill `VITE_GOOGLE_CLIENT_ID`, `VITE_SPREADSHEET_ID`, `VITE_SHEET_RANGE=Sheet1!A:F`.
8. Restart Vite after changing `.env`.

**Important:** A spreadsheet owner using a different Google account from the reviewer must share the sheet with the reviewer. Testing-mode OAuth consent is generally restricted to listed test users and can display unverified-app messaging. This is normal for development, but it must be configured correctly for the reviewer. `spreadsheets.readonly` is a sensitive scope; a fully public production OAuth app can require Google verification. For this assignment, use a restricted test-user setup.

## 4. Run locally

```bash
npm install
cp .env.example .env  # on Windows: copy .env.example .env
# Edit the .env file
npm run dev
```

Open http://localhost:5173. Press **Sign in with Google**, choose the account with sheet access, approve read-only Sheets access, and allow loading. You can preview the 3D arrangements using **200 fictional records** before OAuth is configured; preview is *not* a substitute for completing the Sheets requirement.

## 5. Build, test and deploy

```bash
npm test
npm run build
npm run preview
```

Static deployment on Vercel or Netlify:

- Import the Git repository.
- Build command: `npm run build`.
- Output directory: `dist`.
- Add the three `VITE_*` environment variables to the hosting project.
- Deploy and copy the final URL.
- Add the exact deployed site's **origin** to **Authorized JavaScript origins** in Google Cloud.
- Test the deployed site in a private/incognito browser with the reviewer account before submitting.
- Reply to the recruiter with the deployed URL and (optionally) repository URL.

**Privacy:** This app fetches the sheet directly from each authorized user's browser. It doesn't upload the CSV to your host, persist the Google access token, or embed a service-account key. Never publish the original supplied CSV in your `public/` or GitHub repository. A public website URL does not mean the underlying Sheets content is public.

## 6. How it works

```text
Browser > Google Identity Services OAuth popup
        > access token (in memory only)
        > Google Sheets API (values.get)
        > parse/validate data (six expected columns)
        > CSS3D tiles + net-worth colors
        > target positions for Table/Sphere/Double Helix/Grid
        > tween animations + Trackball camera controls
```

- `src/main.js` — application wiring, sign-in, sheet reloading, preview and logout
- `src/services/googleApi.js` — Google Identity Services / Sheets API integration
- `src/services/peopleMapper.js` — schema checks and net-worth bands
- `src/scene/layouts.js` — four independent positional algorithms
- `src/scene/PeopleVisualizer.js` — Three.js CSS3D camera and transitions
- `src/data/previewPeople.js` — fictional preview records
- `src/styles/tokens.css` + `src/styles/app.css` — shared design tokens and component styling
- `src/config/appConfig.js` — centralized app, layout and wealth-band configuration
- `src/state/sessionStore.js` — in-memory UI/auth session state
- `src/ui/appUi.js`, `src/ui/personCard.js` — UI controls and reusable card creation
- `tests/data.test.js` — data boundaries + layout dimensions + double-helix tests

### Acceptance checklist

- [ ] Shared Google Sheet with `lisa@kasatria.com` with appropriate access (usually **Viewer**).
- [ ] Google OAuth works from local/deployed origin.
- [ ] All **200 real records** load from the sheet; no invalid rows.
- [ ] Tiles display photo, name, age, country, interest, net worth.
- [ ] Red < $100K, Orange $100K–< $200K, Green ≥ $200K.
- [ ] Table 20×10, Sphere, two opposite-phase Helix strands, Grid 5×4×10.
- [ ] Smooth transitions, orbit/zoom controls, responsive browser window.
- [ ] Deployed HTTPS URL accessible and tested with recruiter account.

## Attribution

Based on the overall concept and layout approach of the official Three.js periodic-table demonstration:

- Original example: https://threejs.org/examples/css3d_periodictable.html
- Official source: https://github.com/mrdoob/three.js/blob/master/examples/css3d_periodictable.html
- Three.js license: https://github.com/mrdoob/three.js/blob/master/LICENSE (MIT)

This project uses the `three` NPM package, its `CSS3DRenderer` and `TrackballControls` add-ons. It does not copy the example's periodic-table dataset. Keep the MIT copyright/license attribution when distributing third-party library code.

## Known limitation

The actual Google account authorizations, spreadsheet sharing, OAuth consent screen and deployment are **account-specific** and cannot be completed automatically without access to those accounts. Tests and compilation verify the code paths, but the end-to-end Google login and reviewer permissions must be checked in a browser with the real Cloud project.

## Project provenance

This is **not** the original company HTML unchanged. See `docs/ORIGIN_AND_ARCHITECTURE.md` for a mapping from the company-provided example to the working project. Chinese setup instructions: `docs/SETUP_ZH.md`. The reference source is preserved under `references/`.
