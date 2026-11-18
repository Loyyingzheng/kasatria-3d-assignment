const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SCOPES = `openid email profile ${SHEETS_SCOPE}`;

export function googleConfig() {
  return {
    clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim(),
    spreadsheetId: (import.meta.env.VITE_SPREADSHEET_ID ?? '').trim(),
    range: (import.meta.env.VITE_SHEET_RANGE ?? 'Sheet1!A:F').trim(),
  };
}

export function isGoogleConfigured() {
  const cfg = googleConfig();
  return cfg.clientId.endsWith('.apps.googleusercontent.com') &&
    !!cfg.spreadsheetId && !cfg.spreadsheetId.startsWith('YOUR_');
}

export function waitForGoogleLibrary(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error('Google Identity Services failed to load. Check network or extensions.'));
      }
    }, 120);
  });
}

export function createGoogleTokenClient(onSuccess, onError) {
  if (!isGoogleConfigured()) throw new Error('Please configure .env before Google sign-in.');
  return window.google.accounts.oauth2.initTokenClient({
    client_id: googleConfig().clientId,
    scope: SCOPES,
    prompt: 'select_account',
    callback: (result) => {
      if (result.error || !result.access_token) {
        onError(new Error(result.error_description || result.error || 'Google authentication failed.'));
        return;
      }
      onSuccess(result.access_token, Number(result.expires_in || 3600));
    },
    error_callback: (result) => onError(new Error(result.type || 'Google popup was closed or blocked.')),
  });
}

async function googleFetch(url, accessToken) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    let description = '';
    try { description = (await response.json()).error?.message || ''; } catch { /* ignore */ }
    if (response.status === 401) throw new Error('Google session expired. Please sign in again.');
    if (response.status === 403) throw new Error(`Google Sheets access denied. Check API setup and spreadsheet sharing. ${description}`);
    if (response.status === 404) throw new Error('Spreadsheet or tab not found. Check VITE_SPREADSHEET_ID / VITE_SHEET_RANGE.');
    throw new Error(`Google API ${response.status}: ${description || 'Request failed'}`);
  }
  return response.json();
}

export async function fetchGoogleProfile(accessToken) {
  return googleFetch('https://www.googleapis.com/oauth2/v3/userinfo', accessToken);
}

export async function fetchGoogleSheet(accessToken) {
  const { spreadsheetId, range } = googleConfig();
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
  const result = await googleFetch(endpoint, accessToken);
  return result.values ?? [];
}

export function revokeGoogleToken(accessToken) {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
}
