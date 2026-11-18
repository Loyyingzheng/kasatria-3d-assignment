import { formatCurrency } from '../services/peopleMapper.js';

function makeNode(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

export function createPersonCard(person) {
  const tile = makeNode('div', `person-card band-${person.band}`);
  const top = makeNode('div', 'card-top');
  top.append(makeNode('span', 'card-number', String(person.id).padStart(3, '0')));
  top.append(makeNode('span', 'card-country', person.country));
  tile.append(top);

  const photoWrap = makeNode('div', 'card-photo');
  const placeholder = makeNode('div', 'photo-placeholder', person.name.trim().charAt(0).toUpperCase() || '?');
  photoWrap.append(placeholder);
  if (person.photo) {
    const photo = document.createElement('img');
    photo.loading = 'lazy';
    photo.decoding = 'async';
    photo.alt = `Photo of ${person.name}`;
    photo.referrerPolicy = 'no-referrer';
    photo.onerror = () => photo.remove();
    photo.onload = () => { placeholder.style.display = 'none'; };
    photo.src = person.photo;
    photoWrap.append(photo);
  }
  tile.append(photoWrap);
  tile.append(makeNode('div', 'card-name', person.name));
  tile.append(makeNode('div', 'card-meta', `${person.age} years · ${person.interest}`));
  const bottom = makeNode('div', 'card-bottom');
  bottom.append(makeNode('span', 'worth-label', 'NET WORTH'));
  bottom.append(makeNode('strong', 'worth-value', formatCurrency(person.netWorth)));
  tile.append(bottom);
  return tile;
}

