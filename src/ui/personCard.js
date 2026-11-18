import { formatCurrency } from '../services/peopleMapper.js';

function makeNode(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

function updateText(node, text) {
  const value = String(text);
  if (node.textContent !== value) node.textContent = value;
}

/** A reusable DOM card. Updating data does not recreate the 3D object or reload unchanged photos. */
export function updatePersonCard(tile, person) {
  tile.setAttribute('aria-label', `View details for ${person.name}`);
  const bandClass = `band-${person.band}`;
  if (!tile.classList.contains(bandClass)) {
    tile.classList.remove('band-low', 'band-mid', 'band-high');
    tile.classList.add(bandClass);
  }
  updateText(tile.querySelector('.card-number'), String(person.id).padStart(3, '0'));
  updateText(tile.querySelector('.card-country'), person.country);
  updateText(tile.querySelector('.card-name'), person.name);
  updateText(tile.querySelector('.card-meta'), `${person.age} years · ${person.interest}`);
  updateText(tile.querySelector('.worth-value'), formatCurrency(person.netWorth));

  const wrap = tile.querySelector('.card-photo');
  const placeholder = wrap.querySelector('.photo-placeholder');
  updateText(placeholder, person.name.trim().charAt(0).toUpperCase() || '?');
  const url = person.photo || '';
  const existing = wrap.querySelector('img');
  if (url !== tile.dataset.photo) {
    if (existing) existing.remove();
    placeholder.hidden = false;
    tile.dataset.photo = url;
    if (url) {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.fetchPriority = 'low';
      img.draggable = false;
      img.alt = `Photo of ${person.name}`;
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', () => {
        if (tile.dataset.photo === url) placeholder.hidden = true;
      }, { once: true });
      img.addEventListener('error', () => {
        img.remove();
        if (tile.dataset.photo === url) placeholder.hidden = false;
      }, { once: true });
      img.src = url;
      wrap.append(img);
    }
  } else if (existing && existing.alt !== `Photo of ${person.name}`) {
    existing.alt = `Photo of ${person.name}`;
  }
  return tile;
}

export function createPersonCard(person) {
  const tile = makeNode('div', 'person-card');
  tile.setAttribute('role', 'button');
  tile.tabIndex = 0;
  tile.setAttribute('aria-label', `View details for ${person.name}`);
  const top = makeNode('div', 'card-top');
  top.append(makeNode('span', 'card-number'), makeNode('span', 'card-country'));
  tile.append(top);
  const wrap = makeNode('div', 'card-photo');
  wrap.append(makeNode('div', 'photo-placeholder'));
  tile.append(wrap);
  tile.append(makeNode('div', 'card-name'));
  tile.append(makeNode('div', 'card-meta'));
  const bottom = makeNode('div', 'card-bottom');
  bottom.append(makeNode('span', 'worth-label', 'NET WORTH'), makeNode('strong', 'worth-value'));
  tile.append(bottom);
  return updatePersonCard(tile, person);
}
