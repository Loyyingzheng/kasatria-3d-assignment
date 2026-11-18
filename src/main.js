import { APP_CONFIG } from './config/appConfig.js';
import { parseSheetValues } from './services/peopleMapper.js';
import {
  createGoogleTokenClient, fetchGoogleProfile, fetchGoogleSheet,
  isGoogleConfigured, revokeGoogleToken, waitForGoogleLibrary,
} from './services/googleApi.js';
import { createFictionalPreview } from './data/previewPeople.js';
import { PeopleVisualizer } from './scene/PeopleVisualizer.js';
import { createSessionStore } from './state/sessionStore.js';
import { element as $, showNotice, showSession, setBusy, setLayoutControls, initWealthLegend } from './ui/appUi.js';

const previewEnabled = ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
  new URLSearchParams(window.location.search).get('preview') === '1';
$('demo-btn').hidden = !previewEnabled;

const session = createSessionStore();
const visualizer = new PeopleVisualizer($('three-container'));
initWealthLegend();

function toggleBusy(busy) {
  session.set({ busy });
  setBusy(busy, Boolean(session.get().tokenClient));
}

function activateLayout(layout) {
  visualizer.changeLayout(layout);
  setLayoutControls(layout);
}

function showRecords(data, { preview = false, profile = null } = {}) {
  let records = data;
  if (records.length > APP_CONFIG.maxRecords) {
    showNotice(`Found ${records.length} records; only the first ${APP_CONFIG.maxRecords} can fit the required layouts.`, 'warning');
    records = records.slice(0, APP_CONFIG.maxRecords);
  } else if (records.length !== APP_CONFIG.maxRecords) {
    showNotice(`Found ${records.length} records. The assignment layout expects ${APP_CONFIG.maxRecords}.`, 'warning');
  } else {
    showNotice('');
  }
  session.set({ preview, profile });
  visualizer.setData(records);
  $('record-count').textContent = String(records.length);
  showSession({ connected: true, preview, profile });
  // On Sheet refresh with the same count, preserve the current user-selected layout.
  setLayoutControls(visualizer.layout);
}

async function loadSheetData(profile) {
  const { accessToken, expiresAt } = session.get();
  if (Date.now() >= expiresAt - 15_000) throw new Error('Google session expired. Sign in again.');
  const values = await fetchGoogleSheet(accessToken);
  const records = parseSheetValues(values);
  showRecords(records, { profile });
}

async function onGoogleToken(accessToken, expiresInSeconds) {
  session.set({ accessToken, expiresAt: Date.now() + expiresInSeconds * 1000 });
  toggleBusy(true);
  showNotice('Google connected. Loading your spreadsheet…');
  try {
    const profile = await fetchGoogleProfile(accessToken);
    await loadSheetData(profile);
  } catch (error) {
    showSession({ connected: false });
    showNotice(error.message, 'error');
  } finally {
    toggleBusy(false);
  }
}

async function initializeGoogle() {
  if (!isGoogleConfigured()) {
    $('login-hint').textContent = previewEnabled
      ? 'Configure Google OAuth and Sheet ID in config.js. Fictional preview is available for testing.'
      : 'Google OAuth or spreadsheet configuration is missing in config.js.';
    return;
  }
  try {
    await waitForGoogleLibrary();
    const tokenClient = createGoogleTokenClient(onGoogleToken, (error) => {
      showNotice(error.message, 'error');
      toggleBusy(false);
    });
    session.set({ tokenClient });
    $('login-hint').textContent = 'Only read-only Google Sheets access is requested. No server stores your data.';
    setBusy(false, true);
  } catch (error) {
    $('login-hint').textContent = error.message;
  }
}

$('google-login-btn').addEventListener('click', () => {
  const { tokenClient, busy } = session.get();
  if (!tokenClient || busy) return;
  showNotice('');
  // Popup is triggered directly by user interaction, avoiding popup blockers.
  tokenClient.requestAccessToken({ prompt: 'select_account consent' });
});

$('demo-btn').addEventListener('click', () => {
  if (!previewEnabled || session.get().busy) return;
  if (session.get().accessToken) revokeGoogleToken(session.get().accessToken);
  session.set({ accessToken: '', expiresAt: 0 });
  showRecords(createFictionalPreview(APP_CONFIG.maxRecords), { preview: true });
  showNotice('Preview mode: fictional data, not the Google Sheet.', 'warning');
});

$('reload-btn').addEventListener('click', async () => {
  const current = session.get();
  if (current.busy || current.preview) return;
  toggleBusy(true);
  showNotice('Refreshing Google Sheets…');
  try {
    const profile = await fetchGoogleProfile(current.accessToken);
    await loadSheetData(profile);
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    toggleBusy(false);
  }
});

$('signout-btn').addEventListener('click', () => {
  const { accessToken, preview, tokenClient } = session.get();
  if (accessToken) revokeGoogleToken(accessToken);
  session.reset();
  session.set({ tokenClient });
  visualizer.setData([]);
  showNotice('');
  showSession({ connected: false });
  setBusy(false, Boolean(tokenClient));
});

document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => activateLayout(button.dataset.layout));
});
window.addEventListener('pagehide', () => visualizer.destroy(), { once: true });

showSession({ connected: false });
setLayoutControls('table');
initializeGoogle();
