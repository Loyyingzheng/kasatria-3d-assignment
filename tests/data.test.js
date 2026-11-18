import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNetWorth, getNetWorthBand, parseSheetValues } from '../src/services/peopleMapper.js';
import { buildLayoutTargets } from '../src/scene/layouts.js';

test('net-worth boundaries are deterministic and non-overlapping', () => {
  assert.equal(getNetWorthBand(99999.99), 'low');
  assert.equal(getNetWorthBand(100000), 'mid');
  assert.equal(getNetWorthBand(199999.99), 'mid');
  assert.equal(getNetWorthBand(200000), 'high');
  assert.equal(parseNetWorth(' $251,260.80\u00a0'), 251260.8);
  assert.throws(() => parseNetWorth('not money'));
});

test('Sheet parse works with trailing spaces in " Net Worth " header', () => {
  const rows = [
    ['Name', 'Photo', 'Age', 'Country', 'Interest', ' Net Worth '],
    ['Jane', 'https://example.org/jane.jpg', '25', 'MY', 'Writing', '$251,260.80'],
    ['John', 'javascript:alert(1)', '30', 'SG', 'Cooking', '$99,999.99'],
  ];
  const people = parseSheetValues(rows);
  assert.equal(people.length, 2);
  assert.equal(people[0].band, 'high');
  assert.equal(people[1].band, 'low');
  assert.equal(people[1].photo, '');
});

test('200 distinct slots in 20×10 table and 5×4×10 grid', () => {
  const layouts = buildLayoutTargets(200);
  for (const [name, targets] of Object.entries(layouts)) {
    assert.equal(targets.length, 200, `Wrong ${name} size`);
    const unique = new Set(targets.map((t) => [t.position.x,t.position.y,t.position.z].join(',')));
    assert.equal(unique.size, 200, `Duplicate ${name} locations`);
  }
  assert.equal(new Set(layouts.table.map((o) => o.position.x)).size, 20);
  assert.equal(new Set(layouts.table.map((o) => o.position.y)).size, 10);
  assert.equal(new Set(layouts.grid.map((o) => o.position.x)).size, 5);
  assert.equal(new Set(layouts.grid.map((o) => o.position.y)).size, 4);
  assert.equal(new Set(layouts.grid.map((o) => o.position.z)).size, 10);
});

test('double helix uses two opposite-phase strands', () => {
  const helix = buildLayoutTargets(200).helix;
  for (let step = 0; step < 100; step++) {
    const a = helix[step * 2].position;
    const b = helix[step * 2 + 1].position;
    assert.ok(Math.abs(a.x + b.x) < 1e-7);
    assert.ok(Math.abs(a.z + b.z) < 1e-7);
    assert.equal(a.y, b.y);
  }
});
