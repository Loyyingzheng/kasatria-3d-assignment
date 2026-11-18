import { WEALTH_BANDS } from '../config/appConfig.js';
/** Pure validation and display-data functions; no DOM or Google-specific logic. */
export const REQUIRED_FIELDS = ['name', 'photo', 'age', 'country', 'interest', 'networth'];

export function getNetWorthBand(amount) {
  if (!Number.isFinite(amount)) throw new Error('Net worth must be numeric.');
  if (amount >= WEALTH_BANDS.greenMin) return 'high';
  if (amount >= WEALTH_BANDS.orangeMin) return 'mid';
  return 'low';
}

export function parseNetWorth(raw) {
  const cleaned = String(raw ?? '').replace(/[$,\s\u00a0]/g, '');
  if (!cleaned || !/^-?\d+(?:\.\d+)?$/.test(cleaned)) {
    throw new Error(`Invalid net worth: ${String(raw)}`);
  }
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) throw new Error('Net worth is too large.');
  return amount;
}

export function normalizeHeader(raw) {
  return String(raw ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
}

/** Convert a Google Sheets values response to strongly validated display records. */
export function parseSheetValues(values) {
  if (!Array.isArray(values) || values.length < 2) throw new Error('Google Sheet has no data rows.');
  const headers = values[0].map(normalizeHeader);
  const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);
  const indices = Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, headers.indexOf(field)]));

  const records = [];
  const errors = [];
  for (let rowNumber = 2; rowNumber <= values.length; rowNumber++) {
    const row = values[rowNumber - 1] ?? [];
    if (row.every((cell) => !String(cell ?? '').trim())) continue;
    try {
      const field = (key) => String(row[indices[key]] ?? '').trim();
      const name = field('name');
      if (!name) throw new Error('Missing name');
      const age = Number(field('age'));
      if (!Number.isInteger(age) || age < 0 || age > 125) throw new Error('Invalid age');
      const photo = field('photo');
      // External images must be HTTPS. Untrusted schemes/data URLs are rejected.
      const image = /^https:\/\//i.test(photo) ? photo : '';
      const netWorth = parseNetWorth(field('networth'));
      records.push({
        id: records.length + 1,
        name,
        photo: image,
        age,
        country: field('country') || '—',
        interest: field('interest') || '—',
        netWorth,
        band: getNetWorthBand(netWorth),
      });
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error.message}`);
    }
  }
  if (errors.length) throw new Error(`Sheet contains ${errors.length} invalid row(s): ${errors.slice(0, 3).join('; ')}`);
  if (!records.length) throw new Error('No valid rows found in the sheet.');
  return records;
}

export function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
