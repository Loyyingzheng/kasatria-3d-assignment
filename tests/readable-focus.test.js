import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCardFocusDistance } from '../src/scene/cameraFraming.js';
import { getProfileViewModel } from '../src/ui/personDetail.js';
import { APP_CONFIG } from '../src/config/appConfig.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const visualizer = read('../src/scene/PeopleVisualizer.js');
const personCard = read('../src/ui/personCard.js');
const css = read('../src/styles/app.css');
const entry = read('../src/main.js');

test('profile is populated from the selected person, not an embedded Jane Doe sample', () => {
  const profile = getProfileViewModel({
    id: 17, name: 'Person From Sheet', photo: 'https://example.org/image.jpg',
    age: 37, country: 'MY', interest: 'Travel & Technology',
    netWorth: 250000.25, band: 'high',
  });
  assert.deepEqual(profile, {
    number: '#017', band: 'HIGH', name: 'Person From Sheet',
    initial: 'P', age: '37', country: 'MY', interest: 'Travel & Technology',
    netWorth: '$250,000', photo: 'https://example.org/image.jpg',
  });
});

test('profile model does not accept non-HTTPS photo URLs', () => {
  const basic = { id: 2, name: 'Jane', age: 28, country: 'MY', interest: 'Art',
    netWorth: 100000, band: 'mid' };
  assert.equal(getProfileViewModel({ ...basic, photo: 'javascript:alert(1)' }).photo, '');
  assert.equal(getProfileViewModel({ ...basic, photo: 'http://example.com/a.jpg' }).photo, '');
});

test('camera distance fits the FULL readable profile on mobile and desktop', () => {
  const { width: cardW, height: cardH } = APP_CONFIG.focusCard;
  assert.ok(cardW > 280 && cardH > 400);
  for (const [w, h] of [[1600, 900], [1024, 700], [390, 620], [320, 450]]) {
    const distance = getCardFocusDistance(w, h);
    const focal = h / (2 * Math.tan(46 * Math.PI / 360));
    const projectedW = cardW * focal / distance;
    const projectedH = cardH * focal / distance;
    assert.ok(projectedW <= w * APP_CONFIG.focusedCardFill.width + 1);
    assert.ok(projectedH <= h * APP_CONFIG.focusedCardFill.height + 1);
    assert.ok(projectedW > 90 && projectedH > 160);
  }
});

test('selected card stays at its actual 3D position while the camera moves in front', () => {
  assert.match(visualizer, /this\._endTarget\.copy\(object\.position\)/);
  assert.match(visualizer, /this\._endCamera\.copy\(object\.position\)\.addScaledVector\(direction, distance\)/);
  assert.match(visualizer, /this\._endCameraQuaternion\.copy\(object\.quaternion\)/);
  assert.match(visualizer, /camera\.quaternion\.slerpQuaternions/);
  assert.match(visualizer, /_cameraLookAtMatrix\.lookAt\(/);
  assert.match(visualizer, /event\.target\.closest\?\.\('\.focus-close'\)/);
  assert.doesNotMatch(visualizer, /this\.objects\[index\]\.position\.set\(0/);
});

test('full details are created on-demand for only the selected CSS3D card', () => {
  assert.match(personCard, /export function showFocusedCard/);
  assert.match(personCard, /tile\.append\(createFocusedProfile\(person\)\)/);
  assert.match(personCard, /export function hideFocusedCard/);
  assert.match(personCard, /querySelector\('\.focus-profile'\)\?\.remove\(\)/);
  assert.match(css, /\.person-card\.is-focus-target\s*\{/);
  assert.match(css, /\.person-card\.is-focus-target \.card-compact\s*\{ display: none; \}/);
  assert.match(css, /\.focus-photo img/);
  assert.match(css, /\.focus-net-worth/);
  assert.doesNotMatch(entry, /showPersonDetail\(/);
});

// A minimal browser-like DOM is sufficient for behavioral tests of on-demand
// profile creation without downloading Three.js or a DOM framework.
class MockNode {
  constructor(tag) {
    this.tagName = tag;
    this.className = '';
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.textContent = '';
    this.style = { setProperty: (key, value) => { this.style[key] = value; } };
    this.classList = {
      contains: (key) => this.className.split(' ').includes(key),
      add: (...keys) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...keys])].join(' '); },
      remove: (...keys) => { this.className = this.className.split(' ').filter(key => !keys.includes(key)).join(' '); },
    };
  }
  append(...items) { for (const item of items) { item.parentNode = this; this.children.push(item); } }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); }
  replaceWith(next) {
    if (!this.parentNode) return;
    const i = this.parentNode.children.indexOf(this);
    if (i >= 0) { this.parentNode.children[i] = next; next.parentNode = this.parentNode; }
  }
  addEventListener() {}
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.') && child.className.split(' ').includes(selector.slice(1))) return child;
      if (child.tagName === selector) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
}

test('DOM: a clicked card expands at its existing node with real data and closes cleanly', async () => {
  const { createPersonCard, showFocusedCard, hideFocusedCard, updatePersonCard } = await import('../src/ui/personCard.js');
  const oldDocument = globalThis.document;
  globalThis.document = { createElement: (tag) => new MockNode(tag) };
  try {
    const person = {id: 3, name: 'Real Sheet Person', photo: 'https://example.org/p.jpg',
      age: 34, country: 'MY', interest: 'Photography', netWorth: 220000, band: 'high'};
    const tile = createPersonCard(person);
    const compactPhoto = tile.querySelector('.card-photo').querySelector('img');
    assert.equal(tile.querySelector('.focus-profile'), null, 'no full DOM before selection');
    showFocusedCard(tile, person);
    assert.equal(tile.classList.contains('is-focus-target'), true);
    assert.equal(tile.getAttribute('role'), 'group');
    assert.equal(tile.querySelector('.focus-name').textContent, person.name);
    assert.equal(tile.querySelector('.focus-net-worth').querySelector('.focus-value').textContent, '$220,000');
    assert.equal(tile.querySelector('.focus-photo').querySelector('img').src, person.photo);
    assert.equal(tile.querySelector('.focus-photo').querySelector('img').loading, 'eager');
    assert.ok(tile.querySelector('.focus-close'));

    const updated = {...person, interest: 'Travel & Technology', age: 35, netWorth: 230000};
    updatePersonCard(tile, updated);
    assert.equal(tile.querySelector('.focus-fact-wide').querySelector('.focus-value').textContent, 'Travel & Technology');
    assert.equal(tile.querySelector('.focus-net-worth').querySelector('.focus-value').textContent, '$230,000');
    hideFocusedCard(tile);
    assert.equal(tile.classList.contains('is-focus-target'), false);
    assert.equal(tile.getAttribute('role'), 'button');
    assert.equal(tile.tabIndex, 0);
    assert.equal(tile.querySelector('.focus-profile'), null, 'detail DOM removed after closing');
    assert.equal(tile.querySelector('.card-photo').querySelector('img'), compactPhoto, 'thumbnail reused');
  } finally {
    globalThis.document = oldDocument;
  }
});
