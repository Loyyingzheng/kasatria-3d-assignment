import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGoogleSheet, googleConfig } from '../src/services/googleApi.js';
import { createPersonCard, updatePersonCard } from '../src/ui/personCard.js';

// Tiny DOM simulation lets us check in-place card updates without a CDN or browser.
class FakeNode {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.dataset = {};
    this.textContent = '';
    this.hidden = false;
    this.classList = {
      contains: value => this.className.split(' ').includes(value),
      remove: (...names) => { this.className = this.className.split(' ').filter(n => !names.includes(n)).join(' '); },
      add: (...names) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...names])].join(' '); },
    };
  }
  append(...nodes) { this.children.push(...nodes); }
  remove() { this.removed = true; }
  addEventListener() {}
  querySelector(selector) {
    for (const node of this.children) {
      if (selector.startsWith('.') && node.className.split(' ').includes(selector.slice(1))) return node;
      if (node.tagName === selector) return node;
      const found = node.querySelector(selector);
      if (found) return found;
    }
    return null;
  }
}

test('P3: refreshing unchanged photos/text keeps the same card/photo nodes', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: name => new FakeNode(name) };
  try {
    const person = { id: 1, name: 'Lee', country: 'MY', interest: 'Writing', age: 25, photo: 'https://example.org/photo.jpg', netWorth: 250000, band: 'high' };
    const card = createPersonCard(person);
    const photo = card.querySelector('img');
    assert.ok(photo && photo.loading === 'lazy' && photo.decoding === 'async');
    updatePersonCard(card, person);
    assert.strictEqual(card.querySelector('img'), photo);
    const second = { ...person, name: 'Lee Updated', band: 'mid', netWorth: 120000 };
    updatePersonCard(card, second);
    assert.strictEqual(card.querySelector('img'), photo);
    assert.equal(card.querySelector('.card-name').textContent, 'Lee Updated');
    assert.equal(card.querySelector('.worth-value').textContent, '$120,000');
    assert.equal(card.classList.contains('band-mid'), true);
    assert.equal(card.classList.contains('band-high'), false);
  } finally { globalThis.document = previousDocument; }
});

test('P2: Sheets request targets A:F with a bearer token and no mock-data substitution', async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  const requests = [];
  globalThis.window = { KASATRIA_CONFIG: {
    googleClientId: 'test.apps.googleusercontent.com',
    spreadsheetId: 'fakeSheetId', sheetRange: 'A:F',
  } };
  globalThis.fetch = async (url, options) => {
    requests.push({url,options});
    return { ok:true, json: async () => ({values:[['Name','Photo','Age','Country','Interest','Net Worth'],['Lee','','25','MY','Writing','$100,000.00']]}) };
  };
  try {
    assert.equal(googleConfig().range,'A:F');
    const values = await fetchGoogleSheet('fake-token');
    assert.equal(values.length,2);
    assert.match(requests[0].url,/sheets.googleapis.com\/v4\/spreadsheets\/fakeSheetId\/values\/A%3AF/);
    assert.equal(requests[0].options.headers.Authorization,'Bearer fake-token');
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.window = previousWindow;
  }
});
