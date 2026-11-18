import { getNetWorthBand } from '../services/peopleMapper.js';

// Deliberately fictional records, only for preview/testing. Do not submit as Google Sheets data.
export function createFictionalPreview(count = 200) {
  const firstNames = ['Avery', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Alex', 'Robin', 'Riley', 'Sam', 'Jamie'];
  const lastNames = ['Chen', 'Rahman', 'Lim', 'Tan', 'Lee', 'Wong', 'Kumar', 'Ng', 'Ong', 'Das'];
  const interests = ['Cooking', 'Traveling', 'Writing', 'Gaming', 'Art', 'Music'];
  const countries = ['MY', 'SG', 'CN', 'AU', 'JP'];
  return Array.from({ length: count }, (_, i) => {
    const netWorth = 40000 + ((i * 7919) % 270000);
    return {
      id: i + 1,
      name: `${firstNames[i % 10]} ${lastNames[Math.floor(i / 10) % 10]}`,
      photo: '',
      age: 21 + ((i * 7) % 35),
      country: countries[i % countries.length],
      interest: interests[i % interests.length],
      netWorth,
      band: getNetWorthBand(netWorth),
    };
  });
}
