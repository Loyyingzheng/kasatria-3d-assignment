import { formatCurrency } from '../services/peopleMapper.js';

/**
 * Readable, in-world profile that is mounted only for the selected CSS3D tile.
 * Keeping the other 199 tiles compact avoids the DOM cost of 200 detail views.
 */
export function getProfileViewModel(person) {
  return {
    number: `#${String(person.id).padStart(3, '0')}`,
    band: String(person.band || 'low').toUpperCase(),
    name: String(person.name ?? ''),
    initial: String(person.name ?? '').trim().charAt(0).toUpperCase() || '?',
    age: String(person.age ?? ''),
    country: String(person.country ?? ''),
    interest: String(person.interest ?? ''),
    netWorth: formatCurrency(person.netWorth),
    photo: typeof person.photo === 'string' && /^https:\/\//i.test(person.photo)
      ? person.photo : '',
  };
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function fact(label, value, className = '') {
  const wrap = node('div', `focus-fact ${className}`.trim());
  wrap.append(node('span', 'focus-label', label), node('strong', 'focus-value', value));
  return wrap;
}

export function createFocusedProfile(person) {
  const view = getProfileViewModel(person);
  const content = node('section', 'focus-profile');
  content.setAttribute('aria-label', `Full profile of ${view.name}`);
  // Long text may scroll inside this card; do not zoom/orbit the background.
  content.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  content.addEventListener('pointerdown', (event) => event.stopPropagation());

  const header = node('div', 'focus-header');
  header.append(node('span', 'focus-number', view.number));
  const right = node('div', 'focus-header-right');
  right.append(node('span', `focus-band band-${person.band}`, view.band));
  const close = node('button', 'focus-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close this profile and restore the overview');
  close.title = 'Back to overview (Esc)';
  // OrbitControls receives pointerdown on the renderer; don't start a drag
  // when the user is simply pressing the profile's close button.
  close.addEventListener('pointerdown', (event) => event.stopPropagation());
  right.append(close);
  header.append(right);
  content.append(header);

  const photoFrame = node('div', 'focus-photo');
  const placeholder = node('span', 'focus-initial', view.initial);
  photoFrame.append(placeholder);
  if (view.photo) {
    const photo = document.createElement('img');
    photo.alt = `Photo of ${view.name}`;
    photo.loading = 'eager';
    photo.decoding = 'async';
    photo.referrerPolicy = 'no-referrer';
    photo.draggable = false;
    photo.addEventListener('load', () => { placeholder.hidden = true; }, { once: true });
    photo.addEventListener('error', () => { photo.remove(); placeholder.hidden = false; }, { once: true });
    photo.src = view.photo;
    photoFrame.append(photo);
  }
  content.append(photoFrame);
  content.append(node('h2', 'focus-name', view.name));

  const facts = node('div', 'focus-facts');
  facts.append(fact('Age', view.age), fact('Country', view.country));
  facts.append(fact('Interest', view.interest, 'focus-fact-wide'));
  content.append(facts);

  content.append(fact('Net Worth', view.netWorth, 'focus-net-worth'));
  content.append(node('span', 'focus-help', 'Esc or × to return to overview'));
  return content;
}
