import { formatCurrency } from '../services/peopleMapper.js';

const get = (id) => document.getElementById(id);
/** Display only textContent for spreadsheet values, never injected markup. */
export function showPersonDetail(person) {
  const panel = get('person-detail');
  get('detail-name').textContent = person.name;
  get('detail-age').textContent = String(person.age);
  get('detail-country').textContent = person.country;
  get('detail-interest').textContent = person.interest;
  get('detail-worth').textContent = formatCurrency(person.netWorth);
  const photo = get('detail-photo');
  const fallback = get('detail-initial');
  photo.hidden = true;
  photo.removeAttribute('src');
  fallback.hidden = false;
  fallback.textContent = person.name.trim().charAt(0).toUpperCase() || '?';
  if (person.photo?.startsWith('https://')) {
    photo.onload = () => { photo.hidden = false; fallback.hidden = true; };
    photo.onerror = () => { photo.hidden = true; fallback.hidden = false; };
    photo.src = person.photo;
  }
  panel.hidden = false;
}

export function hidePersonDetail() {
  get('person-detail').hidden = true;
  const photo = get('detail-photo');
  photo.onload = null;
  photo.onerror = null;
  photo.removeAttribute('src');
}
