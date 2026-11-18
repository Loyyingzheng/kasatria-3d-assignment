import { LAYOUT_LABELS, WEALTH_BANDS } from '../config/appConfig.js';

export const element = (id) => document.getElementById(id);

export function showNotice(message = '', type = 'info') {
  const notice = element('notice');
  notice.hidden = !message;
  notice.className = `notice ${type}`;
  notice.textContent = message;
}

export function showSession({ connected, preview = false, profile = null }) {
  for (const id of ['auth-overlay', 'toolbar', 'top-data-bar', 'signout-btn']) {
    element(id).hidden = id === 'auth-overlay' ? connected : !connected;
  }
  element('reload-btn').hidden = !connected || preview;
  const pill = element('source-pill');
  pill.textContent = !connected ? 'Not connected' : preview ? 'Fictional preview' :
    `Google Sheets${profile?.given_name ? ` · ${profile.given_name}` : ''}`;
  pill.classList.toggle('connected', connected && !preview);
  pill.classList.toggle('preview', connected && preview);
}

export function setBusy(busy, hasGoogleClient) {
  element('google-login-btn').disabled = busy || !hasGoogleClient;
  element('reload-btn').disabled = busy;
  element('demo-btn').disabled = busy;
}

export function setLayoutControls(layout) {
  element('layout-caption').textContent = LAYOUT_LABELS[layout];
  document.querySelectorAll('[data-layout]').forEach((button) => {
    const active = button.dataset.layout === layout;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

export function initWealthLegend() {
  element('legend-low').textContent = `< $${WEALTH_BANDS.orangeMin / 1000}K`;
  element('legend-mid').textContent = `$${WEALTH_BANDS.orangeMin / 1000}K–< $${WEALTH_BANDS.greenMin / 1000}K`;
  element('legend-high').textContent = `≥ $${WEALTH_BANDS.greenMin / 1000}K`;
}
