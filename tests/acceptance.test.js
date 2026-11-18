import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_CONFIG, LAYOUT_SETTINGS } from '../src/config/appConfig.js';
import { buildLayoutTargets } from '../src/scene/layouts.js';
import { createFictionalPreview } from '../src/data/previewPeople.js';
import { getNetWorthBand, parseSheetValues } from '../src/services/peopleMapper.js';

function near(actual, expected, tolerance = 1e-7) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be near ${expected}`);
}

test('P2: all four layouts have exactly one unique target per record', () => {
  const layouts = buildLayoutTargets(200);
  for (const layout of ['table', 'sphere', 'helix', 'grid']) {
    assert.equal(layouts[layout].length, 200);
    const unique = new Set(layouts[layout].map(({position:p}) =>
      `${p.x.toFixed(6)}:${p.y.toFixed(6)}:${p.z.toFixed(6)}`));
    assert.equal(unique.size, 200, `Overlapping slots in ${layout}`);
  }
});

test('P2: table is 20×10 and every card lies on z=0', () => {
  const table = buildLayoutTargets(200).table;
  assert.equal(new Set(table.map(({position:p}) => p.x)).size, 20);
  assert.equal(new Set(table.map(({position:p}) => p.y)).size, 10);
  assert.ok(table.every(({position:p}) => p.z === 0));
});

test('P2: grid has 5 columns, 4 rows, 10 depth layers', () => {
  const grid = buildLayoutTargets(200).grid;
  for (const [axis, amount] of [['x', 5], ['y', 4], ['z', 10]]) {
    assert.equal(new Set(grid.map(({position:p}) => p[axis])).size, amount);
  }
  assert.equal(new Set(grid.map(({position:p}) =>
    `${p.x}:${p.y}:${p.z}`)).size, 5 * 4 * 10);
});

test('P2: sphere evenly distributed on intended radius and faces outward', () => {
  const sphere = buildLayoutTargets(200).sphere;
  for (const {position:p, faceOutward} of sphere) {
    near(Math.hypot(p.x,p.y,p.z), LAYOUT_SETTINGS.sphere.radius);
    assert.equal(faceOutward, true);
  }
});

test('P2: double helix has 100 paired positions, 180-degree phase shift, and 2.25 turns', () => {
  const helix = buildLayoutTargets(200).helix;
  const radius = LAYOUT_SETTINGS.helix.radius;
  for (let step = 0; step < 100; step++) {
    const a = helix[step * 2], b = helix[step * 2 + 1];
    assert.equal(a.strand, 0); assert.equal(b.strand, 1);
    assert.equal(a.step, step); assert.equal(b.step, step);
    near(a.position.x, -b.position.x);
    near(a.position.y, b.position.y);
    near(a.position.z, -b.position.z);
    near(Math.hypot(a.position.x,a.position.z), radius);
    near(Math.hypot(b.position.x,b.position.z), radius);
    assert.equal(a.horizontalFacing, true);
  }
  near(helix[0].position.y - helix[198].position.y, 99 * LAYOUT_SETTINGS.helix.rowSpacing);
  // A single strand must travel 2.25 turns, not 5+ turns like the old cylinder-looking result.
  assert.ok(LAYOUT_SETTINGS.helix.turns > 2 && LAYOUT_SETTINGS.helix.turns < 3);
  assert.ok(APP_CONFIG.cameraDistances.helix > APP_CONFIG.cameraDistances.table);
});

test('P2: Net Worth boundaries and all 200 preview records use correct bands', () => {
  assert.equal(getNetWorthBand(0), 'low');
  assert.equal(getNetWorthBand(99999.99), 'low');
  assert.equal(getNetWorthBand(100000), 'mid');
  assert.equal(getNetWorthBand(199999.99), 'mid');
  assert.equal(getNetWorthBand(200000), 'high');
  const people = createFictionalPreview(200);
  assert.equal(people.length, 200);
  for (const person of people) assert.equal(person.band, getNetWorthBand(person.netWorth));
});

test('P2: realistic Google Sheets A:F rows map correctly, including comma-formatted net worth', () => {
  const headers = ['Name','Photo','Age','Country','Interest','Net Worth'];
  const values = [headers,
    ['Lee Siew Suan','https://example.com/a.jpg','25','CN','Writing','$251,260.80'],
    ['Example Orange','','30','MY','Cooking','$106,555.20'],
    ['Example Red','','32','SG','Music','$99,999.99'],
  ];
  const rows = parseSheetValues(values);
  assert.deepEqual(rows.map(x=>x.band), ['high','mid','low']);
  assert.deepEqual(rows.map(x=>x.name), ['Lee Siew Suan','Example Orange','Example Red']);
});

test('P2: invalid count prevents silent layout overflow', () => {
  assert.throws(() => buildLayoutTargets(201), RangeError);
  assert.throws(() => buildLayoutTargets(-1), RangeError);
  assert.deepEqual(buildLayoutTargets(0).table, []);
});
